// Keep authentication unit tests independent of Postgres, email, and token generation.
jest.mock("../../config/db.js", () => ({ query: jest.fn() }));
jest.mock("bcrypt", () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock("jsonwebtoken", () => ({ sign: jest.fn() }));
jest.mock("crypto", () => ({
    randomBytes: jest.fn(() => ({ toString: () => "plain-verification-token" })),
    createHash: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn(() => "hashed-verification-token"),
    })),
}));
jest.mock("../../controllers/emailService.js", () => ({ sendVerificationEmail: jest.fn() }));
jest.mock("../../controllers/notifications.js", () => ({ createNotification: jest.fn() }));

const pool = require("../../config/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendVerificationEmail } = require("../../controllers/emailService.js");
const { createNotification } = require("../../controllers/notifications.js");
const {
    registerTenant,
    loginTenant,
    logoutTenant,
    registerLandlord,
    loginLandlord,
    logoutLandlord,
    registerAdmin,
    loginAdmin,
    logoutAdmin,
} = require("../../controllers/auth.js");

const createResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    cookie: jest.fn(),
    clearCookie: jest.fn(),
});

const validTenant = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phoneNumber: "0712345678",
    apartmentNumber: "A1",
    leaseStartDate: "2026-01-01",
    leaseEndDate: "2026-03-01",
    password: "Password1!",
};

const validLandlord = {
    firstName: "Jane",
    lastName: "Doe",
    email: "landlord@example.com",
    phoneNumber: "0712345678",
    password: "Password1!",
};

const validAdmin = { email: "admin@example.com", password: "Password1!" };

beforeEach(() => {
    jest.clearAllMocks();
});

describe("registerTenant", () => {
    it("requires all registration and lease fields", async () => {
        const res = createResponse();

        await registerTenant({ body: {} }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "All fields are required." });
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("rejects a lease shorter than two months", async () => {
        const res = createResponse();

        await registerTenant({ body: { ...validTenant, leaseEndDate: "2026-02-01" } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Lease must be at least 2 months long." });
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("does not register an email that already belongs to a tenant", async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
        const res = createResponse();

        await registerTenant({ body: validTenant }, res);

        expect(pool.query).toHaveBeenCalledWith("SELECT * FROM tenants WHERE email = $1", [validTenant.email]);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith("You already registered. Please login to proceed.");
    });

    it("creates a tenant, leases the apartment, and sends verification notifications", async () => {
        const tenant = { id: 10, ...validTenant };
        // Email, phone, listing, occupancy, insert, listing update, then transaction commit.
        pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ apartmentnumber: "A1" }] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [tenant] })
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({});
        bcrypt.hash.mockResolvedValueOnce("hashed-password");
        sendVerificationEmail.mockResolvedValueOnce();
        createNotification.mockResolvedValue();
        const res = createResponse();

        await registerTenant({ body: validTenant }, res);

        expect(bcrypt.hash).toHaveBeenCalledWith(validTenant.password, 10);
        expect(pool.query).toHaveBeenCalledTimes(7);
        expect(sendVerificationEmail).toHaveBeenCalledWith(validTenant.email, "plain-verification-token");
        expect(createNotification).toHaveBeenCalledTimes(2);
        expect(pool.query).toHaveBeenLastCalledWith("COMMIT");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ message: "You have registered successfully.", tenant });
    });
});

describe("loginTenant", () => {
    it("returns 401 when the tenant email does not exist", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });
        const res = createResponse();

        await loginTenant({ body: { email: "missing@example.com", password: "Password1!" }, cookies: {} }, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials." });
    });

    it("sets a tenant session after valid credentials", async () => {
        const tenant = { id: 1, firstname: "John", email: "john@example.com", password: "hashed-password" };
        pool.query.mockResolvedValueOnce({ rows: [tenant] });
        bcrypt.compare.mockResolvedValueOnce(true);
        jwt.sign.mockReturnValueOnce("tenant-token");
        const res = createResponse();

        await loginTenant({ body: { email: tenant.email, password: "Password1!" }, cookies: {} }, res);

        expect(res.cookie).toHaveBeenCalledWith("tenantSession", "tenant-token", expect.any(Object));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Login successful",
            tenant: { id: 1, firstName: "John", email: "john@example.com" },
        });
    });
});

describe("logoutTenant", () => {
    it("rejects logout when no tenant session exists", async () => {
        const res = createResponse();

        await logoutTenant({ cookies: {} }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "You are not logged in." });
    });

    it("clears an existing tenant session", async () => {
        const res = createResponse();

        await logoutTenant({ cookies: { tenantSession: "tenant-token" } }, res);

        expect(res.clearCookie).toHaveBeenCalledWith("tenantSession");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Logout Successful" });
    });
});

describe("registerLandlord", () => {
    it("requires all landlord registration fields", async () => {
        const res = createResponse();

        await registerLandlord({ body: {} }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "All fields are required." });
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("registers a landlord after email and phone checks", async () => {
        const landlord = { id: 2, firstName: "Jane", lastName: "Doe", email: validLandlord.email, phoneNumber: validLandlord.phoneNumber };
        pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [landlord] });
        bcrypt.hash.mockResolvedValueOnce("hashed-password");
        const res = createResponse();

        await registerLandlord({ body: validLandlord }, res);

        expect(bcrypt.hash).toHaveBeenCalledWith(validLandlord.password, 10);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ message: "Landlord registered successfully.", landlord });
    });
});

describe("loginLandlord", () => {
    it("returns 401 when the landlord email does not exist", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });
        const res = createResponse();

        await loginLandlord({ body: { email: "missing@example.com", password: "Password1!" }, cookies: {} }, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials." });
    });

    it("sets a landlord session after valid credentials", async () => {
        const landlord = { id: 2, firstname: "Jane", email: validLandlord.email, password: "hashed-password" };
        pool.query.mockResolvedValueOnce({ rows: [landlord] });
        bcrypt.compare.mockResolvedValueOnce(true);
        jwt.sign.mockReturnValueOnce("landlord-token");
        const res = createResponse();

        await loginLandlord({ body: { email: landlord.email, password: "Password1!" }, cookies: {} }, res);

        expect(res.cookie).toHaveBeenCalledWith("landlordSession", "landlord-token", expect.any(Object));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Login successful" });
    });
});

describe("logoutLandlord", () => {
    it("rejects logout when no landlord session exists", async () => {
        const res = createResponse();

        await logoutLandlord({ cookies: {} }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "You are not logged in." });
    });

    it("clears an existing landlord session", async () => {
        const res = createResponse();

        await logoutLandlord({ cookies: { landlordSession: "landlord-token" } }, res);

        expect(res.clearCookie).toHaveBeenCalledWith("landlordSession");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Logout Successful" });
    });
});

describe("registerAdmin", () => {
    it("requires an email and password", async () => {
        const res = createResponse();

        await registerAdmin({ body: {} }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "All fields are required." });
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("registers an administrator after checking the email", async () => {
        const admin = { id: 3, email: validAdmin.email };
        pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [admin] });
        bcrypt.hash.mockResolvedValueOnce("hashed-password");
        const res = createResponse();

        await registerAdmin({ body: validAdmin }, res);

        expect(bcrypt.hash).toHaveBeenCalledWith(validAdmin.password, 10);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ message: "Admin registered successfully.", admin });
    });
});

describe("loginAdmin", () => {
    it("returns 401 when the administrator email does not exist", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });
        const res = createResponse();

        await loginAdmin({ body: { email: "missing@example.com", password: "Password1!" } }, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    it("sets an admin session after valid credentials", async () => {
        const admin = { id: 3, password: "hashed-password" };
        pool.query.mockResolvedValueOnce({ rows: [admin] });
        bcrypt.compare.mockResolvedValueOnce(true);
        jwt.sign.mockReturnValueOnce("admin-token");
        const res = createResponse();

        await loginAdmin({ body: validAdmin }, res);

        expect(res.cookie).toHaveBeenCalledWith("adminSession", "admin-token", expect.any(Object));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Login successful", admin: { id: 3 } });
    });
});

describe("logoutAdmin", () => {
    it("rejects logout when no admin session exists", async () => {
        const res = createResponse();

        await logoutAdmin({ cookies: {} }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "You are not logged in." });
    });

    it("clears an existing admin session", async () => {
        const res = createResponse();

        await logoutAdmin({ cookies: { adminSession: "admin-token" } }, res);

        expect(res.clearCookie).toHaveBeenCalledWith("adminSession");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Logout Successful" });
    });
});

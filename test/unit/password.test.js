jest.mock("../../config/db", () => ({ query: jest.fn() }));
jest.mock("bcrypt", () => ({ genSalt: jest.fn(), hash: jest.fn() }));
jest.mock("crypto", () => ({ randomBytes: jest.fn(() => ({ toString: () => "plain-token" })), createHash: jest.fn(() => ({ update: jest.fn().mockReturnThis(), digest: jest.fn(() => "hashed-token") })) }));
jest.mock("../../controllers/emailService", () => ({ sendPasswordResetEmail: jest.fn() }));
jest.mock("../../controllers/notifications", () => ({ createNotification: jest.fn() }));
const pool = require("../../config/db"); const bcrypt = require("bcrypt");
const { sendPasswordResetEmail } = require("../../controllers/emailService"); const { createNotification } = require("../../controllers/notifications");
const { resetPasswordEmail, resetPasswordToken } = require("../../controllers/password");
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => jest.clearAllMocks());
describe("resetPasswordEmail", () => {
    it("requires an email", async () => { const res = response(); await resetPasswordEmail({ body: {} }, res); expect(res.status).toHaveBeenCalledWith(400); });
    it("stores a token and emails an existing tenant", async () => { pool.query.mockResolvedValueOnce({ rows: [{ id: 4 }] }).mockResolvedValueOnce({}); sendPasswordResetEmail.mockResolvedValueOnce(); const res = response(); await resetPasswordEmail({ body: { email: "tenant@example.com" } }, res); expect(sendPasswordResetEmail).toHaveBeenCalledWith("tenant@example.com", "plain-token"); expect(res.status).toHaveBeenCalledWith(200); });
});
describe("resetPasswordToken", () => {
    it("rejects an invalid or expired token", async () => { pool.query.mockResolvedValueOnce({ rows: [] }); const res = response(); await resetPasswordToken({ body: { token: "bad", newPassword: "NewPassword1!", confirmPassword: "NewPassword1!" } }, res); expect(res.status).toHaveBeenCalledWith(400); expect(bcrypt.hash).not.toHaveBeenCalled(); });
    it("updates the password and notifies the tenant", async () => { pool.query.mockResolvedValueOnce({ rows: [{ id: 4 }] }).mockResolvedValueOnce({}); bcrypt.genSalt.mockResolvedValueOnce("salt"); bcrypt.hash.mockResolvedValueOnce("hash"); createNotification.mockResolvedValueOnce(); const res = response(); await resetPasswordToken({ body: { token: "valid", newPassword: "NewPassword1!", confirmPassword: "NewPassword1!" } }, res); expect(createNotification).toHaveBeenCalledWith(4, expect.any(String)); expect(res.status).toHaveBeenCalledWith(200); });
});

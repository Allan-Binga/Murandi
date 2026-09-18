jest.mock("../../config/db", () => ({ query: jest.fn() }));
jest.mock("../../controllers/emailService", () => ({ sendMaintenanceRequestEmail: jest.fn() }));
jest.mock("../../controllers/reports", () => ({ createMaintenanceReport: jest.fn() }));
jest.mock("../../controllers/notifications", () => ({ createNotification: jest.fn() }));

const pool = require("../../config/db");
const { createMaintenanceReport } = require("../../controllers/reports");
const { createNotification } = require("../../controllers/notifications");
const { getRequests, getUserRequest, createRequest, completeRequest } = require("../../controllers/maintenanceRequest");
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, "setTimeout").mockImplementation(() => 0);
    // Error paths are intentional in these tests; keep their controller logs out of Jest output.
    jest.spyOn(console, "error").mockImplementation();
});
afterEach(() => jest.restoreAllMocks());

describe("getRequests", () => {
    it("returns all maintenance requests", async () => {
        const requests = [{ request_id: 1, firstname: "John" }];
        pool.query.mockResolvedValueOnce({ rows: requests });
        const res = response();
        await getRequests({}, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(requests);
    });
    it("returns 500 when requests cannot be fetched", async () => {
        pool.query.mockRejectedValueOnce(new Error("db"));
        const res = response();
        await getRequests({}, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch requests." });
    });
});

describe("getUserRequest", () => {
    it("returns requests belonging to the authenticated tenant", async () => {
        const requests = [{ request_id: 1, tenant_id: 4 }];
        pool.query.mockResolvedValueOnce({ rows: requests });
        const res = response();
        await getUserRequest({ tenantId: 4 }, res);
        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [4]);
        expect(res.json).toHaveBeenCalledWith(requests);
    });
    it("returns 500 when the tenant request query fails", async () => {
        pool.query.mockRejectedValueOnce(new Error("db"));
        const res = response();
        await getUserRequest({ tenantId: 4 }, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch tenant requests." });
    });
});

describe("createRequest", () => {
    it("requires a description and category", async () => {
        const res = response();
        await createRequest({ tenantId: 4, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(pool.query).not.toHaveBeenCalled();
    });
    it("creates a request even when no matching technician is available", async () => {
        const request = { request_id: 1, tenant_id: 4, category: "Plumbing" };
        // Insert request, find technician, then find tenant email.
        pool.query
            .mockResolvedValueOnce({ rows: [request] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });
        const res = response();
        await createRequest({ tenantId: 4, body: { issueDescription: "Leaking tap", category: "Plumbing" } }, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: "Request submitted but no technician available for this category.", request,
        });
    });
});

describe("completeRequest", () => {
    it("returns 404 when the request does not exist", async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
        const res = response();
        await completeRequest({ params: { id: 1 } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Request not found." });
    });
    it("completes a request, creates a report, and notifies the tenant", async () => {
        const request = { request_id: 1, tenant_id: 4, issue_description: "Leak", category: "Plumbing" };
        pool.query
            .mockResolvedValueOnce({ rowCount: 1, rows: [request] })
            .mockResolvedValueOnce({ rows: [{ firstname: "John", lastname: "Doe", apartmentnumber: "A1" }] })
            .mockResolvedValueOnce({});
        createMaintenanceReport.mockResolvedValueOnce({ id: 9 });
        createNotification.mockResolvedValueOnce();
        const res = response();
        await completeRequest({ params: { id: 1 } }, res);
        expect(createMaintenanceReport).toHaveBeenCalledWith(expect.objectContaining({ tenant_name: "John Doe", apartment_id: "A1" }));
        expect(createNotification).toHaveBeenCalledWith(4, expect.any(String));
        expect(res.status).toHaveBeenCalledWith(200);
    });
});

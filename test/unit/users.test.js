jest.mock("../../config/db", () => ({ query: jest.fn() }));
const pool = require("../../config/db");
const { getTenants, getSingleTenant, getCurrentMurandiUser, getLandlords, getAdmins, getAllMurandiUsers } = require("../../controllers/users");
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => { jest.clearAllMocks(); jest.spyOn(console, "error").mockImplementation(); }); afterEach(() => jest.restoreAllMocks());

describe("getTenants", () => {
    it("returns all tenants", async () => { const rows = [{ id: 1 }]; pool.query.mockResolvedValueOnce({ rows }); const res = response(); await getTenants({}, res); expect(res.json).toHaveBeenCalledWith(rows); });
    it("returns 500 when tenant retrieval fails", async () => { pool.query.mockRejectedValueOnce(new Error("db")); const res = response(); await getTenants({}, res); expect(res.status).toHaveBeenCalledWith(500); });
});
describe("getSingleTenant", () => {
    it("rejects an invalid tenant UUID before querying", async () => { const res = response(); await getSingleTenant({ params: { id: "not-a-uuid" } }, res); expect(res.status).toHaveBeenCalledWith(400); expect(pool.query).not.toHaveBeenCalled(); });
    it("returns combined tenant details for a valid UUID", async () => { const id = "123e4567-e89b-12d3-a456-426614174000"; pool.query.mockResolvedValueOnce({ rows: [{ id, apartmentnumber: "A1" }] }).mockResolvedValueOnce({ rows: [{ paymentdate: "2026-01-01" }] }).mockResolvedValueOnce({ rows: [{ status: "Pending", request_date: "2026-01-02" }] }).mockResolvedValueOnce({ rows: [{ price: 5000 }] }).mockResolvedValueOnce({ rows: [{ pdf: "receipt" }] }); const res = response(); await getSingleTenant({ params: { id } }, res); expect(res.status).toHaveBeenCalledWith(200); expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id, apartmentPrice: 5000, pdf: "receipt", latestMaintenanceStatus: "Pending" })); });
});
describe("getCurrentMurandiUser", () => {
    it("returns the authenticated user's name and role", () => { const res = response(); getCurrentMurandiUser({ user: { firstName: "John" }, role: "tenant" }, res); expect(res.json).toHaveBeenCalledWith({ firstName: "John", role: "tenant" }); });
    it("does not query the database", () => { const res = response(); getCurrentMurandiUser({ user: { firstName: "John" }, role: "tenant" }, res); expect(pool.query).not.toHaveBeenCalled(); });
});
describe("getLandlords and getAdmins", () => {
    it("returns all landlords", async () => { const rows = [{ id: 1 }]; pool.query.mockResolvedValueOnce({ rows }); const res = response(); await getLandlords({}, res); expect(res.json).toHaveBeenCalledWith(rows); });
    it("returns all administrators", async () => { const rows = [{ id: 2 }]; pool.query.mockResolvedValueOnce({ rows }); const res = response(); await getAdmins({}, res); expect(res.json).toHaveBeenCalledWith(rows); });
});
describe("getAllMurandiUsers", () => {
    it("returns tenants, landlords, and admins together", async () => { pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }).mockResolvedValueOnce({ rows: [{ id: 2 }] }).mockResolvedValueOnce({ rows: [{ id: 3 }] }); const res = response(); await getAllMurandiUsers({}, res); expect(res.status).toHaveBeenCalledWith(200); expect(res.json).toHaveBeenCalledWith({ tenants: [{ id: 1 }], landlords: [{ id: 2 }], admins: [{ id: 3 }] }); });
    it("returns 500 when any user query fails", async () => { pool.query.mockRejectedValueOnce(new Error("db")); const res = response(); await getAllMurandiUsers({}, res); expect(res.status).toHaveBeenCalledWith(500); expect(res.json).toHaveBeenCalledWith({ message: "Could not fetch all Murandi users." }); });
});

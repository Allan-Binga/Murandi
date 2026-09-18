jest.mock("../../config/db", () => ({ query: jest.fn() }));
const pool = require("../../config/db"); const { getTechnicians, assignTechnician } = require("../../controllers/technician"); const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => jest.clearAllMocks());
describe("getTechnicians", () => {
    it("returns all technicians", async () => { const rows = [{ id: 1, full_name: "Amina" }]; pool.query.mockResolvedValueOnce({ rows }); const res = response(); await getTechnicians({}, res); expect(res.json).toHaveBeenCalledWith(rows); });
    it("returns 500 on a database failure", async () => { pool.query.mockRejectedValueOnce(new Error("db")); const res = response(); await getTechnicians({}, res); expect(res.status).toHaveBeenCalledWith(500); });
});
describe("assignTechnician", () => {
    it("returns 404 when the request has no category", async () => { pool.query.mockResolvedValueOnce({ rows: [] }); const res = response(); await assignTechnician({ params: { requestId: 1 } }, res); expect(res.status).toHaveBeenCalledWith(404); });
    it("assigns a technician with matching specialty", async () => { pool.query.mockResolvedValueOnce({ rows: [{ category: "Plumbing" }] }).mockResolvedValueOnce({ rows: [{ id: 2 }] }).mockResolvedValueOnce({}); const res = response(); await assignTechnician({ params: { requestId: 1 } }, res); expect(pool.query).toHaveBeenLastCalledWith(expect.stringContaining("UPDATE maintenance_requests"), [2, 1]); expect(res.status).toHaveBeenCalledWith(200); });
});

jest.mock("../../config/db", () => ({ query: jest.fn() }));
const pool = require("../../config/db"); const { updateInformation, deleteTenant } = require("../../controllers/tenants"); const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => { jest.clearAllMocks(); jest.spyOn(console, "log").mockImplementation(); jest.spyOn(console, "error").mockImplementation(); }); afterEach(() => jest.restoreAllMocks());
describe("updateInformation", () => {
    it("returns 404 for an unknown tenant", async () => { pool.query.mockResolvedValueOnce({ rows: [] }); const res = response(); await updateInformation({ params: { id: 1 }, body: {}, cookies: {} }, res); expect(res.status).toHaveBeenCalledWith(404); });
    it("updates permitted tenant fields", async () => { const tenant = { id: 1, leaseenddate: "2026-03-01" }; const updated = { ...tenant, firstname: "Janet" }; pool.query.mockResolvedValueOnce({ rows: [tenant] }).mockResolvedValueOnce({ rows: [updated] }); const res = response(); await updateInformation({ params: { id: 1 }, body: { firstName: "Janet" }, cookies: {} }, res); expect(pool.query).toHaveBeenLastCalledWith(expect.stringContaining("firstName = $1"), ["Janet", 1]); expect(res.status).toHaveBeenCalledWith(200); });
});
describe("deleteTenant", () => {
    it("returns 404 for an unknown tenant", async () => { pool.query.mockResolvedValueOnce({ rows: [] }); const res = response(); await deleteTenant({ params: { id: 1 } }, res); expect(res.status).toHaveBeenCalledWith(404); });
    it("deletes a tenant and unleases their apartment", async () => { pool.query.mockResolvedValueOnce({ rows: [{ apartmentnumber: "A1" }] }).mockResolvedValueOnce({}).mockResolvedValueOnce({}); const res = response(); await deleteTenant({ params: { id: 1 } }, res); expect(pool.query).toHaveBeenLastCalledWith(expect.stringContaining("leasingstatus = 'Unleased'"), ["A1"]); expect(res.status).toHaveBeenCalledWith(200); });
});

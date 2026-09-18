jest.mock("../../config/db", () => ({ query: jest.fn() }));
const pool = require("../../config/db"); const { getAllPayments, getUsersPayment } = require("../../controllers/payments");
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => { jest.clearAllMocks(); jest.spyOn(console, "error").mockImplementation(); }); afterEach(() => jest.restoreAllMocks());
describe("getAllPayments", () => {
    it("returns payments with tenant details", async () => { const rows = [{ paymentid: 1, tenantname: "John Doe" }]; pool.query.mockResolvedValueOnce({ rows }); const res = response(); await getAllPayments({}, res); expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("JOIN")); expect(res.json).toHaveBeenCalledWith(rows); });
    it("returns 500 when payment retrieval fails", async () => { pool.query.mockRejectedValueOnce(new Error("db")); const res = response(); await getAllPayments({}, res); expect(res.status).toHaveBeenCalledWith(500); });
});
describe("getUsersPayment", () => {
    it("returns payments for the authenticated tenant", async () => { const rows = [{ paymentid: 1, tenantid: 4 }]; pool.query.mockResolvedValueOnce({ rows }); const res = response(); await getUsersPayment({ tenantId: 4 }, res); expect(pool.query).toHaveBeenCalledWith(expect.any(String), [4]); expect(res.json).toHaveBeenCalledWith(rows); });
    it("returns 500 when the tenant payment query fails", async () => { pool.query.mockRejectedValueOnce(new Error("db")); const res = response(); await getUsersPayment({ tenantId: 4 }, res); expect(res.status).toHaveBeenCalledWith(500); });
});

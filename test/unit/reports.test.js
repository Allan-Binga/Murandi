jest.mock("../../config/db", () => ({ query: jest.fn() }));
const pool = require("../../config/db"); const { createPaymentReport, createMaintenanceReport, getReports, getPaymentReports, getMaintenanceReports } = require("../../controllers/reports"); const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => jest.clearAllMocks());
describe("createPaymentReport", () => {
    it("requires all payment report fields", async () => { await expect(createPaymentReport({})).rejects.toThrow("All fields are required"); });
    it("inserts a complete payment report", async () => { const report = { id: 1, report_type: "payment" }; pool.query.mockResolvedValueOnce({ rows: [report] }); await expect(createPaymentReport({ tenant_name: "John", apartment_id: "A1", amount_paid: 5000, payment_date: "2026-01-01", payment_status: "Paid" })).resolves.toEqual(report); });
});
describe("createMaintenanceReport", () => {
    it("requires all maintenance report fields", async () => { await expect(createMaintenanceReport({})).rejects.toThrow("All fields"); });
    it("inserts a maintenance report", async () => { const report = { id: 2 }; pool.query.mockResolvedValueOnce({ rows: [report] }); await expect(createMaintenanceReport({ tenant_name: "John", apartment_id: "A1", issue_description: "Leak", category: "Plumbing" })).resolves.toEqual(report); });
});
describe("report fetch handlers", () => {
    it("returns all reports", async () => { const rows = [{ id: 1 }]; pool.query.mockResolvedValueOnce({ rows }); const res = response(); await getReports({}, res); expect(res.json).toHaveBeenCalledWith(rows); });
    it("returns 500 when all reports cannot be fetched", async () => { pool.query.mockRejectedValueOnce(new Error("db")); const res = response(); await getReports({}, res); expect(res.status).toHaveBeenCalledWith(500); });
    it("returns payment reports", async () => { const rows = [{ id: 1, report_type: "payment" }]; pool.query.mockResolvedValueOnce({ rows }); const res = response(); await getPaymentReports({}, res); expect(res.json).toHaveBeenCalledWith(rows); });
    it("returns maintenance reports", async () => { const rows = [{ id: 2, report_type: "maintenance" }]; pool.query.mockResolvedValueOnce({ rows }); const res = response(); await getMaintenanceReports({}, res); expect(res.json).toHaveBeenCalledWith(rows); });
});

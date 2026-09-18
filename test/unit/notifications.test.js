jest.mock("../../config/db", () => ({ query: jest.fn() }));
const pool = require("../../config/db");
const { getNotifications, createNotification, getMyNotifications, markNotificationAsRead } = require("../../controllers/notifications");
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => { jest.clearAllMocks(); jest.spyOn(console, "log").mockImplementation(); jest.spyOn(console, "error").mockImplementation(); });
afterEach(() => jest.restoreAllMocks());

describe("getNotifications", () => {
    it("returns all notifications", async () => { const rows = [{ notification_id: 1 }]; pool.query.mockResolvedValueOnce({ rows }); const res = response(); await getNotifications({}, res); expect(res.json).toHaveBeenCalledWith(rows); });
    it("returns 500 on a query failure", async () => { pool.query.mockRejectedValueOnce(new Error("db")); const res = response(); await getNotifications({}, res); expect(res.status).toHaveBeenCalledWith(500); });
});
describe("createNotification", () => {
    it("inserts a notification for a tenant", async () => { pool.query.mockResolvedValueOnce({}); await createNotification(4, "Rent due"); expect(pool.query).toHaveBeenCalledWith(expect.any(String), [4, "Rent due"]); });
    it("handles a failed notification insert without throwing", async () => { pool.query.mockRejectedValueOnce(new Error("db")); await expect(createNotification(4, "Rent due")).resolves.toBeUndefined(); });
});
describe("getMyNotifications", () => {
    it("requires a tenant id", async () => { const res = response(); await getMyNotifications({}, res); expect(res.status).toHaveBeenCalledWith(401); expect(pool.query).not.toHaveBeenCalled(); });
    it("returns the authenticated tenant's notifications", async () => { const rows = [{ notification_id: 1, tenant_id: 4 }]; pool.query.mockResolvedValueOnce({ rows }); const res = response(); await getMyNotifications({ tenantId: 4 }, res); expect(pool.query).toHaveBeenCalledWith(expect.any(String), [4]); expect(res.json).toHaveBeenCalledWith(rows); });
});
describe("markNotificationAsRead", () => {
    it("returns 404 for a missing or foreign notification", async () => { pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); const res = response(); await markNotificationAsRead({ tenantId: 4, params: { notificationId: 1 } }, res); expect(res.status).toHaveBeenCalledWith(404); });
    it("marks the tenant's notification as read", async () => { const notification = { notification_id: 1, status: "read" }; pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [notification] }); const res = response(); await markNotificationAsRead({ tenantId: 4, params: { notificationId: 1 } }, res); expect(res.status).toHaveBeenCalledWith(200); expect(res.json).toHaveBeenCalledWith(notification); });
});

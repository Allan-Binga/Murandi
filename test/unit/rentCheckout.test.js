const mockCreateSession = jest.fn();
jest.mock("stripe", () => jest.fn(() => ({ checkout: { sessions: { create: mockCreateSession } } })));
jest.mock("axios", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("moment", () => jest.fn(() => ({ format: () => "20260101120000" })));
jest.mock("../../config/db", () => ({ query: jest.fn() }));
const pool = require("../../config/db"); const axios = require("axios");
const { createRentCheckoutSession, createMpesaCheckout } = require("../../controllers/rentCheckout");
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => { jest.clearAllMocks(); jest.spyOn(console, "error").mockImplementation(); }); afterEach(() => jest.restoreAllMocks());
const rentPrerequisites = () => pool.query.mockResolvedValueOnce({ rows: [{ apartmentnumber: "A1", email: "t@example.com" }] }).mockResolvedValueOnce({ rows: [{ price: 5000, image: null }] });
describe("createRentCheckoutSession", () => {
    it("creates a Stripe session when no pending payment exists", async () => { rentPrerequisites(); pool.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ paymentid: 9 }] }); mockCreateSession.mockResolvedValueOnce({ id: "cs_1", url: "https://stripe.test" }); const res = response(); await createRentCheckoutSession({ tenantId: 4 }, res); expect(mockCreateSession).toHaveBeenCalledWith(expect.objectContaining({ mode: "payment", metadata: expect.objectContaining({ paymentId: "9" }) })); expect(res.json).toHaveBeenCalledWith({ id: "cs_1", url: "https://stripe.test" }); });
    it("blocks a tenant with a recent pending payment", async () => { rentPrerequisites(); pool.query.mockResolvedValueOnce({ rows: [{ paymentid: 8 }] }); const res = response(); await createRentCheckoutSession({ tenantId: 4 }, res); expect(res.status).toHaveBeenCalledWith(400); expect(mockCreateSession).not.toHaveBeenCalled(); });
});
describe("createMpesaCheckout", () => {
    it("requires amount and phone number", async () => { const res = response(); await createMpesaCheckout({ body: {} }, res); expect(res.status).toHaveBeenCalledWith(400); });
    it("initiates an STK push for a valid Kenyan number", async () => { axios.get.mockResolvedValueOnce({ data: { access_token: "token" } }); axios.post.mockResolvedValueOnce({ data: { CheckoutRequestID: "abc" } }); const res = response(); await createMpesaCheckout({ body: { amount: 5000, phoneNumber: "254712345678" } }, res); expect(axios.post).toHaveBeenCalled(); expect(res.status).toHaveBeenCalledWith(200); expect(res.json).toHaveBeenCalledWith({ message: "STK Push initiated", data: { CheckoutRequestID: "abc" } }); });
});

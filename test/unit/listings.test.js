// Listing controllers only depend on Postgres; mock it to keep tests isolated.
jest.mock("../../config/db", () => ({ query: jest.fn() }));

const pool = require("../../config/db");
const {
    getListings,
    getUserLeasedApartment,
    createListing,
    updateListing,
    deleteListing,
} = require("../../controllers/listings");

const createResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
});

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("getListings", () => {
    it("returns all apartment listings", async () => {
        const listings = [{ id: 1, title: "One-bedroom apartment" }];
        pool.query.mockResolvedValueOnce({ rows: listings });
        const res = createResponse();

        await getListings({}, res);

        expect(pool.query).toHaveBeenCalledWith("SELECT * FROM apartment_listings");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(listings);
    });

    it("returns 500 when listings cannot be fetched", async () => {
        pool.query.mockRejectedValueOnce(new Error("Database unavailable"));
        const res = createResponse();

        await getListings({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Could not fetch listings." });
    });
});

describe("getUserLeasedApartment", () => {
    it("returns the apartment leased by the authenticated tenant", async () => {
        const apartment = { id: 1, apartmentnumber: "A1", title: "One-bedroom apartment" };
        pool.query.mockResolvedValueOnce({ rows: [apartment] });
        const res = createResponse();

        await getUserLeasedApartment({ tenantId: 4 }, res);

        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("WHERE t.id = $1"), [4]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Leased apartment:", apartment });
    });

    it("returns 404 when the tenant has no leased apartment", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });
        const res = createResponse();

        await getUserLeasedApartment({ tenantId: 4 }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "No leased apartment found for this tenant." });
    });
});

describe("createListing", () => {
    it("requires every listing field", async () => {
        const res = createResponse();

        await createListing({ body: {} }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "All fields are required.",
            missingFields: {
                title: true,
                description: true,
                price: true,
                square_feet: true,
                image: true,
                apartmentnumber: true,
            },
        });
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("creates a listing with valid fields", async () => {
        const listing = {
            id: 1,
            title: "One-bedroom apartment",
            description: "Well-lit apartment",
            price: 5000,
            square_feet: 700,
            image: "https://example.com/a1.jpg",
            apartmentnumber: "A1",
        };
        pool.query.mockResolvedValueOnce({ rows: [listing] });
        const res = createResponse();

        await createListing({ body: listing }, res);

        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO apartment_listings"), [
            listing.title,
            listing.description,
            listing.price,
            listing.square_feet,
            listing.image,
            listing.apartmentnumber,
        ]);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ message: "Listing created successfully.", listing });
    });
});

describe("updateListing", () => {
    it("requires at least one field to update", async () => {
        const res = createResponse();

        await updateListing({ params: { id: 1 }, body: {} }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "No fields provided for update." });
        expect(pool.query).not.toHaveBeenCalled();
    });

    it("updates the supplied listing fields", async () => {
        const listing = { id: 1, price: 6000 };
        pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [listing] });
        const res = createResponse();

        await updateListing({ params: { id: 1 }, body: { price: 6000 } }, res);

        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("price = $1"), [6000, 1]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Listing updated successfully.", listing });
    });
});

describe("deleteListing", () => {
    it("returns 404 when the listing does not exist", async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
        const res = createResponse();

        await deleteListing({ params: { id: 1 } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Listing not found." });
    });

    it("deletes an existing listing", async () => {
        const listing = { id: 1, apartmentnumber: "A1" };
        pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [listing] });
        const res = createResponse();

        await deleteListing({ params: { id: 1 } }, res);

        expect(pool.query).toHaveBeenCalledWith("DELETE FROM apartment_listings WHERE id = $1 RETURNING *", [1]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Listing deleted successfully.", deleted: listing });
    });
});

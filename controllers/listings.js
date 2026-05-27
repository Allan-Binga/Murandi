const pool = require("../config/db");

//Fetch all listings
const getListings = async (req, res) => {
  try {
    const listings = await pool.query("SELECT * FROM apartment_listings");
    res.status(200).json(listings.rows);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch listings." });
  }
};

//Fetch user's leased apartment
const getUserLeasedApartment = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const query = `
      SELECT a.*
      FROM apartment_listings a
      JOIN tenants t ON a.apartmentNumber = t.apartmentNumber
      WHERE t.id = $1
    `;

    const result = await pool.query(query, [tenantId]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No leased apartment found for this tenant." });
    }

    res
      .status(200)
      .json({ message: "Leased apartment:", apartment: result.rows[0] });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal serer error retrieveing apartment" });
  }
};

// Create Apartment Listings
const createListing = async (req, res) => {
  try {
    const { title, description, price, square_feet, image, apartmentnumber } =
      req.body;

    // Log the incoming request body
    // console.log("Received createListing request:", {
    //   title,
    //   description,
    //   price,
    //   square_feet,
    //   image,
    //   apartmentnumber,
    //   body: req.body, // Log the entire body for completeness
    // });

    // Validate input
    if (
      !title ||
      !description ||
      !price ||
      !square_feet ||
      !image ||
      !apartmentnumber
    ) {
      console.log("Validation failed. Missing fields:", {
        title: !!title,
        description: !!description,
        price: !!price,
        square_feet: !!square_feet,
        image: !!image,
        apartmentnumber: !!apartmentnumber,
      });
      return res.status(400).json({
        message: "All fields are required.",
        missingFields: {
          title: !title,
          description: !description,
          price: !price,
          square_feet: !square_feet,
          image: !image,
          apartmentnumber: !apartmentnumber,
        },
      });
    }

    // Additional type validation (optional but recommended)
    if (isNaN(price) || isNaN(square_feet)) {
      console.log("Validation failed. Invalid types:", {
        price: isNaN(price) ? "Not a number" : price,
        square_feet: isNaN(square_feet) ? "Not a number" : square_feet,
      });
      return res.status(400).json({
        message: "Price and square_feet must be valid numbers.",
      });
    }

    const insertListingQuery = `
      INSERT INTO apartment_listings (
        title,
        description,
        price,
        square_feet,
        image,
        apartmentnumber,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, title, description, price, square_feet, image, apartmentnumber, created_at, updated_at
    `;

    const result = await pool.query(insertListingQuery, [
      title,
      description,
      price,
      square_feet,
      image,
      apartmentnumber,
    ]);

    // Log the successful insertion
    console.log("Listing created successfully:", result.rows[0]);

    res.status(201).json({
      message: "Listing created successfully.",
      listing: result.rows[0],
    });
  } catch (error) {
    // Detailed error logging
    console.error("Error creating listing:", {
      message: error.message,
      stack: error.stack,
      code: error.code, // PostgreSQL error code, if applicable
      detail: error.detail,
      hint: error.hint,
    });
    res.status(500).json({
      message: "Could not create listing.",
      error: error.message,
    });
  }
};

//Update a listing
const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    if (Object.keys(fields).length === 0) {
      return res
        .status(400)
        .json({ message: "No fields provided for update." });
    }

    // Build dynamic SET clause
    const setClauses = [];
    const values = [];
    let index = 1;

    for (const key in fields) {
      setClauses.push(`${key} = $${index}`);
      values.push(fields[key]);
      index++;
    }

    // Always update updated_at
    setClauses.push(`updated_at = NOW()`);

    const updateQuery = `
      UPDATE apartment_listings
      SET ${setClauses.join(", ")}
      WHERE id = $${index}
      RETURNING *
    `;

    values.push(id); // final value is the id

    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Listing not found." });
    }

    res.status(200).json({
      message: "Listing updated successfully.",
      listing: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating listing:", error);
    res.status(500).json({ message: "Could not update listing." });
  }
};

//Delete a listing
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = `DELETE FROM apartment_listings WHERE id = $1 RETURNING *`;
    const result = await pool.query(deleteQuery, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Listing not found." });
    }

    res.status(200).json({
      message: "Listing deleted successfully.",
      deleted: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting listing:", error);
    res.status(500).json({ message: "Could not delete listing." });
  }
};

module.exports = {
  getListings,
  getUserLeasedApartment,
  createListing,
  updateListing,
  deleteListing,
};

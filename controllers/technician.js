const pool = require("../config/db");

//Get Technicians
const getTechnicians = async (req, res) => {
  try {
    const technicians = await pool.query("SELECT * FROM technicians");
    res.status(200).json(technicians.rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch technicians" });
  }
};

//Assign a Technician
const assignTechnician = async (req, res) => {
  try {
    const requestId = req.params.requestId;

    //Get request category
    const requestResult = await pool.query(
      `SELECT category FROM maintenance_requests WHERE id = $1`,
      [requestId]
    );

    const category = requestResult.rows[0]?.category;
    if (!category) {
      return res
        .status(404)
        .json({ message: "Request not found or missing category." });
    }

    // Find a technician with matching specialty
    const techResult = await pool.query(
      `SELECT id FROM technicians WHERE specialty = $1 ORDER BY RANDOM() LIMIT 1`,
      [category]
    );

    const technician = techResult.rows[0];
    if (!technician) {
      return res
        .status(404)
        .json({ message: "No technician available for this category." });
    }

    // Assign technician to the request
    await pool.query(
      `UPDATE maintenance_requests SET technician_id = $1 WHERE id = $2`,
      [technician.id, requestId]
    );

    res.status(200).json({ message: "Technician assigned successfully." });
  } catch (error) {
    console.error("Error assigning technician:", error);
    res.status(500).json({ message: "Failed to assign technician." });
  }
};

module.exports = { getTechnicians, assignTechnician };

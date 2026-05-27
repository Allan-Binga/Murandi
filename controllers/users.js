const pool = require("../config/db");
const jwt = require("jsonwebtoken");

//Fetch All Tenants
const getTenants = async (req, res) => {
  try {
    const tenants = await pool.query("SELECT * FROM tenants");

    res.status(200).json(tenants.rows);
  } catch (error) {
    res.status(500).json("Could not fetch tenants.");
  }
};

// Get tenants by ID
const getSingleTenant = async (req, res) => {
  const { id } = req.params;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ message: "Invalid UUID format." });
  }

  try {
    // Fetch tenant details
    const tenantResult = await pool.query(
      "SELECT * FROM tenants WHERE id = $1",
      [id]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    const tenant = tenantResult.rows[0];

    // Fetch most recent payment and calculate next rent due (add 30 days)
    let nextPaymentDate = null;
    const paymentResult = await pool.query(
      `SELECT paymentdate FROM payment WHERE tenantid = $1 ORDER BY paymentdate DESC LIMIT 1`,
      [id]
    );

    if (paymentResult.rows.length > 0) {
      const lastPaymentDate = new Date(paymentResult.rows[0].paymentdate);
      lastPaymentDate.setDate(lastPaymentDate.getDate() + 30);
      nextPaymentDate = lastPaymentDate.toISOString();
    }

    // Fetch latest maintenance request (status + request_date)
    const maintenanceResult = await pool.query(
      `SELECT status, request_date FROM maintenance_requests WHERE tenant_id = $1 ORDER BY request_date DESC LIMIT 1`,
      [id]
    );

    const latestMaintenanceStatus =
      maintenanceResult.rows.length > 0
        ? maintenanceResult.rows[0].status
        : null;

    const lastMaintenanceDate =
      maintenanceResult.rows.length > 0
        ? maintenanceResult.rows[0].request_date
        : null;

    // Fetch apartment listing price using apartmentnumber
    let apartmentPrice = null;
    if (tenant.apartmentnumber) {
      const apartmentResult = await pool.query(
        "SELECT price FROM apartment_listings WHERE apartmentnumber = $1",
        [tenant.apartmentnumber]
      );
      if (apartmentResult.rows.length > 0) {
        apartmentPrice = apartmentResult.rows[0].price;
      }
    }

    // Fetch PDF from receipts table
    const receiptResult = await pool.query(
      "SELECT pdf FROM receipts WHERE tenant_id = $1 LIMIT 1",
      [id]
    );

    const pdf =
      receiptResult.rows.length > 0 ? receiptResult.rows[0].pdf : null;

    // Return combined response
    res.status(200).json({
      ...tenant,
      nextPaymentDate,
      latestMaintenanceStatus,
      lastMaintenanceDate,
      apartmentPrice,
      pdf,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not fetch tenant details." });
  }
};

const getCurrentMurandiUser = (req, res) => {
  const { firstName } = req.user;
  const { role } = req;

  res.json({
    firstName,
    role,
  });
};

//Fetch All Landlords
const getLandlords = async (req, res) => {
  try {
    const landlords = await pool.query("SELECT * FROM landlords");
    res.status(200).json(landlords.rows);
  } catch (error) {
    res.status(500).json("Could not fetch tenants.");
  }
};

//Fetch Admins
const getAdmins = async (req, res) => {
  try {
    const admins = await pool.query("SELECT * FROM admins");
    res.status(200).json(admins.rows);
  } catch (error) {
    res.status(500).json("Could not fetch tenants.");
  }
};

// Fetch Tenants, Landlords, and Admins concurrently
const getAllMurandiUsers = async (req, res) => {
  try {
    const [tenants, landlords, admins] = await Promise.all([
      pool.query("SELECT * FROM tenants"),
      pool.query("SELECT * FROM landlords"),
      pool.query("SELECT * FROM admins"),
    ]);

    res.status(200).json({
      tenants: tenants.rows,
      landlords: landlords.rows,
      admins: admins.rows,
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ message: "Could not fetch all Murandi users." });
  }
};

module.exports = {
  getTenants,
  getLandlords,
  getAdmins,
  getCurrentMurandiUser,
  getSingleTenant,
  getAllMurandiUsers,
};

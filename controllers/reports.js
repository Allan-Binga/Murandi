const pool = require("../config/db");

// Create Payment Report
const createPaymentReport = async (reportData) => {
  const {
    tenant_name,
    apartment_id,
    amount_paid,
    payment_date,
    payment_status,
  } = reportData;

  if (
    !tenant_name ||
    !apartment_id ||
    !amount_paid ||
    !payment_date ||
    !payment_status
  ) {
    throw new Error("All fields are required");
  }

  try {
    const query = `
          INSERT INTO reports (report_type, tenant_name, apartment_id, amount_paid, payment_date, payment_status, created_at)
          VALUES ('payment', $1, $2, $3, $4, $5, NOW()) RETURNING *;
        `;

    const values = [
      tenant_name,
      apartment_id,
      amount_paid,
      payment_date,
      payment_status,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error creating payment report:", error.message);
    throw error;
  }
};

//Create MaintenanceReport
const createMaintenanceReport = async (maintenanceData) => {
  const { tenant_name, apartment_id, issue_description, category } =
    maintenanceData;

  // Validate required fields
  if (!tenant_name || !apartment_id || !issue_description || !category) {
    throw new Error(
      "All fields (tenant_name, apartment_id, issue_description, category, completion_date) are required"
    );
  }

  try {
    const query = `
        INSERT INTO reports (
          report_type, 
          tenant_name, 
          apartment_id, 
          issue_description, 
          issue_title, 
          created_at
        )
        VALUES ('maintenance', $1, $2, $3, $4, NOW()) 
        RETURNING *;
      `;

    const values = [tenant_name, apartment_id, issue_description, category];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error creating maintenance report:", error.message);
    throw error;
  }
};

//Get reports
const getReports = async (req, res) => {
  try {
    const reports = await pool.query("SELECT * FROM reports");
    res.status(200).json(reports.rows);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch reports" });
  }
};

//Get payment reports
const getPaymentReports = async (req, res) => {
  try {
    const paymentReports = await pool.query(`
        SELECT id, report_type, tenant_name, apartment_id, amount_paid, payment_date, payment_status, created_at
        FROM reports
        WHERE report_type = 'payment'
      `);
    res.status(200).json(paymentReports.rows);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch payment reports" });
  }
};

//Get MAintenance Reports
const getMaintenanceReports = async (req, res) => {
  try {
    const maintenanceReports = await pool.query(`
            SELECT id report_type, tenant_name, apartment_id, issue_title, issue_description, maintenance_status, created_at
            FROM reports
            WHERE report_type = 'maintenance'`);
    res.status(200).json(maintenanceReports.rows);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch maintenance reports" });
  }
};

module.exports = {
  getReports,
  getPaymentReports,
  getMaintenanceReports,
  createPaymentReport,
  createMaintenanceReport,
};

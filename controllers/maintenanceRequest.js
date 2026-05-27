const pool = require("../config/db");
const { sendMaintenanceRequestEmail } = require("../controllers/emailService");
const { createMaintenanceReport } = require("../controllers/reports");
const { createNotification } = require("../controllers/notifications");

//Get all maintenance requests.
const getRequests = async (req, res) => {
  try {
    const query = `
     SELECT maintenance_requests.*, tenants.firstname, tenants.lastname
    FROM maintenance_requests
    JOIN tenants ON maintenance_requests.tenant_id = tenants.id
    ORDER BY request_date DESC;

    `;

    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ message: "Failed to fetch requests." });
  }
};

//Get a user's maintenance request.
const getUserRequest = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const query = `
      SELECT * FROM maintenance_requests
      WHERE tenant_id = $1
      ORDER BY request_date DESC;
    `;

    const result = await pool.query(query, [tenantId]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching tenant requests:", error);
    res.status(500).json({ message: "Failed to fetch tenant requests." });
  }
};

//Create a maintenance requests.
const createRequest = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { issueDescription, category } = req.body;

    if (!issueDescription || !category) {
      return res
        .status(400)
        .json({ message: "Description and category are required." });
    }

    // Step 1: Insert the maintenance request
    const insertQuery = `
      INSERT INTO maintenance_requests (tenant_id, issue_description, status, category)
      VALUES ($1, $2, 'Pending', $3) RETURNING *;
    `;

    const result = await pool.query(insertQuery, [
      tenantId,
      issueDescription,
      category,
    ]);
    const request = result.rows[0];

    // Step 2: Find a technician that matches the category
    const techResult = await pool.query(
      `SELECT id, full_name FROM technicians WHERE specialty = $1 ORDER BY RANDOM() LIMIT 1`,
      [category]
    );

    const technician = techResult.rows[0];

    if (technician) {
      // Step 3: Assign technician to this request
      await pool.query(
        `UPDATE maintenance_requests SET technician_id = $1 WHERE request_id = $2`,

        [technician.id, request.request_id]
      );
      request.technician_name = technician.full_name;
      delete request.technician_id;
    }

    const tenantResult = await pool.query(
      `SELECT email FROM tenants WHERE id = $1`,
      [tenantId]
    );
    const tenant = tenantResult.rows[0];

    if (tenant && tenant.email) {
      //  Step 5: Wait two minutes and send a maintenance request email
      setTimeout(async () => {
        try {
          await sendMaintenanceRequestEmail(tenant.email, request);
          // console.log("Maintenance email sent after 2 minutes");
        } catch (error) {
          console.error("Failed to send maintenance email:", error);
        }
      }, 2 * 60 * 1000);
    }

    res.status(201).json({
      message: technician
        ? "Request submitted and technician assigned."
        : "Request submitted but no technician available for this category.",
      request,
    });
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ message: "Failed to create request." });
  }
};

//Mark Request as Completed
const completeRequest = async (req, res) => {
  try {
    const requestId = req.params.id;

    const updateQuery = `
      UPDATE maintenance_requests
      SET status = 'Completed'
      WHERE request_id = $1
      RETURNING *;
    `;

    const result = await pool.query(updateQuery, [requestId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Request not found." });
    }

    const request = result.rows[0];

    // Fetch tenant details for the report
    const tenantQuery = `
      SELECT firstname, lastname, apartmentnumber 
      FROM tenants 
      WHERE id = $1;
    `;
    const tenantResult = await pool.query(tenantQuery, [request.tenant_id]);

    if (tenantResult.rows.length === 0) {
      console.warn(`Tenant not found for tenant_id: ${request.tenant_id}`);
      // Optionally skip report creation or use placeholder data
      return res.status(200).json({
        message: "Request marked as completed, but no tenant found for report.",
        request: request,
      });
    }

    const {
      firstname,
      lastname,
      apartmentnumber: apartmentId,
    } = tenantResult.rows[0];
    const tenantName = `${firstname} ${lastname}`;

    // Prepare maintenance report data
    const maintenanceReportData = {
      tenant_name: tenantName,
      apartment_id: apartmentId,
      issue_description: request.issue_description,
      category: request.category,
    };

    // Create the maintenance report
    const report = await createMaintenanceReport(maintenanceReportData);
    // console.log(`Maintenance report created for request ${requestId}`);

    // Now update the maintenance report with status 'completed'
    const updateStatusQuery = `
      UPDATE reports
      SET maintenance_status = 'Completed'
      WHERE id = $1;
    `;
    await pool.query(updateStatusQuery, [report.id]);

    //Create a maintenance request
    await createNotification(
      request.tenant_id,
      "You confirmed the request as completed. Were you satisfied with the service?"
    );

    res.status(200).json({
      message: "Request marked as completed and maintenance report created.",
      request: request,
    });
  } catch (error) {
    console.error(
      "Error completing request or creating report:",
      error.message
    );
    res
      .status(500)
      .json({ message: "Failed to update request status or create report." });
  }
};
module.exports = {
  createRequest,
  getRequests,
  getUserRequest,
  completeRequest,
};

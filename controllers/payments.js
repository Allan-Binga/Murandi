const pool = require("../config/db");

//Get All Payments
const getAllPayments = async (req, res) => {
  try {
    const payments = await pool.query(`
      SELECT 
        p.paymentid,
         (t.firstname || ' ' || t.lastname) AS tenantname,
        t.apartmentnumber,
        p.amountpaid,
        p.paymentdate,
        p.paymentmethod,
        p.paymentstatus
      FROM 
        payment p
      JOIN 
        tenants t
      ON 
        p.tenantid = t.id
    `);
    res.status(200).json(payments.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not fetch payments." });
  }
};

// Get User's Payment
const getUsersPayment = async (req, res) => {
  const tenantId = req.tenantId;
  // console.log(tenantId)

  try {
    const query = `SELECT * FROM payment WHERE tenantid = $1 ORDER BY paymentdate DESC`;
    const result = await pool.query(query, [tenantId]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching tenant payments:", error.message);
    res.status(500).json({ message: "Could not fetch user's payments." });
  }
};

module.exports = { getAllPayments, getUsersPayment };

const pool = require("../config/db");

//Get All Notifications
const getNotifications = async (req, res) => {
  try {
    const notis = await pool.query(`SELECT * FROM notifications`);
    res.status(200).json(notis.rows);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch notifications." });
  }
};

//Notification Creation/Message
const createNotification = async (tenantId, message) => {
  try {
    await pool.query(
      `INSERT INTO notifications (tenant_id, message)
         VALUES ($1, $2)`,
      [tenantId, message]
    );
    console.log("Notification created.");
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

//Notifications for a certain tenant
const getMyNotifications = async (req, res) => {
  const tenantId = req.tenantId;

  if (!tenantId) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No tenant ID provided." });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE tenant_id = $1 ORDER BY notification_date DESC`,
      [tenantId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching tenant notifications:", error);
    res.status(500).json({ message: "Could not fetch your notifications." });
  }
};

// Update Notification Status to Read
const markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const tenantId = req.tenantId;

  if (!tenantId) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No tenant ID provided." });
  }

  try {
    const result = await pool.query(
      `UPDATE notifications 
       SET status = 'read' 
       WHERE notification_id = $1 AND tenant_id = $2 
       RETURNING *`,
      [notificationId, tenantId]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Notification not found or not authorized." });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating notification status:", error);
    res.status(500).json({ message: "Could not update notification status." });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  getMyNotifications,
  markNotificationAsRead,
};

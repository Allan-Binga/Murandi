const pool = require("../config/db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendPasswordResetEmail } = require("./emailService");
const { createNotification } = require("./notifications");

// Reset Password
const resetPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Check if user exists
    const result = await pool.query(
      "SELECT * FROM tenants WHERE email = $1",
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate a password reset token
    const plainToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");
    const expiry = new Date(Date.now() + 2 * 60 * 1000); // 2 mins

    // Store hashed token and expiry in DB
    await pool.query(
      "UPDATE tenants SET passwordresettoken = $1, passwordresettokenexpiry = $2 WHERE email = $3",
      [hashedToken, expiry, email]
    );

    // Send email with plain token
    await sendPasswordResetEmail(email, plainToken);

    res.status(200).json({ message: "Password reset email sent." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Reset Password with Token (for tenants)
const resetPasswordToken = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Token, new password, and confirm password are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match.",
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    // Hash the token to match what's stored
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find tenant with valid token and expiry
    const result = await pool.query(
      `SELECT * FROM tenants
         WHERE passwordresettoken = $1 AND passwordresettokenexpiry > NOW()`,
      [hashedToken]
    );

    const tenant = result.rows[0];

    if (!tenant) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset fields
    await pool.query(
      `UPDATE tenants
         SET password = $1, passwordresettoken = NULL, passwordresettokenexpiry = NULL
         WHERE id = $2`,
      [hashedPassword, tenant.id]
    );

    await createNotification(tenant.id, "You recently reset your password.");
    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Error resetting password with token:", error);
    res.status(500).json({ message: "Error resetting password." });
  }
};

module.exports = {
  resetPasswordEmail,
  resetPasswordToken,
};

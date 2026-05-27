const nodemailer = require("nodemailer");
const pool = require("../config/db");
const crypto = require("crypto");
const dotenv = require("dotenv");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
// const {createNotification} = require("./notifications")

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// GENERATE PDF DOCUMENTS
const createReceipt = ({ amountPaid, apartmentNumber, paymentDate }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on("error", reject);

    const logoPath = path.join(__dirname, "../assets/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 30, { width: 80 });
    }

    // Adjusted values to center text relative to remaining space after logo
    const contentWidth = 595.28 - 2 * 50; // A4 page width minus margins
    const headerX = 150;
    const headerWidth = contentWidth - 100;

    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#003087")
      .text("Murandi Apartments", headerX, 30, {
        width: headerWidth,
        align: "center",
      });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#333333")
      .text("165 Meadow Lane, Ongata Rongai", headerX, 55, {
        width: headerWidth,
        align: "center",
      });

    doc.text(
      "Phone: +254 702485856 | Email: murandiapartments@gmail.com",
      headerX,
      70,
      {
        width: headerWidth,
        align: "center",
      }
    );

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#003087")
      .text("Your receipt for", 0, 120, { align: "center" });

    doc.moveDown(2);

    // Table-like section
    const tableTop = 160;
    const tableLeft = 50;
    const tableWidth = 500;
    const rowHeight = 30;

    doc
      .rect(tableLeft, tableTop, tableWidth, rowHeight)
      .fill("#f5f5f5")
      .stroke("#dddddd");

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#333333")
      .text("Description", tableLeft + 10, tableTop + 10)
      .text("Details", tableLeft + 300, tableTop + 10);

    doc
      .rect(tableLeft, tableTop + rowHeight, tableWidth, rowHeight * 3)
      .fill("#ffffff")
      .stroke("#dddddd");

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#333333")
      .text("Date", tableLeft + 10, tableTop + rowHeight + 10)
      .text(paymentDate, tableLeft + 300, tableTop + rowHeight + 10)
      .text("Apartment Number", tableLeft + 10, tableTop + rowHeight * 2 + 10)
      .text(apartmentNumber, tableLeft + 300, tableTop + rowHeight * 2 + 10)
      .text("Amount Paid", tableLeft + 10, tableTop + rowHeight * 3 + 10)
      .text(
        `KES ${amountPaid.toLocaleString()}`,
        tableLeft + 300,
        tableTop + rowHeight * 3 + 10
      );

    doc.rect(tableLeft, tableTop, tableWidth, rowHeight * 4).stroke("#dddddd");

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#333333")
      .text(
        "Thank you for trusting Murandi Apartments.",
        0,
        tableTop + rowHeight * 5,
        { align: "center" }
      );

    const footerY = doc.page.height - 80;
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#666666")
      .text("Murandi Apartments - Your Home, Our Pride", 0, footerY, {
        align: "center",
      });
    doc.text(
      "For inquiries, contact us at murandiapartments@gmail.com",
      0,
      footerY + 15,
      { align: "center" }
    );

    doc.end();
  });
};

//Send Verification Email
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/account-verification?token=${token}`;

  const mailOptions = {
    from: `"Murandi Apartments" <${process.env.MAIL_USER}>`, //Name and Email
    to: email,
    subject: "Please verify your account.",
    html: `  <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Verify Your Account</h2>
          <p style="color: #555;">Click the button below to verify your account.</p>
          <a href="${verificationUrl}" 
            style="display: inline-block; padding: 10px 20px; margin-top: 15px; background-color: #2582b8; color: #fff; text-decoration: none; border-radius: 5px;">
            Verify My Account
          </a>
          <p style="margin-top: 20px; color: #777;">If you did not create an account, you can ignore this email.</p>
        </div>
      </div>`,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw error;
  }
};

//Verify token sent in verification email
const verifyVerificationToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const findTenantQuery = `
      SELECT * FROM tenants WHERE verificationtoken = $1
    `;

    const result = await pool.query(findTenantQuery, [hashedToken]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const tenant = result.rows[0];

    if (new Date(tenant.verificationtokenexpiry) < new Date()) {
      return res.status(400).json({
        message: "Token expired. Please request a new verification email.",
        email: tenant.email,
      });
    }

    const updateTenantQuery = `
      UPDATE tenants
      SET isverified = true
      WHERE id = $1
    `;
    await pool.query(updateTenantQuery, [tenant.id]);

    // await sendAccountConfirmationEmail(tenant.email);

    res.json({ message: "Account verified successfully." });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//Resent verification email after token expires
const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    //Check if tenant exisits
    const findTenantQuery = `SELECT * FROM tenants WHERE email =$1`;
    const result = await pool.query(findTenantQuery, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    const tenant = result.rows[0];

    //Check if account is already verified
    if (tenant.isverified) {
      return res
        .status(400)
        .json({ message: "Account is already verified. Please login." });
    }

    // Generate new verification token
    const plainToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");

    const newExpiry = new Date(Date.now() + 2 * 60 * 1000);

    //Update tenant's token and expiry
    const updateTokenQuery = `
       UPDATE tenants 
      SET verificationtoken = $1, verificationtokenexpiry = $2 
      WHERE email = $3
      `;

    await pool.query(updateTokenQuery, [hashedToken, newExpiry, email]);

    //Send verification email
    await sendVerificationEmail(email, plainToken);

    return res
      .status(200)
      .json({ message: "Verification email resent successfully." });
  } catch (error) {
    console.error("Error resending verification email:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

//Send Maintenance Request Email
const sendMaintenanceRequestEmail = async (email, request) => {
  const subject = "Maintenance Request Received";

  const message = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333;">Maintenance Request Received</h2>
        <p style="color: #555;">Dear Tenant,</p>
        <p style="color: #555;">We have received your maintenance request regarding <strong>${request.category}</strong>.</p>
        <p style="color: #555;">Technician <strong>${request.technician_name}</strong> has been assigned to assist you shortly.</p>
        <p style="margin-top: 20px; color: #777;">Thank you for choosing Murandi Apartments.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"Murandi Apartments" <${process.env.MAIL_USER}>`,
    to: email,
    subject: subject,
    html: message,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw error;
  }
};

//Send Rent Payment Email
const sendRentPaymentEmail = async (
  email,
  { amountPaid, apartmentNumber, paymentDate }
) => {
  const subject = "Rent Payment Confirmation";

  //Calculate Next Rent Date
  const currentDate = new Date(paymentDate);
  const nextPaymentDate = new Date(currentDate);
  nextPaymentDate.setDate(currentDate.getDate() + 30);
  const formattedNextPaymentDate = nextPaymentDate.toISOString().split("T")[0];

  //Generate PDF receipt
  const pdfBuffer = await createReceipt({
    amountPaid,
    apartmentNumber,
    paymentDate,
  });

  const message = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333;">Rent Payment Received</h2>
        <p style="color: #555;">Dear Tenant,</p>
        <p style="color: #555;">We have received your rent payment of <strong>KES ${amountPaid}</strong> for Apartment <strong>${apartmentNumber}</strong> on <strong>${paymentDate}</strong>.</p>
        <p style="color: #555;">Your next rent payment is due by <strong>${formattedNextPaymentDate}</strong>.</p>
        <p style="margin-top: 20px; color: #777;">Thank you for being a valued resident of Murandi Apartments.</p>
      </div>
    </div>`;

  const mailOptions = {
    from: `"Murandi Apartments" <${process.env.MAIL_USER}>`,
    to: email,
    subject: subject,
    html: message,
    attachments: [
      {
        filename: `receipt_${paymentDate}.pdf`,
        content: pdfBuffer,
        encoding: "base64",
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw error;
  }
};

// Password Reset Email
const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/password/reset?token=${token}`;

  const mailOptions = {
    from: `"Murandi Apartments" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #555;">Click the button below to reset your password.</p>
          <a href="${resetUrl}" 
            style="display: inline-block; padding: 10px 20px; margin-top: 15px; background-color: #ff9800; color: #fff; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p style="margin-top: 20px; color: #777;">If you did not request this, ignore this email.</p>
        </div>
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending password reset email:`, error);
    throw error;
  }
};

//Resend password reset email
const resendPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Check if tenant exists
    const result = await pool.query(
      "SELECT * FROM tenants WHERE email = $1",
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate and store a new token and expiry
    const plainToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");
    const expiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

    await pool.query(
      `UPDATE tenants 
       SET passwordresettoken = $1, passwordresettokenexpiry = $2 
       WHERE email = $3`,
      [hashedToken, expiry, email]
    );

    await sendPasswordResetEmail(email, plainToken);

    res.json({ message: "New password reset email sent." });
  } catch (error) {
    console.error("Error resending password reset email:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

//Verify the password reset token
const verifyPasswordResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token is required." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const result = await pool.query(
      `SELECT email, passwordresettokenexpiry 
       FROM tenants 
       WHERE passwordresettoken = $1`,
      [hashedToken]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    if (new Date(user.passwordresettokenexpiry) < new Date()) {
      return res.status(400).json({
        message: "Password reset token expired. Please request a new one.",
      });
    }

    res.status(200).json({ message: "Token is valid.", email: user.email });
  } catch (error) {
    console.error("Error verifying password reset token:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  sendVerificationEmail,
  verifyVerificationToken,
  resendVerificationEmail,
  sendMaintenanceRequestEmail,
  sendRentPaymentEmail,
  sendPasswordResetEmail,
  verifyPasswordResetToken,
  resendPasswordResetEmail,
};

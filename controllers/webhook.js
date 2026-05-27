const Stripe = require("stripe");
const pool = require("../config/db");
const { createPaymentReport } = require("../controllers/reports");
const { sendRentPaymentEmail } = require("../controllers/emailService");
const { createNotification } = require("../controllers/notifications");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const handleWebhook = async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK;
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error.message);
    return res.status(400).send("Webhook error.");
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      const paymentId = session.metadata?.paymentId;
      const apartmentNumber = session.metadata?.apartmentNumber; // Assuming apartmentNumber is in metadata

      try {
        if (!paymentId) {
          throw new Error("Payment ID not found in session metadata");
        }
        if (!apartmentNumber) {
          throw new Error("Apartment number not found in session metadata");
        }

        // Fetch tenant ID using apartmentnumber
        const tenantIdQuery = `SELECT id FROM tenants WHERE apartmentnumber = $1`;
        const tenantIdResult = await pool.query(tenantIdQuery, [
          apartmentNumber,
        ]);

        if (tenantIdResult.rows.length === 0) {
          throw new Error("Tenant not found for the given apartment number");
        }

        const tenantId = tenantIdResult.rows[0].id;

        // Update payment status
        const updateQuery = `UPDATE payment SET paymentstatus = $1 WHERE paymentid = $2`;
        await pool.query(updateQuery, ["paid", paymentId]);
        console.log(`Payment ${paymentId} marked as paid`);

        // Fetch tenant details
        const tenantQuery = `SELECT firstname, lastname, apartmentnumber, email FROM tenants WHERE id = $1`;
        const tenantResult = await pool.query(tenantQuery, [tenantId]);

        if (tenantResult.rows.length === 0) {
          throw new Error("Tenant not found");
        }

        const {
          firstname,
          lastname,
          apartmentnumber: fetchedApartmentNumber,
          email: tenantEmail,
        } = tenantResult.rows[0];
        const fullName = `${firstname} ${lastname}`;

        // Get the current date for payment date
        const paymentDate = new Date().toISOString().split("T")[0];

        // Send the rent payment confirmation email
        await sendRentPaymentEmail(tenantEmail, {
          amountPaid: session.amount_total / 100, // Convert from cents to KES
          apartmentNumber: fetchedApartmentNumber,
          paymentDate,
        });

        await createNotification(
          tenantId,
          "Your rent payment was successful. Please check your email for a receipt."
        );

        // Prepare payment report data
        const paymentReportData = {
          tenant_name: fullName,
          apartment_id: fetchedApartmentNumber,
          amount_paid: session.amount_total / 100, // Convert from cents to dollars
          payment_date: paymentDate,
          payment_status: "paid",
        };

        // Create the payment report
        await createPaymentReport(paymentReportData);
        console.log(`Payment report created for tenant ${fullName}`);

        return res.status(200).send("Webhook received and processed.");
      } catch (error) {
        console.error("Error processing webhook:", error.message);
        return res.status(500).send("Internal server error.");
      }

    case "payment_intent.payment_failed":
      const failedIntent = event.data.object;
      const failedPaymentId = failedIntent.metadata?.paymentId;

      try {
        if (failedPaymentId) {
          const updateQuery = `UPDATE payment SET paymentstatus = $1 WHERE paymentid = $2`;
          await pool.query(updateQuery, ["failed", failedPaymentId]);
          console.log(`Payment ${failedPaymentId} marked as failed`);
        }
        return res.status(200).send("Webhook received and processed.");
      } catch (error) {
        console.error("Failed to mark payment as failed:", error.message);
        return res.status(500).send("Internal server error.");
      }

    default:
      console.log(`Unhandled event type: ${event.type}`);
      return res.status(200).send("Webhook received.");
  }
};

const handleMpesaCallback = async (req, res) => {
  try {
    const callback = req.body.Body.stkCallback;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } =
      callback;

    if (ResultCode === 0) {
      const metadata = callback.CallbackMetadata.Item;

      const amount = metadata.find((item) => item.Name === "Amount")?.Value;
      const phone = metadata.find((item) => item.Name === "PhoneNumber")?.Value;

      //Look up tenantid by phone number
      const findTenantQuery = `SELECT tenantid FROM tenant WHERE phonenumber = $1`;
      const tenantResult = await pool.query(findTenantQuery, [phone]);

      if (tenantResult.rows.length === 0) {
        console.error("No tenant found with phone number:", phone);
        return res.status(404).send("Tenant not found.");
      }

      const tenantId = tenantResult.rows[0].tenantid;

      // Now insert into payment table
      const insertQuery = `
        INSERT INTO payment (tenantid, amountpaid, paymentdate, paymentmethod, paymentstatus)
        VALUES ($1, $2, CURRENT_DATE, $3, $4)
      `;

      await pool.query(insertQuery, [tenantId, amount, "mpesa", "paid"]);

      console.log("M-PESA payment recorded for tenant:", tenantId);
    } else {
      console.log(`M-PESA transaction failed. Reason: ${ResultDesc}`);
      // You can also log it to a separate table if you want
    }

    res.status(200).json({ message: "Callback received successfully" });
  } catch (error) {
    console.error("Error handling M-PESA callback:", error.message);
    res.status(500).send("Server error");
  }
};

module.exports = { handleWebhook, handleMpesaCallback };

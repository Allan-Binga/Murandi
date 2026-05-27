const dotenv = require("dotenv");
const Stripe = require("stripe");
const pool = require("../config/db");
const moment = require("moment");
const axios = require("axios");

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createRentCheckoutSession = async (req, res) => {
  const tenantId = req.tenantId;
  // console.log(tenantId);

  try {
    //Find Tenant Apartment's Number
    const tenantQuery = `SELECT apartmentnumber, email FROM tenants WHERE id = $1`;
    const tenantResult = await pool.query(tenantQuery, [tenantId]);

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const { apartmentnumber: apartmentNumber, email: tenantEmail } =
      tenantResult.rows[0];

    //Get rent amount from apartment_listings
    const rentQuery = `SELECT price, IMAGE FROM apartment_listings WHERE apartmentnumber = $1`;
    const rentResult = await pool.query(rentQuery, [apartmentNumber]);

    if (rentResult.rows.length === 0) {
      return res.status(404).json({ error: "Apartment listing not found" });
    }

    const { price: rentAmount, image: apartmentImage } = rentResult.rows[0];

    //Current Date
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoString = thirtyDaysAgo.toISOString().split("T")[0];

    // Check if a payment was made in the last 30 days
    const paymentCheckQuery = `
      SELECT * FROM payment
      WHERE tenantid = $1
        AND paymentdate > $2
        AND paymentstatus = 'pending' 
    `;
    const paymentCheckResult = await pool.query(paymentCheckQuery, [
      tenantId,
      thirtyDaysAgoString,
    ]);

    if (paymentCheckResult.rows.length > 0) {
      return res.status(400).json({
        error:
          "You have already paid rent within the last 30 days. Please try again later.",
      });
    }

    const insertPaymentQuery = `
      INSERT INTO payment (tenantid, amountpaid, paymentdate, paymentmethod, paymentstatus)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING paymentid
    `;

    const values = [tenantId, rentAmount, today, "stripe", "pending"];
    const result = await pool.query(insertPaymentQuery, values);
    const paymentId = result.rows[0].paymentid;

    //Stripe Session
    //Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "kes",
            product_data: {
              name: `Rent Payment for Tenant ${tenantId}`,
              images: apartmentImage ? [apartmentImage] : [],
            },
            unit_amount: rentAmount * 100, // Cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment/success`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancelled`,
      metadata: {
        paymentId: paymentId.toString(),
        tenantId: tenantId.toString(),
        apartmentNumber: apartmentNumber.toString(),
      },
      payment_intent_data: {
        metadata: {
          paymentId: paymentId.toString(),
          tenantId: tenantId.toString(),
          apartmentNumber: apartmentNumber.toString(),
        },
      },
    });

    res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating rent checkout session:", error.message);
    res.status(500).json({ error: "Failed to create checkout session." });
  }
};

const createMpesaCheckout = async (req, res) => {
  try {
    const { amount, phoneNumber } = req.body; // Get amount and phone number from request body
    if (!amount || !phoneNumber) {
      return res
        .status(400)
        .json({ message: "Amount and phone number are required" });
    }

    // Validate phone number format (must be 2547XXXXXXXX)
    if (!/^2547\d{8}$/.test(phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    const shortcode = 174379;
    const passkey = process.env.PASSKEY;
    const consumerKey = process.env.CONSUMER_KEY;
    const consumerSecret = process.env.CONSUMER_SECRET;
    const callbackUrl = process.env.CALLBACK_URL;

    const timestamp = moment().format("YYYYMMDDHHmmss");
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
      "base64"
    );
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      "base64"
    );

    // Get access token
    const tokenResponse = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    const accessToken = tokenResponse.data.access_token;

    // STK Push request
    const stkPush = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: callbackUrl,
        AccountReference: "Murandi-Apartments",
        TransactionDesc: "Rent Payment",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.status(200).json({
      message: "STK Push initiated",
      data: stkPush.data,
    });
  } catch (error) {
    const errorMessage = error.response?.data?.errorMessage || error.message;
    console.error("Error:", errorMessage);
    res.status(500).json({
      message: "Failed to initiate STK Push",
      error: errorMessage,
    });
  }
};

module.exports = { createRentCheckoutSession, createMpesaCheckout };

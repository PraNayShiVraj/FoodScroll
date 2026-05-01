const crypto = require("crypto");
const SibApiV3Sdk = require("sib-api-v3-sdk");
require("dotenv").config();

// In-memory OTP storage (same as your Python version)
const otpStorage = {};
const OTP_EXPIRY_SECONDS = 300;

// Brevo Config
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "foodscrollapp@gmail.com";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "FoodScroll";

// 🔐 Generate random 6-digit OTP
const generateOTP = (identifier) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + OTP_EXPIRY_SECONDS * 1000;

    // Store OTP
    otpStorage[identifier] = {
        otp,
        expiry
    };

    // Send email
    sendOtpEmail(identifier, otp);

    console.log(`[OTP SERVICE] OTP sent to ${identifier}`);
    return otp;
};

// 📧 Send OTP Email using Brevo
const sendOtpEmail = async (targetEmail, otpCode) => {
    if (!BREVO_API_KEY || BREVO_API_KEY.length < 10) {
        console.log(`DEBUG: Missing API Key. OTP for ${targetEmail}: ${otpCode}`);
        return true;
    }

    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications["api-key"];
    apiKey.apiKey = BREVO_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const email = {
        to: [{ email: targetEmail }],
        sender: {
            email: BREVO_SENDER_EMAIL,
            name: BREVO_SENDER_NAME
        },
        subject: "Your OTP Verification Code",
        htmlContent: `
      <div style="max-width:600px;margin:auto;font-family:sans-serif;border:1px solid #ddd;border-radius:8px;">
        <div style="background:#0052cc;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">Verification Required</h2>
        </div>
        <div style="padding:30px;text-align:center;">
          <p>Use this OTP (valid 5 mins):</p>
          <h1 style="letter-spacing:8px;color:#0052cc;">${otpCode}</h1>
          <p style="font-size:12px;color:#888;">Ignore if not requested.</p>
        </div>
      </div>
    `
    };

    try {
        await apiInstance.sendTransacEmail(email);
        return true;
    } catch (error) {
        console.error("Brevo API Error:", error);
        return false;
    }
};

// 🔍 Verify OTP
const verifyOTP = (identifier, providedOtp) => {
    const data = otpStorage[identifier];

    if (!data) return false;

    // Expiry check
    if (Date.now() > data.expiry) {
        delete otpStorage[identifier];
        return false;
    }

    // Match check
    if (data.otp === providedOtp) {
        delete otpStorage[identifier]; // consume OTP
        return true;
    }

    return false;
};

module.exports = {
    generateOTP,
    sendOtpEmail,
    verifyOTP
};
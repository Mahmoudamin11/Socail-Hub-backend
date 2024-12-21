import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();

// إعداد Brevo API
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const transactionalEmailsApi = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendOTPEmail = async (recipientEmail, otp) => {
  try {
    const sendSmtpEmail = {
      to: [{ email: recipientEmail }],
      sender: { email: process.env.EMAIL_USER, name: process.env.SenderName },
      subject: "Your OTP Code",
      textContent: `Your OTP code is: ${otp}. This code is valid for 5 minutes.`,
    };

    // إرسال البريد
    await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
    console.log(`OTP sent successfully to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending OTP email:", error.response?.body || error.message);
  }
};

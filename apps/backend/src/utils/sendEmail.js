const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendAccountCreatedEmail = async (user) => {
  try {
    const htmlTemplate = `
      <div style="font-family:Arial, sans-serif; padding:20px; background:#f9f9f9;">
        <div style="max-width:600px; margin:auto; background:white; padding:20px; border-radius:8px;">
          <h2 style="color:#2c3e50;">Developer Collaboration System</h2>
          <p>Hello <b>${user.firstName}</b>,</p>

          <p>Your account has been successfully created in the Developer Collaboration System.</p>

          <p>You can now log in and start collaborating with other developers.</p>

          <hr>
          <p style="font-size:12px; color:#777;">
            This email was generated automatically as part of the academic project.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Developer Collaboration System" <${process.env.EMAIL_USER}>`,
      to: user.emailId,
      subject: "Account Successfully Created | Developer Collaboration System",
      html: htmlTemplate,
    });

    console.log("Signup email sent to:", user.emailId);
  } catch (error) {
    console.error("Email send failed:", error);
  }
};

module.exports = sendAccountCreatedEmail;

const nodemailer = require("nodemailer");

let transporterInstance = null;

async function createTransporter() {
  if (transporterInstance) return transporterInstance;

  // development: Ethereal
  const testAccount = await nodemailer.createTestAccount();
  transporterInstance = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log("📧 Ethereal test account:", testAccount.user);
  return transporterInstance;
}

module.exports = createTransporter;

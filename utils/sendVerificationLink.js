const transporter = require("../config/mailer");

const sendVerificationLink = async ({ to, username, verifyToken }) => {
  try {
    const verifyLink = `${process.env.VERIFY_EMAIL_URL}?token=${verifyToken}`;
    const subject = `[${process.env.APP_NAME}] - Verifikasi Email`;

    //html
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${subject}</title>
</head>
<body style="font-family: 'Noto Sans', Helvetica, Arial, sans-serif; line-height: 1.6; margin-top: 10px; font-size: 13px;">
    <h2 style="color: #4f46e5;">${process.env.APP_NAME}</h2>
    
    <p>Halo <strong>${username}</strong>,</p>
    
    <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
        <h3>Verifikasi Email Akun Anda</h3>
        <p>Klik tombol di bawah untuk memverifikasi email dan mengaktifkan akun anda</p>
    </div>
    
    <p><a href="${verifyLink}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verifikasi Email Sekarang</a></p>
  
    
    <p style="color: #666; margin-top: 20px;">
        Link verifikasi akan kadaluarsa dalam 24 jam.<br>
        Jika anda tidak mendaftar di ${process.env.APP_NAME}, <strong>abaikan email ini</strong>.
    </p>
    
    <p style="margin-top: 30px; color: #666; font-size: 12px;">
        Email otomatis dari ${process.env.APP_NAME}<br>
    </p>
</body>
</html>
    `;

    // Simple text content
    const textContent = `${process.env.APP_NAME}

Halo ${username},

Verifikasi Email Akun Anda

Klik link berikut untuk memverifikasi email dan mengaktifkan akun Anda:
${verifyLink}

Link verifikasi akan kadaluarsa dalam 24 jam.
Jika Anda tidak mendaftar di ${process.env.APP_NAME}, abaikan email ini.

Email otomatis dari ${process.env.APP_NAME}
`;

    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`Verification email sent to ${to}`);
    return info;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return null;
  }
};

module.exports = { sendVerificationLink };

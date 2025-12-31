const transporter = require("../config/mailer");

const sendRegistrationDecisionEmail = async ({
  to,
  username,
  decision,
  reason,
  registerCode,
}) => {
  try {
    const isAccepted = decision === "approved";
    const subject = `[${process.env.APP_NAME}] - Registrasi ${
      isAccepted ? "Disetujui" : "Ditolak"
    }`;

    //html
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${subject}</title>
</head>
<body style="font-family: 'Noto Sans', Helvetica, Arial, sans-serif;line-height: 1.6; margin-top: 10px; font-size: 13px;">
    <h2 style="color: #4f46e5;">${process.env.APP_NAME}</h2>
    
    <p>Halo <strong>${username}</strong>,</p>
    
    <div style="background: ${
      isAccepted ? "#f0f9ff" : "#fef2f2"
    }; border-left: 4px solid ${
      isAccepted ? "#10b981" : "#ef4444"
    }; padding: 15px; margin: 20px 0;">
        <p><strong>Status:</strong> ${
          isAccepted ? "DISETUJUI" : "DITOLAK"
        }</p>
        <p><strong>Kode:</strong> ${registerCode}</p>
        ${reason ? `<p><strong>Catatan:</strong> ${reason}</p>` : ""}
    </div>
    
    ${
      isAccepted
        ? `<p>Akun Anda telah aktif. Silakan login untuk mulai menggunakan platform.</p>
           <p><a href="${process.env.LOGIN_URL}"  target="_blank" rel="noopener noreferrer" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Login Sekarang</a></p>`
        : `<p>Registrasi anda ditolak oleh Admin ${process.env.APP_NAME}, anda tidak dapat login ke platform menggunakan akun ini.</p>`
    }
    
    <p style="margin-top: 30px; color: #666; font-size: 12px;">
        Email otomatis dari ${process.env.APP_NAME}<br>
    </p>
</body>
</html>
    `;

    // Simple text content
    const textContent = `${process.env.APP_NAME}

Halo ${username},

Registrasi Anda ${isAccepted ? "DISETUJUI" : "DITOLAK"}.

Kode: ${registerCode}
${reason ? `Catatan: ${reason}\n` : ""}

${
  isAccepted
    ? `Akun Anda telah aktif. Login untuk mulai menggunakan platform:\n${process.env.LOGIN_URL}`
    : "Registrasi anda ditolak oleh Admin ${process.env.APP_NAME}, anda tidak dapat login ke platform menggunakan akun ini."
}

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


    console.log(`Email sent to ${to}`);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    return null;
  }
};

module.exports = { sendRegistrationDecisionEmail };

exports.generateOtp = (length = 6, expireMinutes = 15) => {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  const otpExpires = new Date(Date.now() + expireMinutes * 60 * 1000);
  return { otp, otpExpires };
};

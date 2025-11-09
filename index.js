require('dotenv').config();
const express = require('express');
const sequelize = require('./configs/database');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoute = require("./routes/AuthRoutes")

const app = express();
const port = process.env.PORT || 8080;
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: true }));

app.use('/api/auth', authRoute)

app.get("/", (req, res) => {
  res.send("Inklusi kerja API");
});

app.listen(port, async () => {
  console.log(`🚀 Server running on port ${port}`);

  try {
    await sequelize.authenticate();
    console.log("✅ Koneksi ke database berhasil");

    await sequelize.sync({alter: true});
    console.log("🛠️ Model disinkronkan ke database");
  } catch (err) {
    console.error("❌ Gagal koneksi atau sync database:", err);
  }
});
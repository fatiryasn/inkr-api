require('dotenv').config();
const express = require('express');
const sequelize = require('./configs/database');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoute = require("./routes/AuthRoutes")
const jobSeekerRoute = require("./routes/JobSeekerRoutes")
const userRoute = require("./routes/UserRoutes")
const jobRoute = require('./routes/JobRoutes')
const dataRoute = require('./routes/DataRoutes')

const app = express();
const port = process.env.PORT || 8080;
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: true }));

app.use('/api/auth', authRoute)
app.use("/api", userRoute);
app.use("/api", jobSeekerRoute);
app.use("/api", jobRoute)
app.use("/api/data", dataRoute)

app.get("/", (req, res) => {
  res.send("Inklusi kerja API");
});

app.listen(port, async () => {
  console.log(`🚀 Server running on port ${port}`);

  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    await sequelize.sync();
    console.log("🛠️ Model synchronized");
  } catch (err) {
    console.error("❌ Failed to sync/connect to database", err);
  }
});
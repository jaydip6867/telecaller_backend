require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");

const connectDB = require("./config/db");

const app = express();
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "https://telecaller-six.vercel.app"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(cors({
  origin: "https://telecaller-six.vercel.app",
  credentials: true
}));

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/inquiry", require("./routes/inquiry"));

module.exports = app;
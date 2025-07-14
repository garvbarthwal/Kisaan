// Load environment variables FIRST, before any other imports
const dotenv = require("dotenv");
dotenv.config({ path: './.env' });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const messageRoutes = require("./routes/messageRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const aiRoutes = require("./routes/aiRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const locationRoutes = require("./routes/locationRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const connectDB = require("./db/connection");
const translateRouter = require("./routes/translate");

// Initialize Cloudinary configuration
const { cloudinary } = require('./utils/cloudinary');
cloudinary(); // This will trigger the configuration

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'https://kisaan.vercel.app', 'https://kisaan-4mg7.vercel.app'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.get("/", (req, res) => {
  res.send("Kisaan API is running");
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/translate", express.json(), translateRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


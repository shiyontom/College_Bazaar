require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const listingRoutes = require("./routes/listingRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatRoutes = require("./routes/chatRoutes");

// Initialize app
const app = express();

// Connect to database
connectDB();

// Middleware
const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:3000"].filter(
  Boolean
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests and server-to-server calls.
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      try {
        const hostname = new URL(origin).hostname;
        if (hostname.endsWith(".vercel.app")) {
          return callback(null, true);
        }
      } catch (error) {
        // Fall through to rejection below.
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chats", chatRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== "production";

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Server error",
    stack: isDev ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;


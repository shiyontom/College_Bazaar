const jwt = require("jsonwebtoken");

/**
 * Protect middleware
 * - Reads JWT from httpOnly cookie "token" OR Authorization Bearer header
 * - Verifies using JWT_SECRET
 * - Attaches { id, email } to req.user
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const cookieToken = req.cookies && req.cookies.token;

    let token = null;

    if (cookieToken) {
      token = cookieToken;
    } else if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is not defined in environment variables.");
      return res
        .status(500)
        .json({ success: false, message: "Server configuration error" });
    }

    const decoded = jwt.verify(token, secret);

    const User = require("../models/User");
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    req.user = user;

    return next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res
      .status(401)
      .json({ success: false, message: "Not authorized" });
  }
};

module.exports = {
  protect,
};


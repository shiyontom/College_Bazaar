const { validationResult, body } = require("express-validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { isCollegeEmail } = require("../utils/emailValidator");
const { sendEmail } = require("../utils/sendEmail");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Validation chains
const validateRegister = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

const validateLogin = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  return null;
}

function createToken(payload) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
  }

  return jwt.sign(payload, secret, { expiresIn });
}

function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === "production";

  // Default to 7 days if JWT_EXPIRES_IN is not parseable as days
  const maxAgeDays = 7;
  const maxAgeMs = maxAgeDays * ONE_DAY_MS;

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: maxAgeMs,
  });
}

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = [
  ...validateRegister,
  async (req, res) => {
    try {
      const validationErrorResponse = handleValidationErrors(req, res);
      if (validationErrorResponse) return validationErrorResponse;

      const { name, email, password } = req.body;

      const { valid, domain } = isCollegeEmail(email);
      if (!valid) {
        return res.status(400).json({
          success: false,
          message: "Registration requires a valid college email address.",
        });
      }

      const existing = await User.findByEmail(email);
      if (existing) {
        return res
          .status(409)
          .json({ success: false, message: "Email already registered" });
      }

      const collegeDomain = domain;

      const user = await User.create({
        name,
        email,
        password,
        collegeDomain,
      });

      const token = createToken({ id: user._id, email: user.email });
      setAuthCookie(res, token);

      return res.status(201).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          collegeDomain: user.collegeDomain,
          profilePicture: user.profilePicture,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Register error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Server error during registration" });
    }
  },
];

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = [
  ...validateLogin,
  async (req, res) => {
    try {
      const validationErrorResponse = handleValidationErrors(req, res);
      if (validationErrorResponse) return validationErrorResponse;

      const { email, password } = req.body;

      const user = await User.findByEmail(email).select("+password");
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const token = createToken({ id: user._id, email: user.email });
      setAuthCookie(res, token);

      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          collegeDomain: user.collegeDomain,
          profilePicture: user.profilePicture,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Server error during login" });
    }
  },
];

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public (removes cookie)
const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  });

  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    const user = await User.findById(userId)
      .select("-password")
      .populate({
        path: "listings",
        select: "title price status isTradeable",
      });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Return user object with all fields including role
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        collegeDomain: user.collegeDomain,
        profilePicture: user.profilePicture,
        bio: user.bio,
        role: user.role,
        listings: user.listings,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error("GetMe error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching user" });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account with that email exists",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetUrl = `${clientUrl}/auth/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #0f172a; padding: 24px; color: #e5e7eb;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #020617; border-radius: 12px; border: 1px solid #1e293b; padding: 24px;">
          <div style="text-align: center; margin-bottom: 16px;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:999px;background:#4f46e5;color:white;font-weight:600;font-size:13px;margin-bottom:8px;">
              CB
            </div>
            <h1 style="margin:0;font-size:20px;font-weight:700;color:#e5e7eb;">CollegeBazaar</h1>
          </div>
          <p style="font-size:14px;line-height:1.5;color:#cbd5f5;margin-top:8px;">
            You requested a password reset for your CollegeBazaar account. Click the button below to set a new password.
          </p>
          <p style="font-size:13px;color:#9ca3af;margin:12px 0 20px;">
            This link will expire in <strong>10 minutes</strong> for your security.
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${resetUrl}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#4f46e5;color:white;font-size:14px;font-weight:600;text-decoration:none;">
              Reset your password
            </a>
          </div>
          <p style="font-size:12px;color:#9ca3af;margin-bottom:4px;">
            If the button doesn’t work, paste this link into your browser:
          </p>
          <p style="font-size:11px;color:#6b7280;word-break:break-all;">
            ${resetUrl}
          </p>
          <hr style="border:none;border-top:1px solid #1f2937;margin:20px 0;" />
          <p style="font-size:12px;color:#6b7280;">
            If you didn’t request this, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: "CollegeBazaar - Password Reset Request",
        html,
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      console.error("Forgot password email error:", err);
      return res.status(500).json({
        success: false,
        message: "Error sending password reset email",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error processing request" });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include 1 uppercase letter and 1 number",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    const jwtToken = createToken({ id: user._id, email: user.email });
    setAuthCookie(res, jwtToken);

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error resetting password" });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};


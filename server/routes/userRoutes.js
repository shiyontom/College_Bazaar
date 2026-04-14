const express = require("express");
const { getUserProfile, updateMyProfile } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { uploadAvatar } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public profile route
router.get("/:id", getUserProfile);

// Update current user's profile
router.put("/me", protect, uploadAvatar.single("profilePicture"), updateMyProfile);

module.exports = router;


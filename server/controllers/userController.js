const User = require("../models/User");
const Listing = require("../models/Listing");
const { cloudinary } = require("../config/cloudinary");

// 1. Public profile with active listings
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const listings = await Listing.find({
      seller: id,
      status: "active",
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      user,
      listings,
    });
  } catch (err) {
    console.error("Get user profile error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching user profile" });
  }
};

// 2. Update my profile
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { name, bio, phone } = req.body;

    if (typeof name !== "undefined") {
      user.name = name;
    }
    if (typeof bio !== "undefined") {
      user.bio = bio;
    }
    if (typeof phone !== "undefined") {
      user.phone = String(phone).trim();
    }

    // Handle profile picture upload via Cloudinary
    if (req.file) {
      const oldPublicId = user.profilePicture?.publicId;

      // CloudinaryStorage uploads the file and returns:
      // - req.file.path = secure_url (the image URL)
      // - req.file.filename = public_id (the Cloudinary public ID)
      user.profilePicture = {
        url: req.file.path,
        publicId: req.file.filename,
      };

      // Delete old avatar if exists
      if (oldPublicId && oldPublicId !== req.file.filename) {
        cloudinary.uploader
          .destroy(oldPublicId)
          .catch((err) =>
            console.error("Failed to delete old avatar:", err.message || err)
          );
      }
    }

    await user.save();

    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;

    return res.status(200).json({
      success: true,
      user: sanitizedUser,
    });
  } catch (err) {
    console.error("Update my profile error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error updating profile" });
  }
};

module.exports = {
  getUserProfile,
  updateMyProfile,
};


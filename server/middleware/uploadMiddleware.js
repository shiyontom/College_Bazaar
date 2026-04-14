const {
  cloudinary,
  uploadListingImages,
  uploadAvatarImage,
} = require("../config/cloudinary");

// Multer middleware using Cloudinary storage for listings
const uploadImages = uploadListingImages;

// Multer middleware for avatar uploads
const uploadAvatar = uploadAvatarImage;

// Helper to delete an asset from Cloudinary
async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    // Log but don't crash the request; cleanup failures shouldn't break main flow
    console.error("Cloudinary delete error:", err.message || err);
  }
}

module.exports = {
  uploadImages,
  deleteFromCloudinary,
  uploadAvatar,
};


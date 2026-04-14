const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Listing images storage
const listingStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "collegebazaar/listings",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 800,
        height: 800,
        crop: "limit",
        quality: "auto",
      },
    ],
  },
});

// Avatar storage
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "collegebazaar/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 400,
        height: 400,
        crop: "fill",
        gravity: "face",
        quality: "auto",
      },
    ],
  },
});

const uploadListingImages = multer({
  storage: listingStorage,
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const uploadAvatarImage = multer({
  storage: avatarStorage,
  limits: {
    files: 1,
    fileSize: 3 * 1024 * 1024, // 3MB
  },
});

module.exports = {
  cloudinary,
  uploadListingImages,
  uploadAvatarImage,
};



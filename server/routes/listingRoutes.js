const express = require("express");
const {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing,
  deleteListingImage,
  updateListingStatus,
} = require("../controllers/listingController");
const { protect } = require("../middleware/authMiddleware");
const { uploadImages } = require("../middleware/uploadMiddleware");

const router = express.Router();

// GET    /api/listings           → getAllListings
router.get("/", getAllListings);

// POST   /api/listings           → protect, upload.array("images", 5), createListing
router.post(
  "/",
  protect,
  uploadImages.array("images", 5),
  createListing
);

// GET    /api/listings/:id       → getListingById
router.get("/:id", getListingById);

// PUT    /api/listings/:id       → protect, upload.array("images", 5), updateListing
router.put(
  "/:id",
  protect,
  uploadImages.array("images", 5),
  updateListing
);

// DELETE /api/listings/:id       → protect, deleteListing
router.delete("/:id", protect, deleteListing);

// DELETE /api/listings/:id/image → protect, deleteListingImage
router.delete("/:id/image", protect, deleteListingImage);

// PATCH  /api/listings/:id/status → protect, updateListingStatus
router.patch("/:id/status", protect, updateListingStatus);

module.exports = router;


const { body, validationResult } = require("express-validator");
const Listing = require("../models/Listing");
const User = require("../models/User");
const { deleteFromCloudinary } = require("../middleware/uploadMiddleware");

// Validation chains
const validateCreateListing = [
  body("title").notEmpty().withMessage("Title is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a number greater than or equal to 0"),
  body("category").notEmpty().withMessage("Category is required"),
  body("isTradeable").optional().isBoolean().withMessage("isTradeable must be a boolean"),
  body("tradePreferences")
    .optional()
    .isLength({ max: 300 })
    .withMessage("Trade preferences cannot exceed 300 characters"),
];

const validateUpdateListing = [
  body("title").optional().notEmpty().withMessage("Title cannot be empty"),
  body("description")
    .optional()
    .notEmpty()
    .withMessage("Description cannot be empty"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a number greater than or equal to 0"),
  body("category").optional().notEmpty().withMessage("Category cannot be empty"),
  body("isTradeable").optional().isBoolean().withMessage("isTradeable must be a boolean"),
  body("tradePreferences")
    .optional()
    .isLength({ max: 300 })
    .withMessage("Trade preferences cannot exceed 300 characters"),
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

function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  return String(value);
}

// 1. Create listing
const createListing = [
  ...validateCreateListing,
  async (req, res) => {
    try {
      const validationResponse = handleValidationErrors(req, res);
      if (validationResponse) return validationResponse;

      const userId = req.user && req.user.id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Not authorized" });
      }

      const files = req.files || [];
      if (!files.length || files.length < 1 || files.length > 5) {
        return res.status(400).json({
          success: false,
          message: "You must upload between 1 and 5 images.",
        });
      }

      const { title, description, price, category, courseTags } = req.body;
      let { isTradeable, tradePreferences } = req.body;

      // Normalize types
      isTradeable =
        typeof isTradeable === "string"
          ? isTradeable === "true"
          : Boolean(isTradeable);

      if (!isTradeable) {
        tradePreferences = "";
      }

      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const images = files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));

      // Normalize courseTags: convert to uppercase, remove duplicates, limit to 5
      const normalizedCourseTags = Array.isArray(courseTags)
        ? [...new Set(courseTags.map(tag => String(tag).trim().toUpperCase()).filter(Boolean))].slice(0, 5)
        : [];

      const listing = await Listing.create({
        title,
        description,
        price,
        category,
        images,
        seller: user._id,
        collegeDomain: user.collegeDomain,
        isTradeable,
        tradePreferences,
        courseTags: normalizedCourseTags,
      });

      // Keep user's listings array in sync
      user.listings.push(listing._id);
      await user.save();

      return res.status(201).json({
        success: true,
        listing,
      });
    } catch (err) {
      console.error("Create listing error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Server error creating listing" });
    }
  },
];

// 2. Get all listings with filters/pagination
const getAllListings = async (req, res) => {
  try {
    const {
      collegeDomain,
      search,
      category,
      isTradeable,
      status,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 12,
      seller,
      courseTag,
    } = req.query;

    const query = {};

    // In production, require collegeDomain filter
    if (process.env.NODE_ENV === "production") {
      if (!collegeDomain) {
        return res.status(400).json({
          success: false,
          message: "collegeDomain query parameter is required.",
        });
      }
    }

    if (collegeDomain) {
      query.collegeDomain = collegeDomain.toLowerCase();
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      // Support multi-category filtering via comma-separated list
      if (String(category).includes(",")) {
        query.category = {
          $in: String(category)
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
        };
      } else {
        query.category = category;
      }
    }

    if (seller) {
      query.seller = seller;
    }

    if (typeof isTradeable === "string") {
      if (isTradeable === "true") query.isTradeable = true;
      if (isTradeable === "false") query.isTradeable = false;
    }

    query.status = status || "active";

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice) {
        query.price.$lte = Number(maxPrice);
      }
    }

    if (courseTag) {
      query.courseTags = { $in: [courseTag.toUpperCase()] };
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // newest
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [total, listings] = await Promise.all([
      Listing.countDocuments(query),
      Listing.find(query).sort(sortOption).skip(skip).limit(limitNum),
    ]);

    const pages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      listings,
      pagination: {
        total,
        page: pageNum,
        pages,
        limit: limitNum,
      },
    });
  } catch (err) {
    console.error("Get all listings error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching listings" });
  }
};

// 3. Get listing by ID
const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id).populate({
      path: "seller",
      select: "name email phone profilePicture collegeDomain bio",
    });

    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }

    // Fire-and-forget increment
    Listing.updateOne({ _id: id }, { $inc: { views: 1 } }).catch((err) =>
      console.error("Increment views error:", err)
    );

    return res.status(200).json({
      success: true,
      listing,
    });
  } catch (err) {
    console.error("Get listing by id error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching listing" });
  }
};

async function ensureOwnership(listingId, userId) {
  const listing = await Listing.findById(listingId);
  if (!listing) return { listing: null, error: "Listing not found", status: 404 };
  if (toIdString(listing.seller) !== toIdString(userId)) {
    return { listing: null, error: "Not authorized", status: 403 };
  }
  return { listing, error: null, status: 200 };
}

// 4. Update listing
const updateListing = [
  ...validateUpdateListing,
  async (req, res) => {
    try {
      const validationResponse = handleValidationErrors(req, res);
      if (validationResponse) return validationResponse;

      const userId = req.user && req.user.id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Not authorized" });
      }

      const { id } = req.params;
      const ownership = await ensureOwnership(id, userId);
      if (ownership.error) {
        return res
          .status(ownership.status)
          .json({ success: false, message: ownership.error });
      }

      const listing = ownership.listing;

      const files = req.files || [];
      if (files.length) {
        const newImages = files.map((file) => ({
          url: file.path,
          publicId: file.filename,
        }));

        if (listing.images.length + newImages.length > 5) {
          return res.status(400).json({
            success: false,
            message: "A listing cannot have more than 5 images.",
          });
        }

        listing.images.push(...newImages);
      }

      const {
        title,
        description,
        price,
        category,
        isTradeable,
        tradePreferences,
        courseTags,
      } = req.body;

      if (typeof title !== "undefined") listing.title = title;
      if (typeof description !== "undefined") listing.description = description;
      if (typeof price !== "undefined") listing.price = price;
      if (typeof category !== "undefined") listing.category = category;

      let tradeable =
        typeof isTradeable === "string"
          ? isTradeable === "true"
          : typeof isTradeable === "boolean"
          ? isTradeable
          : listing.isTradeable;

      listing.isTradeable = tradeable;

      if (!tradeable) {
        listing.tradePreferences = "";
      } else if (typeof tradePreferences !== "undefined") {
        listing.tradePreferences = tradePreferences;
      }

      if (typeof courseTags !== "undefined") {
        // Normalize courseTags: convert to uppercase, remove duplicates, limit to 5
        const normalizedCourseTags = Array.isArray(courseTags)
          ? [...new Set(courseTags.map(tag => String(tag).trim().toUpperCase()).filter(Boolean))].slice(0, 5)
          : [];
        listing.courseTags = normalizedCourseTags;
      }

      await listing.save();

      return res.status(200).json({
        success: true,
        listing,
      });
    } catch (err) {
      console.error("Update listing error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Server error updating listing" });
    }
  },
];

// 5. Delete listing
const deleteListing = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    const { id } = req.params;
    const ownership = await ensureOwnership(id, userId);
    if (ownership.error) {
      return res
        .status(ownership.status)
        .json({ success: false, message: ownership.error });
    }

    const listing = ownership.listing;

    // Delete images from Cloudinary
    const deletePromises = (listing.images || []).map((img) =>
      deleteFromCloudinary(img.publicId)
    );
    await Promise.all(deletePromises);

    // Remove listing from user's listings
    await User.updateOne(
      { _id: listing.seller },
      { $pull: { listings: listing._id } }
    );

    // Delete listing
    await Listing.deleteOne({ _id: listing._id });

    return res
      .status(200)
      .json({ success: true, message: "Listing deleted" });
  } catch (err) {
    console.error("Delete listing error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error deleting listing" });
  }
};

// 6. Delete listing image
const deleteListingImage = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    const { id } = req.params;
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "publicId is required",
      });
    }

    const ownership = await ensureOwnership(id, userId);
    if (ownership.error) {
      return res
        .status(ownership.status)
        .json({ success: false, message: ownership.error });
    }

    const listing = ownership.listing;

    if (!listing.images || listing.images.length <= 1) {
      return res.status(400).json({
        success: false,
        message: "Listing must have at least one image",
      });
    }

    const imageExists = listing.images.some(
      (img) => img.publicId === publicId
    );
    if (!imageExists) {
      return res.status(404).json({
        success: false,
        message: "Image not found on this listing",
      });
    }

    await deleteFromCloudinary(publicId);

    listing.images = listing.images.filter(
      (img) => img.publicId !== publicId
    );

    if (!listing.images.length) {
      return res.status(400).json({
        success: false,
        message: "Listing must have at least one image",
      });
    }

    await listing.save();

    return res.status(200).json({
      success: true,
      listing,
    });
  } catch (err) {
    console.error("Delete listing image error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error deleting listing image",
    });
  }
};

// 7. Update listing status
const updateListingStatus = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["active", "sold", "traded", "removed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const ownership = await ensureOwnership(id, userId);
    if (ownership.error) {
      return res
        .status(ownership.status)
        .json({ success: false, message: ownership.error });
    }

    const listing = ownership.listing;
    listing.status = status;
    await listing.save();

    return res.status(200).json({
      success: true,
      listing,
    });
  } catch (err) {
    console.error("Update listing status error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error updating listing status",
    });
  }
};

module.exports = {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing,
  deleteListingImage,
  updateListingStatus,
};


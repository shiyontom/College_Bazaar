const mongoose = require("mongoose");

const { Schema } = mongoose;

const imageSchema = new Schema(
  {
    url: { type: String, trim: true, required: [true, "Image URL is required"] },
    publicId: {
      type: String,
      trim: true,
      required: [true, "Image publicId is required"],
    },
  },
  { _id: false }
);

const LISTING_CATEGORIES = [
  "Books & Notes",
  "Textbooks",
  "Electronics",
  "Stationery",
  "Clothing",
  "Furniture",
  "Sports",
  "Lab Equipment",
  "Musical Instruments",
  "Other",
];

const LISTING_STATUSES = ["active", "sold", "traded", "removed"];

const listingSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: LISTING_CATEGORIES,
        message: "Invalid category",
      },
      trim: true,
    },
    images: {
      type: [imageSchema],
      validate: [
        {
          validator(arr) {
            return Array.isArray(arr) && arr.length >= 1;
          },
          message: "At least 1 image is required",
        },
        {
          validator(arr) {
            return Array.isArray(arr) && arr.length <= 5;
          },
          message: "No more than 5 images are allowed",
        },
      ],
      required: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller is required"],
      index: true,
    },
    collegeDomain: {
      type: String,
      required: [true, "College domain is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    isTradeable: {
      type: Boolean,
      default: false,
      index: true,
    },
    tradePreferences: {
      type: String,
      maxlength: [300, "Trade preferences cannot exceed 300 characters"],
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: { values: LISTING_STATUSES, message: "Invalid status" },
      default: "active",
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative"],
    },
    courseTags: {
      type: [String],
      default: [],
      validate: {
        validator: function(tags) {
          return tags.length <= 5;
        },
        message: "Maximum 5 course tags allowed"
      }
    },
  },
  {
    timestamps: true,
    strict: "throw",
  }
);

// Indexes
listingSchema.index({ collegeDomain: 1, status: 1 });
listingSchema.index({ isTradeable: 1, status: 1 });
listingSchema.index({ title: "text", description: "text", courseTags: "text" });

// Auto-populate seller on find queries
listingSchema.pre(/^find/, function () {
  this.populate("seller", "name profilePicture collegeDomain");
});

module.exports =
  mongoose.models.Listing || mongoose.model("Listing", listingSchema);


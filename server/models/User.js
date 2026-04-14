const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { Schema } = mongoose;

const profilePictureSchema = new Schema(
  {
    url: { type: String, trim: true, default: "" },
    publicId: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // security: don't return hashes by default
    },
    collegeDomain: {
      type: String,
      required: [true, "College domain is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    profilePicture: {
      type: profilePictureSchema,
      default: () => ({ url: "", publicId: "" }),
    },
    bio: {
      type: String,
      maxlength: [300, "Bio cannot exceed 300 characters"],
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator(value) {
          if (!value) return true;
          return /^\+?\d{10,15}$/.test(value);
        },
        message:
          "Phone must be 10-15 digits and may start with +",
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    listings: [{ type: Schema.Types.ObjectId, ref: "Listing", default: [] }],
    passwordResetToken: {
      type: String,
      default: undefined,
    },
    passwordResetExpires: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    strict: "throw",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure a consistent unique index on email (case-insensitive handled by lowercase: true)
userSchema.index({ email: 1 }, { unique: true });

userSchema.virtual("listingCount").get(function listingCount() {
  return Array.isArray(this.listings) ? this.listings.length : 0;
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function comparePassword(
  candidatePassword
) {
  if (typeof candidatePassword !== "string") return false;
  // If password isn't selected (select:false), it won't be present here.
  if (!this.password) {
    throw new Error(
      "Password hash is not loaded on this document. Query with .select('+password') to compare."
    );
  }
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.statics.findByEmail = function findByEmail(email) {
  if (typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  return this.findOne({ email: normalized });
};

// Hide password if it ever makes it into JSON/Object (extra safety)
function stripSensitive(_doc, ret) {
  delete ret.password;
  return ret;
}
userSchema.set("toJSON", { virtuals: true, transform: stripSensitive });
userSchema.set("toObject", { virtuals: true, transform: stripSensitive });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);


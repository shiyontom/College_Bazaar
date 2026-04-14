const mongoose = require("mongoose");

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
  },
  { timestamps: true }
);

const chatSchema = new Schema(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  { timestamps: true, strict: "throw" }
);

chatSchema.index({ listing: 1 }, { unique: true });

module.exports = mongoose.models.Chat || mongoose.model("Chat", chatSchema);

const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getOrCreateChatForListing,
  sendMessage,
} = require("../controllers/chatController");

const router = express.Router();

router.get("/listing/:listingId", protect, getOrCreateChatForListing);
router.post("/listing/:listingId/messages", protect, sendMessage);

module.exports = router;

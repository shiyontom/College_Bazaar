const Chat = require("../models/Chat");
const Listing = require("../models/Listing");

function toIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  return String(value);
}

async function createOrReuseListingChat(listingId, sellerId, userId) {
  try {
    return await Chat.create({
      listing: listingId,
      participants: [toIdString(sellerId), toIdString(userId)],
      messages: [],
    });
  } catch (err) {
    // Handle duplicate key race or legacy unique-index collisions gracefully.
    if (err?.code === 11000) {
      return Chat.findOne({ listing: listingId });
    }
    throw err;
  }
}

async function getListingAndParticipant(listingId, userId) {
  const listing = await Listing.findById(listingId).select("seller title status");
  if (!listing) {
    return { error: "Listing not found", status: 404 };
  }

  return { listing };
}

const getOrCreateChatForListing = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { listingId } = req.params;

    const ownership = await getListingAndParticipant(listingId, userId);
    if (ownership.error) {
      return res
        .status(ownership.status)
        .json({ success: false, message: ownership.error });
    }

    const sellerId = toIdString(ownership.listing.seller);

    let chat = await Chat.findOne({ listing: listingId })
      .populate("participants", "name profilePicture")
      .populate("messages.sender", "name profilePicture");

    if (!chat) {
      chat = await createOrReuseListingChat(listingId, sellerId, userId);
      chat = await Chat.findById(chat._id)
        .populate("participants", "name profilePicture")
        .populate("messages.sender", "name profilePicture");
    } else if (!chat.participants.some((p) => toIdString(p) === toIdString(userId))) {
      chat.participants.push(userId);
      await chat.save();
      chat = await Chat.findById(chat._id)
        .populate("participants", "name profilePicture")
        .populate("messages.sender", "name profilePicture");
    }

    return res.status(200).json({ success: true, chat });
  } catch (err) {
    console.error("Get/create chat error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching chat" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { listingId } = req.params;
    const { content } = req.body;

    const message = String(content || "").trim();
    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Message content is required" });
    }

    const ownership = await getListingAndParticipant(listingId, userId);
    if (ownership.error) {
      return res
        .status(ownership.status)
        .json({ success: false, message: ownership.error });
    }

    const sellerId = toIdString(ownership.listing.seller);

    let chat = await Chat.findOne({ listing: listingId });

    if (!chat) {
      chat = await createOrReuseListingChat(listingId, sellerId, userId);
    } else if (!chat.participants.some((p) => toIdString(p) === toIdString(userId))) {
      chat.participants.push(userId);
    }

    chat.messages.push({ sender: userId, content: message });
    await chat.save();

    const updated = await Chat.findById(chat._id)
      .populate("participants", "name profilePicture")
      .populate("messages.sender", "name profilePicture");

    return res.status(201).json({ success: true, chat: updated });
  } catch (err) {
    console.error("Send message error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error sending message" });
  }
};

module.exports = {
  getOrCreateChatForListing,
  sendMessage,
};

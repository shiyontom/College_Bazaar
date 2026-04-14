const Listing = require("../models/Listing");
const User = require("../models/User");
const { deleteFromCloudinary } = require("../middleware/uploadMiddleware");

// To set first admin, run this in MongoDB Atlas:
// db.users.updateOne({email: "shiyon.tom.ug23@nsut.ac.in"}, {$set: {role: "admin"}})

// 1. Get stats
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalListings = await Listing.countDocuments();
    const activeListings = await Listing.countDocuments({ status: "active" });
    const tradeableListings = await Listing.countDocuments({ isTradeable: true });
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalListings,
        activeListings,
        tradeableListings,
        newUsersThisWeek,
      },
    });
  } catch (err) {
    console.error("Get stats error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching stats",
    });
  }
};

// 2. Get all users (paginated)
const getAllUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      User.countDocuments(),
      User.find()
        .select("name email collegeDomain role createdAt listings")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const usersWithCounts = users.map((user) => ({
      ...user,
      listingCount: Array.isArray(user.listings) ? user.listings.length : 0,
    }));

    return res.status(200).json({
      success: true,
      users: usersWithCounts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit,
      },
    });
  } catch (err) {
    console.error("Get all users error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching users",
    });
  }
};

// 3. Get all listings (admin view - all statuses)
const getAllListingsAdmin = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = {};
    if (status) {
      query.status = status;
    }

    const [total, listings] = await Promise.all([
      Listing.countDocuments(query),
      Listing.find(query)
        .populate("seller", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      listings,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit,
      },
    });
  } catch (err) {
    console.error("Get all listings admin error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching listings",
    });
  }
};

// 4. Delete listing (admin)
const deleteListingAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id).populate("seller");
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    // Delete images from Cloudinary
    if (listing.images && listing.images.length > 0) {
      for (const image of listing.images) {
        if (image.publicId) {
          try {
            await deleteFromCloudinary(image.publicId);
          } catch (err) {
            console.error(`Failed to delete image ${image.publicId}:`, err);
          }
        }
      }
    }

    // Remove from user's listings array
    if (listing.seller && listing.seller.listings) {
      listing.seller.listings = listing.seller.listings.filter(
        (lid) => lid.toString() !== id
      );
      await listing.seller.save();
    }

    // Delete listing
    await Listing.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Listing removed by admin",
    });
  } catch (err) {
    console.error("Delete listing admin error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error deleting listing",
    });
  }
};

// 5. Toggle user role
const toggleUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'user' or 'admin'",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Toggle user role error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error updating user role",
    });
  }
};

module.exports = {
  getStats,
  getAllUsers,
  getAllListingsAdmin,
  deleteListingAdmin,
  toggleUserRole,
};

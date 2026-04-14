const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const {
  getStats,
  getAllUsers,
  getAllListingsAdmin,
  deleteListingAdmin,
  toggleUserRole,
} = require("../controllers/adminController");

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

router.get("/stats", getStats);
router.get("/users", getAllUsers);
router.get("/listings", getAllListingsAdmin);
router.delete("/listings/:id", deleteListingAdmin);
router.patch("/users/:id/role", toggleUserRole);

module.exports = router;

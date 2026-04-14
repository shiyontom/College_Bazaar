require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Listing = require("../models/Listing");

const DEFAULT_PASSWORD = "Password123";

const seedUsers = [
  {
    name: "Aarav Sharma",
    email: "aarav.sharma@nsut.ac.in",
    phone: "+919811223344",
    collegeDomain: "nsut.ac.in",
    bio: "3rd year CSE student. Mostly selling books and gadgets.",
    profilePicture: {
      url: "https://api.dicebear.com/9.x/initials/svg?seed=Aarav%20Sharma&backgroundColor=16a34a&textColor=ffffff",
      publicId: "seed/avatar-aarav-sharma",
    },
  },
  {
    name: "Ishita Verma",
    email: "ishita.verma@nsut.ac.in",
    phone: "+919811223355",
    collegeDomain: "nsut.ac.in",
    bio: "ECE student, open to barter for lab equipment and calculators.",
    profilePicture: {
      url: "https://api.dicebear.com/9.x/initials/svg?seed=Ishita%20Verma&backgroundColor=0284c7&textColor=ffffff",
      publicId: "seed/avatar-ishita-verma",
    },
  },
  {
    name: "Rohan Mehta",
    email: "rohan.mehta@nsut.ac.in",
    phone: "+919811223366",
    collegeDomain: "nsut.ac.in",
    bio: "Sports and hostel essentials seller. Quick campus handover.",
    profilePicture: {
      url: "https://api.dicebear.com/9.x/initials/svg?seed=Rohan%20Mehta&backgroundColor=ea580c&textColor=ffffff",
      publicId: "seed/avatar-rohan-mehta",
    },
  },
  {
    name: "Sneha Gupta",
    email: "sneha.gupta@nsut.ac.in",
    phone: "+919811223377",
    collegeDomain: "nsut.ac.in",
    bio: "IT branch. Selling notes, stationery, and internship prep books.",
    profilePicture: {
      url: "https://api.dicebear.com/9.x/initials/svg?seed=Sneha%20Gupta&backgroundColor=7c3aed&textColor=ffffff",
      publicId: "seed/avatar-sneha-gupta",
    },
  },
  {
    name: "Admin NSUT",
    email: "admin@nsut.ac.in",
    phone: "+919811223388",
    collegeDomain: "nsut.ac.in",
    bio: "CollegeBazaar admin account for moderation/testing.",
    role: "admin",
    profilePicture: {
      url: "https://api.dicebear.com/9.x/initials/svg?seed=Admin%20NSUT&backgroundColor=334155&textColor=ffffff",
      publicId: "seed/avatar-admin-nsut",
    },
  },
];

const listingTemplates = [
  {
    title: "Engineering Mathematics-II Notes (Neat + Complete)",
    description:
      "Handwritten and printed notes for Engineering Maths-II. Includes solved PYQs and unit-wise summaries. Good condition.",
    category: "Books & Notes",
    price: 350,
    isTradeable: true,
    tradePreferences: "Open to exchange with Signals & Systems notes.",
    courseTags: ["CSE", "IT", "ECE"],
    status: "active",
  },
  {
    title: "Casio FX-991ES Plus Scientific Calculator",
    description:
      "Original calculator, lightly used for first-year labs and exams. Fully working, battery recently replaced.",
    category: "Lab Equipment",
    price: 700,
    isTradeable: true,
    tradePreferences: "Can trade for DMM or breadboard kit.",
    courseTags: ["ECE", "EEE", "ME"],
    status: "active",
  },
  {
    title: "Dell 22-inch Monitor (1080p, HDMI)",
    description:
      "Great for coding setup in hostel. No dead pixels, includes power cable and HDMI cable.",
    category: "Electronics",
    price: 3800,
    isTradeable: false,
    tradePreferences: "",
    courseTags: ["CSE", "IT"],
    status: "active",
  },
  {
    title: "Football Shoes Size 9 (Nivia)",
    description:
      "Used for one semester only. Good grip and studs. Selling due to size mismatch.",
    category: "Sports",
    price: 900,
    isTradeable: true,
    tradePreferences: "Trade possible with badminton racket.",
    courseTags: ["ME", "CE"],
    status: "active",
  },
  {
    title: "Hostel Study Chair (Ergonomic)",
    description:
      "Comfortable chair with lumbar support. Minor scratches but strong build. Pickup from girls hostel gate.",
    category: "Furniture",
    price: 1800,
    isTradeable: false,
    tradePreferences: "",
    courseTags: ["CSE", "ECE", "BT"],
    status: "active",
  },
  {
    title: "1st Year Complete Stationery Kit",
    description:
      "A4 sheets, lab files, pen set, geometry box, and sticky notes. Useful starter bundle for freshers.",
    category: "Stationery",
    price: 450,
    isTradeable: false,
    tradePreferences: "",
    courseTags: ["ICE", "ENV", "CE"],
    status: "active",
  },
  {
    title: "Data Structures Made Easy + OOP Textbook Bundle",
    description:
      "Two core CS books in solid condition. Includes highlighted key sections and bookmarks.",
    category: "Textbooks",
    price: 600,
    isTradeable: true,
    tradePreferences: "Can exchange with DBMS or OS textbook.",
    courseTags: ["CSE", "IT"],
    status: "sold",
  },
  {
    title: "Hoodie (NSUT Merch, Size M)",
    description:
      "Official college merch hoodie, worn twice. Clean and no tears. Great for winter semester.",
    category: "Clothing",
    price: 550,
    isTradeable: true,
    tradePreferences: "Trade with size L possible.",
    courseTags: ["BT", "ECE"],
    status: "traded",
  },
];

const categorySeedMap = {
  "Books & Notes": "books-notes",
  Textbooks: "textbooks",
  Electronics: "electronics",
  Clothing: "clothing",
  Sports: "sports",
  Furniture: "furniture",
  Stationery: "stationery",
  "Lab Equipment": "lab-equipment",
  Other: "other",
};

function makeImage(title, category, idx) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const categorySeed = categorySeedMap[category] || "listing";
  return {
    url: `https://picsum.photos/seed/nsut-${categorySeed}-${slug}-${idx}/1200/900`,
    publicId: `seed/nsut-${slug}-${idx}`,
  };
}

async function run() {
  const shouldReset = process.argv.includes("--reset");

  await connectDB();

  try {
    if (shouldReset) {
      const seedEmails = seedUsers.map((u) => u.email);
      const existingUsers = await User.find({ email: { $in: seedEmails } }).select(
        "_id email"
      );
      const seedUserIds = existingUsers.map((u) => u._id);

      if (seedUserIds.length) {
        await Listing.deleteMany({ seller: { $in: seedUserIds } });
      }
      await User.deleteMany({ email: { $in: seedEmails } });
      console.log("Reset existing seeded NSUT users/listings.");
    }

    const createdUsers = [];
    for (const entry of seedUsers) {
      const existing = await User.findOne({ email: entry.email });
      if (existing) {
        existing.name = entry.name;
        existing.phone = entry.phone;
        existing.bio = entry.bio;
        existing.collegeDomain = entry.collegeDomain;
        existing.profilePicture = entry.profilePicture;
        existing.role = entry.role || "user";
        await existing.save();
        createdUsers.push(existing);
        continue;
      }
      const user = await User.create({
        ...entry,
        role: entry.role || "user",
        password: DEFAULT_PASSWORD,
      });
      createdUsers.push(user);
    }

    const listingsToCreate = listingTemplates.map((template, idx) => {
      const seller = createdUsers[idx % (createdUsers.length - 1)]; // reserve admin mostly for moderation
      return {
        ...template,
        seller: seller._id,
        collegeDomain: seller.collegeDomain,
        images: [
          makeImage(template.title, template.category, 1),
          makeImage(template.title, template.category, 2),
        ],
      };
    });

    const createdListings = await Listing.insertMany(listingsToCreate, {
      ordered: true,
    });

    const bySeller = new Map();
    for (const listing of createdListings) {
      const key = String(listing.seller);
      bySeller.set(key, [...(bySeller.get(key) || []), listing._id]);
    }

    for (const user of createdUsers) {
      const ids = bySeller.get(String(user._id)) || [];
      if (!ids.length) continue;
      await User.updateOne(
        { _id: user._id },
        { $addToSet: { listings: { $each: ids } } }
      );
    }

    console.log("Seed complete.");
    console.log(`Users available: ${createdUsers.length}`);
    console.log(`Listings created: ${createdListings.length}`);
    console.log("Login password for seeded users: Password123");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();

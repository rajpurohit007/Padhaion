const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Institution = require("../models/Institution");
const Inquiry = require("../models/Inquiry");
const Review = require("../models/Review");
const User = require("../models/User"); 
const Notification = require("../models/Notification"); // 🚀 ADDED: Import Notification

// Get all institutions (Permissive filter)
router.get("/", async (req, res) => {
  try {
    const { search, category, city, sortBy } = req.query;
    const query = { isActive: true, isVerified: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }

    if (category && category !== "All") {
      const categoryList = category.split(",");
      query.category = { $in: categoryList };
    }

    if (city && city !== "All") {
      const cityList = city.split(",");
      query.city = { $in: cityList };
    }

    const sort = {};
    if (sortBy === "rating") sort.rating = -1;
    else if (sortBy === "students") sort.totalStudents = -1;
    else if (sortBy === "name") sort.name = 1;
    else sort.rating = -1;

    const institutions = await Institution.find(query).sort(sort);
    res.json({ success: true, count: institutions.length, data: institutions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching institutions", error: error.message });
  }
});

// Get single institution
router.get("/:id", async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id);
    if (!institution) return res.status(404).json({ success: false, message: "Institution not found" });
    res.json({ success: true, data: institution });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching institution", error: error.message });
  }
});

// Create institution
router.post("/", async (req, res) => {
  try {
    const institution = new Institution(req.body);
    await institution.save();
    res.status(201).json({ success: true, message: "Institution created", data: institution });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error creating institution", error: error.message });
  }
});

// --- INQUIRY ROUTE ---
router.post("/:id/inquiry", async (req, res) => {
  try {
    const institutionId = req.params.id;
    const { userId, name, email, phone, course, message } = req.body;

    const institution = await Institution.findById(institutionId);
    if (!institution) return res.status(404).json({ success: false, message: "Institution not found" });

    if (userId) {
        await Inquiry.deleteMany({ userId: userId, institutionId: institutionId });
    }

    const inquiry = new Inquiry({
      institutionId: institutionId,
      userId,
      studentName: name,
      studentEmail: email,
      studentPhone: phone,
      courseInterest: course || "General Inquiry",
      message: message || "I am interested.",
    });

    await inquiry.save();

    // 🚀 ADDED: Create Notification for Institution
    await Notification.create({
        userId: institutionId,
        type: "admin_message", 
        title: "New Inquiry Received",
        message: `You have received a new inquiry from ${name}.`,
        relatedId: inquiry._id,
        relatedModel: "Inquiry"
    });

    res.status(201).json({ success: true, message: "Inquiry saved", data: inquiry });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error sending inquiry", error: error.message });
  }
});

// --- REVIEW ROUTES ---

// 1. Get Reviews
router.get("/:id/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ institutionId: req.params.id, isApproved: true })
      .populate("userId", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching reviews", error: error.message });
  }
});

// 2. Add Review
router.post("/:id/reviews", async (req, res) => {
  try {
    const institutionId = req.params.id;
    const { userId, rating, comment, course } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    
    if (user.userType !== 'student') {
        return res.status(403).json({ success: false, message: "Only students are allowed to write reviews." });
    }

    const existingReview = await Review.findOne({ institutionId, userId });
    if (existingReview) return res.status(400).json({ success: false, message: "You have already reviewed this institution." });

    const review = new Review({ institutionId, userId, rating, comment, course });
    await review.save();

    const stats = await Review.aggregate([
        { $match: { institutionId: new mongoose.Types.ObjectId(institutionId), isApproved: true } },
        { $group: { _id: '$institutionId', avgRating: { $avg: '$rating' }, numReviews: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
        await Institution.findByIdAndUpdate(institutionId, {
            rating: stats[0].avgRating.toFixed(1),
            totalReviews: stats[0].numReviews
        });
    }

    // 🚀 ADDED: Create Notification for Institution
    await Notification.create({
        userId: institutionId,
        type: "admin_message",
        title: "New Review Received",
        message: `${user.name} has posted a new review (${rating}/5).`,
        relatedId: review._id,
        relatedModel: "Review"
    });

    res.status(201).json({ success: true, message: "Review submitted", data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error submitting review", error: error.message });
  }
});

module.exports = router;
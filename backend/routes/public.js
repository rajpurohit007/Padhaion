const express = require("express");
const router = express.Router();
const Institution = require("../models/Institution");
const Blog = require("../models/Blog");
const User = require("../models/User");
const Career = require("../models/Career");

// GET /api/public/ (This is the route the homepage expects to hit)
router.get("/", async (req, res) => {
    try {
        // Fetch top data points for the homepage display
        const totalInstitutions = await Institution.countDocuments({ status: 'approved' });
        const totalStudents = await User.countDocuments({ userType: 'student' });
        const latestBlogs = await Blog.find().sort({ createdAt: -1 }).limit(3).select('title excerpt');
        const totalCareers = await Career.countDocuments();

        const homeData = {
            totalInstitutions,
            totalStudents,
            latestBlogs,
            totalCareers
        };

        // 🚀 Success: Respond with the data
        res.json({ success: true, data: homeData });

    } catch (error) {
        console.error("Public Home Data Fetch Error:", error);
        // Send a 500 error if the database fetch fails
        res.status(500).json({ success: false, message: "Server failed to load public home data." });
    }
});

module.exports = router;
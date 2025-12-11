const express = require("express");
const router = express.Router();
const Career = require("../models/Career");
const { isAuthenticated, isAdmin } = require("../middleware/roleAuth");

// GET /api/careers?search=...&category=...
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    // 1. Search Logic (Case insensitive)
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // 2. Filter Logic
    if (category && category !== "All Careers") {
      query.category = category;
    }

    // 3. Optimized Fetch
    const careers = await Career.find(query)
      .select("title category description icon salaryRange") // Fetch only needed fields for grid
      .sort({ title: 1 });

    res.json({ success: true, data: careers });
  } catch (error) {
    console.error("Career Fetch Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// POST /api/careers (Admin Only - To Add Data)
router.post("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const career = new Career(req.body);
    await career.save();
    res.json({ success: true, data: career });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🚀 BULK SEED ROUTE (Run this once to populate DB with dummy data)
router.post("/seed", isAuthenticated, isAdmin, async (req, res) => {
    try {
        const dummyData = [
            { title: "Data Scientist", category: "Science & Tech", description: "Analyze complex data to help companies make decisions.", salaryRange: "6-20 LPA", icon: "database" },
            { title: "Graphic Designer", category: "Design & Arts", description: "Create visual concepts using computer software.", salaryRange: "3-8 LPA", icon: "pen-tool" },
            { title: "Investment Banker", category: "Commerce & Finance", description: "Help companies raise capital and manage investments.", salaryRange: "10-30 LPA", icon: "dollar-sign" },
            { title: "Doctor (MBBS)", category: "Medical", description: "Diagnose and treat illnesses.", salaryRange: "8-25 LPA", icon: "activity" },
            { title: "Lawyer", category: "Legal", description: "Advise and represent clients in legal matters.", salaryRange: "5-15 LPA", icon: "scale" }
        ];
        await Career.insertMany(dummyData);
        res.json({ success: true, message: "Database Seeded!" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
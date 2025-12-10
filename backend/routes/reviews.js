// const express = require("express");
// const router = express.Router();
// const mongoose = require("mongoose"); 
// const Review = require("../models/Review");
// const Institution = require("../models/Institution");
// const { isAuthenticated } = require("../middleware/roleAuth"); // Ensure this path matches your middleware location

// // DELETE /api/reviews/:id
// router.delete("/:id", isAuthenticated, async (req, res) => {
//   try {
//     const review = await Review.findById(req.params.id);
    
//     if (!review) {
//       return res.status(404).json({ success: false, message: "Review not found" });
//     }

//     // Check if the logged-in user is the owner of the review
//     // We convert ObjectIds to strings for safe comparison
//     if (review.userId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ success: false, message: "Not authorized to delete this review" });
//     }

//     await Review.findByIdAndDelete(req.params.id);
//     res.json({ success: true, message: "Review deleted successfully" });
//   } catch (error) {
//     console.error("Delete Review Error:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose"); 
const Review = require("../models/Review");
const Institution = require("../models/Institution"); 
const { isAuthenticated } = require("../middleware/roleAuth");

// DELETE /api/reviews/:id
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    // 1. Find the review to identify the Institution
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // 2. Check permission
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const institutionId = review.institutionId;

    // 3. Delete the review
    await Review.findByIdAndDelete(req.params.id);

    // 4. 🚀 RE-CALCULATE STATS (This fixes the Card issue)
    const stats = await Review.aggregate([
        { $match: { institutionId: new mongoose.Types.ObjectId(institutionId), isApproved: true } },
        { $group: { _id: '$institutionId', avgRating: { $avg: '$rating' }, numReviews: { $sum: 1 } } }
    ]);

    let newRating = 0;
    let newTotalReviews = 0;

    if (stats.length > 0) {
        newRating = stats[0].avgRating.toFixed(1);
        newTotalReviews = stats[0].numReviews;
    }

    // 5. Update the Institution Card's data source
    await Institution.findByIdAndUpdate(institutionId, {
        rating: newRating,
        totalReviews: newTotalReviews
    });

    res.json({ success: true, message: "Deleted and stats updated" });

  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
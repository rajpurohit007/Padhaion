const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: String,
      default: "",
    },
    // Reply from Institution
    reply: {
      type: String,
      default: "",
    },
    // Likes (Array of IDs who liked the review)
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
    }],
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Review", reviewSchema);
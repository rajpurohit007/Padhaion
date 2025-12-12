const mongoose = require("mongoose");

const institutionRequestSchema = new mongoose.Schema(
  {
    institutionName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    established: {
      type: Number,
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    // Images
    thumbnailUrl: {
      type: String,
      default: "",
    },
    galleryUrls: {
      type: [String],
      default: [],
    },
    // Fee Structure Object
    feeStructure: {
      selectedPlanId: String,
      initialFee: Number,
      recurringFee: Number,
      frequency: String,
    },
    // Request Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("InstitutionRequest", institutionRequestSchema);
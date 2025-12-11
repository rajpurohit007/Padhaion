const mongoose = require("mongoose");

const careerSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true,
    index: true 
  },
  category: { 
    type: String, 
    required: true,
    index: true // Optimized for filtering
  },
  description: { 
    type: String, 
    required: true 
  },
  icon: { 
    type: String, 
    default: "briefcase" 
  },
  salaryRange: { type: String, default: "3 - 10 LPA" },
  educationPath: { type: String, default: "12th > B.Tech > M.Tech" },
  futureOutlook: { type: String, default: "High Growth" }
}, { timestamps: true });

module.exports = mongoose.model("Career", careerSchema);
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const Career = require("./models/Career"); 

// Load .env file
dotenv.config(); 

// 🚀 FIX: Use the exact variable name from your .env file
const db = process.env.MONGODB_URI;

if (!db) {
    console.error("❌ FATAL ERROR: MONGODB_URI is not defined in .env");
    console.error("Please ensure your .env file is in the backend folder and has MONGODB_URI set.");
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(db)
  .then(() => console.log("✅ MongoDB Connected for Seeding"))
  .catch(err => {
      console.error("❌ DB Connection Error:", err);
      process.exit(1);
  });

const importData = async () => {
  try {
    const dataPath = path.join(__dirname, "data", "careers.json");
    
    if (!fs.existsSync(dataPath)) {
        console.error(`❌ Error: Data file not found at ${dataPath}`);
        process.exit(1);
    }

    const data = fs.readFileSync(dataPath, "utf-8");
    const careers = JSON.parse(data);

    // Clear old data
    await Career.deleteMany();
    console.log("🗑️  Old career data cleared...");

    // Insert new data
    await Career.insertMany(careers);
    console.log("✅ Career Data Imported Successfully!");

    process.exit();
  } catch (error) {
    console.error("❌ Error with data import:", error);
    process.exit(1);
  }
};

importData();
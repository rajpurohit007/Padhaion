const User = require("../models/User");

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: "padhaion@gmail.com" });
    if (!adminExists) {
      const admin = new User({
        name: "Admin",
        email: "padhaion@gmail.com",
        password: "PadhaiOn@#@Vimal1",
        userType: "admin",
        isActive: true,
        isVerified: true,
      });
      await admin.save();
      console.log("✅ Admin created:");
    } else {
      console.log("ℹ️ Admin already exists");
    }
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
  }
};

module.exports = seedAdmin;
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Institution = require("../models/Institution");
const InstitutionRequest = require("../models/InstitutionRequest");
const Review = require("../models/Review");
const Inquiry = require("../models/Inquiry");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const { isAuthenticated, isStudent } = require("../middleware/roleAuth");

// --- 1. MULTER CONFIGURATION ---
const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

const uploadFields = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "galleryImages", maxCount: 5 },
]);

// ==========================================
// AUTHENTICATION ROUTES (Register/Login)
// ==========================================

// --- REGISTER ---
router.post("/register", uploadFields, async (req, res) => {
  try {
    const { 
      name, email, phone, password, userType, 
      category, location, city, established, specialization, description, totalStudents, feeStructure 
    } = req.body;

    if (userType === "institution") {
        let existingInst = await Institution.findOne({ email });
        if (existingInst) return res.status(400).json({ success: false, message: "Institution already registered." });

        let existingReq = await InstitutionRequest.findOne({ email });
        if (existingReq) return res.status(400).json({ success: false, message: "Application already pending approval." });

        let thumbnailUrl = "/placeholder.svg";
        let galleryUrls = [];
        if (req.files?.thumbnail) thumbnailUrl = `/public/uploads/${req.files.thumbnail[0].filename}`;
        if (req.files?.galleryImages) galleryUrls = req.files.galleryImages.map(f => `/public/uploads/${f.filename}`);

        let parsedFee = null;
        try { parsedFee = JSON.parse(feeStructure); } catch (e) {}


        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newRequest = new InstitutionRequest({
            institutionName: name,
            email, phone, category, location, city, established, specialization, description, totalStudents,
            thumbnailUrl, galleryUrls, feeStructure: parsedFee,
            status: 'pending',
            password: hashedPassword
        });

        await newRequest.save();
        return res.status(201).json({ success: true, message: "Application submitted! Wait for admin approval." });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ success: false, message: "Student already exists." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name, email, phone,
      password: hashedPassword,
      userType: "student",
    });

    await newUser.save();

    const payload = { user: { id: newUser.id, userType: "student", name: newUser.name } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
        if (err) throw err;
        res.status(201).json({ success: true, token, message: "Student registered successfully!" });
    });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
});

// --- LOGIN ---
// router.post("/admin/login", async (req, res) => {
//     const { email, password } = req.body;
//     try {
//         const user = await User.findOne({ email });

//         if (!user || !(await bcrypt.compare(password, user.password))) {
//             return res.status(401).json({ message: "Invalid Credentials" });
//         }

//         // 🚀 CRITICAL CHECK: Must be 'admin' to use this route
//         if (user.userType !== 'admin') { 
//     return res.status(403).json({ message: "Access Denied: Dedicated to Administrators only." });
// }

//         // Login successful
//         const token = generateToken(user._id);
//         res.json({ token, user: { id: user._id, name: user.name, email: user.email, userType: user.userType, isFirstLogin: user.isFirstLogin || false } });

//     } catch (error) {
//         res.status(500).json({ message: "Server error during admin login" });
//     }
// });

// --- 🚀 GENERIC LOGIN (Student/Institution only) ---
router.post("/login", async (req, res) => {
  const { email, password, userType } = req.body; 

  try {
    let account = null;

    // 1. CRITICAL SECURITY CHECK: Check the User model first, regardless of userType given by frontend
    const userAccount = await User.findOne({ email });

    if (userAccount) {
        // 🚀 FIX: If any account is found in the User model AND it's an Admin, block it here.
        if (userAccount.userType === 'admin') { 
        return res.status(403).json({ success: false, message: "Administrator must use the dedicated admin login portal." });
    }
        // If it's a regular Student logging in, use this account.
          account = userAccount;
    } 
    
    // 2. If no student/admin user was found, check for Institution account
    if (!account && userType === 'institution') {
        account = await Institution.findOne({ email });
    }

    // 3. Handle 'Not Found' and 'Pending' Institutions
    if (!account) {
        if (userType === 'institution') {
             const pending = await InstitutionRequest.findOne({ email });
             if(pending) return res.status(400).json({ success: false, message: "Your application is still pending approval." });
        }
        return res.status(400).json({ success: false, message: "Invalid Credentials" });
    }

   // 4. Password Check and Rehash Logic (Your existing logic)
    let isMatch = false;
    let needsRehash = false; 

    if (account.password && account.password.startsWith("$2")) {
        isMatch = await bcrypt.compare(password, account.password);
    } else {
        if (account.password === password) {
            isMatch = true;
            needsRehash = true; 
        }
    }

    if (!isMatch) {
        return res.status(400).json({ success: false, message: "Invalid Credentials" });
    }

    // SELF-HEALING: Rehash old plain text passwords
    if (needsRehash) {
        const salt = await bcrypt.genSalt(10);
        account.password = await bcrypt.hash(password, salt);
        await account.save();
    }

    // 5. Generate Token & Response
    const payload = { 
        user: { 
            id: account._id, 
            userType: account.userType, 
            name: account.name 
        } 
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
        if (err) throw err;
        
        const responseData = { 
            id: account._id, 
            name: account.name, 
            email: account.email, 
            userType: account.userType, 
            phone: account.contact ? account.contact.phone : account.phone,
        };

        if (userType === 'institution') {
            responseData.isFirstLogin = account.isFirstLogin;
        }

        res.json({ 
            success: true, 
            token, 
            data: responseData
        });
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).send("Server Error");
  }
});
// --- FORGOT PASSWORD ---
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, userType } = req.body;
    let account = null;

    if (userType === 'institution') account = await Institution.findOne({ email });
    else account = await User.findOne({ email });

    if (!account) return res.status(404).json({ success: false, message: "Email not found." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    account.resetOtp = otp;
    account.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    await account.save();

    const mailOptions = {
      from: '"PadhaiOn Support" <no-reply@padhaion.com>',
      to: email,
      subject: 'Password Reset OTP - PadhaiOn',
      text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Mail Error:", error);
        return res.status(500).json({ success: false, message: "Failed to send email." });
      }
      res.json({ success: true, message: "OTP sent to your email." });
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
});

// --- RESET PASSWORD ---
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword, userType } = req.body;
    let account = null;

    // 1. Find Account
    if (userType === 'institution') account = await Institution.findOne({ email });
    else account = await User.findOne({ email });

    if (!account) return res.status(404).json({ success: false, message: "User not found." });


    // 2. Validate OTP
    // Ensure both are strings and trimmed to avoid whitespace mismatch
    if (String(account.resetOtp).trim() !== String(otp).trim() || account.resetOtpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    // 3. 🚀 FIX: Manually Hash Password for EVERYONE (Student AND Institution)
    const salt = await bcrypt.genSalt(10);
    account.password = await bcrypt.hash(newPassword, salt);

    // 4. Clear OTP fields
    account.resetOtp = undefined;
    account.resetOtpExpires = undefined;
    
    await account.save();

    res.json({ success: true, message: "Password reset successfully. Please login." }); 

    if (userType === 'student') {
        const salt = await bcrypt.genSalt(10);
        account.password = await bcrypt.hash(newPassword, salt);
    } else {
        account.password = newPassword; 
    }

    account.resetOtp = undefined;
    account.resetOtpExpires = undefined;
    await account.save();

    res.json({ success: true, message: "Password reset successfully. Please login." });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }

  
});

// ==========================================
// STUDENT DASHBOARD ROUTES
// ==========================================

// 1. Submit Review
router.post("/reviews", isAuthenticated, isStudent, async (req, res) => {
  try {
    const { institutionId, rating, comment, course } = req.body;
    
    const existingReview = await Review.findOne({ userId: req.user.id, institutionId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: "You have already reviewed this institution" });
    }

    const review = new Review({
      userId: req.user.id,
      institutionId,
      rating,
      comment,
      course: course || "",
    });
    await review.save();

    const allReviews = await Review.find({ institutionId, isApproved: true });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = allReviews.length > 0 ? (totalRating / allReviews.length).toFixed(1) : 0;

    await Institution.findByIdAndUpdate(institutionId, {
      rating: avgRating,
      totalReviews: allReviews.length,
    });

    // 🚀 ADDED: Notify Institution about new review
    const user = await User.findById(req.user.id);
    await Notification.create({
        userId: institutionId,
        type: "admin_message",
        title: "New Review Received",
        message: `${user.name} has posted a new review (${rating}/5).`,
        relatedId: review._id,
        relatedModel: "Review"
    });

    res.status(201).json({ success: true, message: "Review submitted successfully", data: review });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error submitting review", error: error.message });
  }
});

// 2. Get Student's Reviews
router.get("/reviews", isAuthenticated, isStudent, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.id })
      .populate("institutionId", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching reviews", error: error.message });
  }
});

// 3. Submit Inquiry
router.post("/inquiries", isAuthenticated, isStudent, async (req, res) => {
  try {
    const { institutionId, subject, message } = req.body;
    
    const inst = await Institution.findById(institutionId);
    if(!inst) return res.status(404).json({success: false, message: "Institution not found"});

    const user = await User.findById(req.user.id);

    await Inquiry.deleteMany({ userId: req.user.id, institutionId: institutionId });

    const inquiry = new Inquiry({
      userId: req.user.id,
      institutionId,
      studentName: user.name,
      studentEmail: user.email,
      studentPhone: user.phone,
      courseInterest: subject || "General",
      message,
    });
    await inquiry.save();
    
    // 🚀 ADDED: Notify Institution about new inquiry
    await Notification.create({
        userId: institutionId,
        type: "admin_message",
        title: "New Inquiry Received",
        message: `You have received a new inquiry from ${user.name}.`,
        relatedId: inquiry._id,
        relatedModel: "Inquiry"
    });

    res.status(201).json({ success: true, message: "Inquiry sent successfully", data: inquiry });
  } catch (error) {
    console.error("Inquiry Error:", error);
    res.status(400).json({ success: false, message: "Error sending inquiry", error: error.message });
  }
});

// 4. Get Student Notifications
router.get("/notifications", isAuthenticated, isStudent, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    res.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching notifications", error: error.message });
  }
});

// 5. Mark Notification Read
router.patch("/notifications/:id/read", isAuthenticated, isStudent, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating notification", error: error.message });
  }
});

// 6. Mark All Read
router.patch("/notifications/read-all", isAuthenticated, isStudent, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating notifications", error: error.message });
  }
});

module.exports = router;
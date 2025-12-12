const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Institution = require("../models/Institution");
const InstitutionRequest = require("../models/InstitutionRequest");
const Consultation = require("../models/Consultation");
const Review = require("../models/Review");
const Blog = require("../models/Blog");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const { isAuthenticated, isAdmin } = require("../middleware/roleAuth");

const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Helper for email
const safeSendCredentialsEmail = async (email, name, loginEmail, password) => {
    try {
        const { sendCredentialsEmail } = require("../services/emailService");
        await sendCredentialsEmail(email, name, loginEmail, password);
    } catch (e) { console.warn("Email service unavailable:", e.message); }
};

const safeSendConsultationEmail = async (email, name, details) => {
    try {
        const { sendConsultationEmail } = require("../services/emailService");
        await sendConsultationEmail(email, name, details);
    } catch (e) { console.warn("Email service unavailable:", e.message); }
};

// --- ROUTES ---
// ---- ADMIN LOGIN ----
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await User.findOne({ email });

        if (!admin) {
            return res.status(401).json({ success: false, message: "Invalid Email" });
        }

        if (admin.userType !== "admin") {
            return res.status(403).json({ success: false, message: "Access Denied" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid Password" });
        }

        const token = admin._id.toString(); // or JWT if you use generateToken()

        res.json({
            success: true,
            message: "Admin login successful",
            token,
            user: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                userType: admin.userType
            }
        });

    } catch (error) {
        console.error("ADMIN LOGIN ERROR:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get("/dashboard/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ userType: "student" });
        const totalInstitutions = await Institution.countDocuments();
        const pendingRequests = await InstitutionRequest.countDocuments({ status: "pending" });
        const pendingConsultations = await Consultation.countDocuments({ status: "pending" });
        const totalReviews = await Review.countDocuments();
        const recentActivities = await Notification.find().sort({ createdAt: -1 }).limit(10).populate("userId", "name email");
        res.json({ success: true, data: { totalStudents, totalInstitutions, pendingRequests, pendingConsultations, totalReviews, recentActivities } });
    } catch (error) { res.status(500).json({ success: false, message: "Error stats" }); }
});

router.get("/students", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const query = search ? { userType: "student", $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] } : { userType: "student" };
    const students = await User.find(query).select("-password").sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await User.countDocuments(query);
    res.json({ success: true, data: students, totalPages: Math.ceil(count / limit), currentPage: page, total: count });
  } catch (error) { res.status(500).json({ success: false, message: "Error fetching students" }); }
});

router.get("/institutions", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const query = search ? { $or: [{ name: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }] } : {};
    const institutions = await Institution.find(query).sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await Institution.countDocuments(query);
    res.json({ success: true, data: institutions, totalPages: Math.ceil(count / limit), currentPage: page, total: count });
  } catch (error) { res.status(500).json({ success: false, message: "Error fetching institutions" }); }
});

router.get("/institution-requests", isAuthenticated, isAdmin, async (req, res) => {
    try {
        const requests = await InstitutionRequest.find({}).sort({ createdAt: -1 });
        res.json({ success: true, data: requests });
    } catch (error) { res.status(500).json({ success: false, message: "Error requests" }); }
});

// --- APPROVE INSTITUTION REQUEST ---
router.post("/institution-requests/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const request = await InstitutionRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    if (request.status !== "pending") return res.status(400).json({ success: false, message: "Already processed" });

    // 1. Generate Password
    const plainPassword = Math.random().toString(36).slice(-8);
    
    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // 3. Create Institution Document
    const newInstitution = new Institution({
      email: request.email,
      password: hashedPassword,
      userType: 'institution',
      name: request.institutionName,
      category: request.category,
      location: request.location,
      city: request.city,
      specialization: request.specialization,
      established: request.established,
      description: request.description,
      totalStudents: request.totalStudents,
      thumbnailUrl: request.thumbnailUrl,
      galleryUrls: request.galleryUrls,
      contact: { phone: request.phone, email: request.email },
      isActive: true,
      isVerified: true
    });

    await newInstitution.save();

    // 4. Update Request Status
    request.status = "approved";
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();

    // 5. Send Email
    await safeSendCredentialsEmail(request.email, request.institutionName, request.email, plainPassword);

    res.json({
      success: true,
      message: "Approved! Credentials sent via email.",
      data: { institutionId: newInstitution._id }
    });

  } catch (error) {
    console.error("Approval Error:", error);
    res.status(500).json({ success: false, message: "Error approving request", error: error.message });
  }
});

router.post("/institution-requests/:id/reject", isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { reason } = req.body;
        const request = await InstitutionRequest.findById(req.params.id);
        if(!request) return res.status(404).json({success:false});
        request.status = "rejected";
        request.rejectionReason = reason;
        await request.save();
        res.json({ success: true, message: "Rejected" });
    } catch(e) { res.status(500).json({success:false}); }
});

router.get("/consultations", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { status = "all" } = req.query;
    const query = status === "all" ? {} : { status };
    const consultations = await Consultation.find(query).populate("userId", "name email phone").sort({ createdAt: -1 });
    res.json({ success: true, data: consultations });
  } catch (error) { res.status(500).json({ success: false, message: "Error fetching consultations" }); }
});

router.post("/consultations/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { scheduledDate, scheduledTime, mode, meetingLink, location, notes } = req.body;
    const consultation = await Consultation.findById(req.params.id).populate("userId", "name email phone");
    if (!consultation) return res.status(404).json({ success: false, message: "Not found" });

    consultation.status = "approved";
    consultation.scheduledDate = scheduledDate;
    consultation.scheduledTime = scheduledTime;
    consultation.meetingType = mode;
    consultation.meetingLink = meetingLink;
    consultation.meetingLocation = location;
    consultation.adminNotes = notes;
    consultation.approvedBy = req.user._id;
    consultation.approvedAt = new Date();
    await consultation.save();

    await safeSendConsultationEmail(consultation.userId.email, consultation.userId.name, {
      scheduledDate, scheduledTime, consultationType: consultation.consultationType,
      meetingType: mode, meetingLink, meetingLocation: location, message: notes,
    });

    res.json({ success: true, message: "Approved" });
  } catch (error) { res.status(500).json({ success: false, message: "Error" }); }
});

router.post("/consultations/:id/reject", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const consultation = await Consultation.findById(req.params.id).populate("userId", "name email phone");
    if (!consultation) return res.status(404).json({ success: false });
    consultation.status = "rejected";
    consultation.rejectionReason = reason;
    await consultation.save();
    res.json({ success: true, message: "Rejected" });
  } catch (error) { res.status(500).json({ success: false }); }
});

router.get("/reviews", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const reviews = await Review.find().populate("userId", "name email").populate("institutionId", "name").sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (error) { res.status(500).json({ success: false }); }
});

router.delete("/reviews/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (error) { res.status(500).json({ success: false }); }
});

router.post("/notifications/send", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    const notification = await Notification.create({ userId, type: type || "admin_message", title, message });
    res.json({ success: true, message: "Sent", data: notification });
  } catch (error) { res.status(500).json({ success: false }); }
});

// --- UPDATED BULK SEND ROUTE ---
router.post("/notifications/bulk-send", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userType, title, message } = req.body;
    let targets = [];

    // 1. Fetch Recipients based on userType
    if (userType === 'all') {
        const students = await User.find({ userType: 'student' }).select("_id");
        const institutions = await Institution.find({}).select("_id");
        targets = [...students, ...institutions];
    } else if (userType === 'institution') {
        targets = await Institution.find({}).select("_id");
    } else {
        targets = await User.find({ userType }).select("_id");
    }
    
    if (targets.length === 0) return res.status(404).json({ success: false, message: "No users found" });

    // 2. Create Notification Objects
    const notifications = targets.map((user) => ({ 
        userId: user._id, 
        type: "admin_broadcast", // Special type for highlighting
        title, 
        message,
        isRead: false
    }));

    // 3. Bulk Insert
    await Notification.insertMany(notifications);

    res.json({ success: true, message: `Notification sent to ${targets.length} users successfully.` });
  } catch (error) { 
      console.error("Bulk Send Error:", error);
      res.status(500).json({ success: false, message: "Failed to send notifications" }); 
  }
});

router.patch("/users/:id/toggle-status", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: "Updated", data: { isActive: user.isActive } });
  } catch (error) { res.status(500).json({ success: false }); }
});

router.delete("/users/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (error) { res.status(500).json({ success: false }); }
});

router.patch("/institutions/:id/toggle-status", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id);
    if (!institution) return res.status(404).json({ success: false });
    institution.isActive = !institution.isActive;
    await institution.save();
    res.json({ success: true, message: "Updated", data: { isActive: institution.isActive } });
  } catch (error) { res.status(500).json({ success: false }); }
});

// 🚀 CONFIRMATION: This route handles the Suspend/Activate logic
router.patch("/institutions/:id/toggle-status", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id);
    if (!institution) return res.status(404).json({ success: false });
    
    // Toggle the status
    institution.isActive = !institution.isActive;
    await institution.save();
    
    res.json({ 
        success: true, 
        message: institution.isActive ? "Institution Activated" : "Institution Suspended", 
        data: { isActive: institution.isActive } 
    });
  } catch (error) { res.status(500).json({ success: false }); }
});

router.delete("/institutions/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    await Institution.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (error) { res.status(500).json({ success: false }); }
});
router.get("/blogs", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({ success: true, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching blogs" });
  }
});

router.post("/blogs", isAuthenticated, isAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, excerpt, content, author, date, readTime, category } = req.body;
    let imageUrl = "/placeholder.svg";

    if (req.file) {
      imageUrl = `/public/uploads/${req.file.filename}`;
    }

    const newBlog = new Blog({
      title,
      excerpt,
      content,
      author,
      date,
      readTime,
      category,
      image: imageUrl,
    });

    await newBlog.save();
    res.status(201).json({ success: true, message: "Blog posted successfully!", data: newBlog });
  } catch (error) {
    console.error("Create Blog Error:", error);
    res.status(500).json({ success: false, message: "Error creating blog", error: error.message });
  }
});
router.put("/blogs/:id", isAuthenticated, isAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, excerpt, content, author, date, readTime, category } = req.body;
    const blogId = req.params.id;

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    // Update fields if provided
    if (title) blog.title = title;
    if (excerpt) blog.excerpt = excerpt;
    if (content) blog.content = content;
    if (author) blog.author = author;
    if (date) blog.date = date;
    if (readTime) blog.readTime = readTime;
    if (category) blog.category = category;

    // Update image only if a new one is uploaded
    if (req.file) {
      blog.image = `/public/uploads/${req.file.filename}`;
    }

    await blog.save();
    res.json({ success: true, message: "Blog updated successfully!", data: blog });
  } catch (error) {
    console.error("Update Blog Error:", error);
    res.status(500).json({ success: false, message: "Error updating blog", error: error.message });
  }
});
router.delete("/blogs/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting blog" });
  }
});
module.exports = router;
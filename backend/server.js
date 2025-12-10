const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path"); // CRITICAL: Added for path resolution
const seedAdmin = require("./utils/seedAdmin"); 

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🚀 CRITICAL FIX: Serve static files from the 'public' directory. 
// This must be placed before routes, and it correctly exposes files 
// saved by Multer under the /public URL prefix.
app.use('/public', express.static(path.join(__dirname, 'public')));

// 🚀 CRITICAL: Serve uploads directory for user-uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// MongoDB Connection
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("MongoDB Connected Successfully");
        // Ensure models are loaded before calling any functions that use them
        const User = require("./models/User"); 
        seedAdmin(User); // Pass the User model to seedAdmin
    })
    .catch((err) => console.error("MongoDB Connection Error:", err));

// Import Routes
const institutionRoutes = require("./routes/institutions");
const blogRoutes = require("./routes/blogs");
const courseRoutes = require("./routes/courses");
const userRoutes = require("./routes/users");
const consultationRoutes = require("./routes/consultations");
const contactRoutes = require("./routes/contact");
const testimonialRoutes = require("./routes/testimonials");
const adminRoutes = require("./routes/admin");
const institutionDashboardRoutes = require("./routes/institutionRoutes");
const studentRoutes = require("./routes/studentRoutes");
const uploadRoutes = require("./routes/upload");
const reviewRoutes = require("./routes/reviews");
// Use Routes
app.use("/api/institutions", institutionRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/institution", institutionDashboardRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/upload", uploadRoutes);

app.use("/api/reviews", reviewRoutes);
// Health Check Route
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Server is running" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: err.message,
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

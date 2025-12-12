const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path"); // CRITICAL: Added for path resolution
const seedAdmin = require("./utils/seedAdmin"); 
const publicRoutes = require("./routes/public");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
const allowedOrigins = [
    // 1. Your Live Frontend Domain (replace with your actual domain)
    "https://www.padhaion.com", 
    "https://padhaion.com", 
    
    // 2. Localhost for development/testing
    "http://localhost:5173", 
    "http://localhost:3000",
    
    // 3. Environment Variable (If CLIENT_URL is set in .env)
    process.env.CLIENT_URL // This should be "http://localhost:5173" from your .env
];

// Use CORS Middleware
app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl)
            if (!origin) return callback(null, true); 
            // Allow specific origins
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            // Block all others
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        },
        credentials: true, // Important if you use cookies or sessions later
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    })
);
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
        
        const User = require("./models/User"); 
        seedAdmin(User); // Pass the User model to seedAdmin
    })
    .catch((err) => console.error("MongoDB Connection Error:", err));

// Import Routes
const institutionRoutes = require("./routes/institutions");
const userRoutes = require("./routes/users");
const blogRoutes = require("./routes/blogs");
const courseRoutes = require("./routes/courses");
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
app.use("/api/users", userRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/institution", institutionDashboardRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/careers", require("./routes/careers"));
app.use("/api/public", publicRoutes);


app.use("/api/reviews", reviewRoutes);
// Health Check Route
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Server is running" });
});



// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("GLOBAL SERVER ERROR:", err.stack);
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Internal Server Crash (500)",
        error: err.message,
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

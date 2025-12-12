"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, Building2, Check, ArrowRight, Image, GalleryVertical, Key } from "lucide-react";
import { usersAPI } from "../services/api";
import toast from "react-hot-toast";

// Define max file size (25MB to match new backend limit)
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export default function Login({ setUser, user }) {
    const navigate = useNavigate();

    // --- STATES ---
    // view options: 'login', 'register', 'forgot-email', 'reset-password'
    const [view, setView] = useState("login");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fileError, setFileError] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        userType: "student", // Default user type
        category: "",
        location: "",
        city: "",
        established: "",
        specialization: "",
        description: "",
        totalStudents: "",
        // Reset Flow Fields
        otp: "",
        newPassword: ""
    });

    const [images, setImages] = useState({
        thumbnail: null,
        gallery: [],
    });

    // --- HANDLERS ---

    const handleImageChange = (e) => {
        const { name, files } = e.target;
        setFileError(null);

        if (!files || files.length === 0) {
            if (name === 'thumbnail') setImages(prev => ({ ...prev, thumbnail: null }));
            return;
        }

        const largeFiles = Array.from(files).filter(file => file.size > MAX_FILE_SIZE);

        if (largeFiles.length > 0) {
            const errMsg = `File too large: ${largeFiles[0].name}. Max size is 25MB.`;
            setFileError(errMsg);
            toast.error(errMsg);
            e.target.value = null;
            setImages(prev => ({ ...prev, [name === 'thumbnail' ? 'thumbnail' : 'gallery']: name === 'thumbnail' ? null : [] }));
            return;
        }

        if (name === 'thumbnail') {
            setImages(prev => ({ ...prev, thumbnail: files[0] }));
        } else if (name === 'gallery') {
            setImages(prev => ({ ...prev, gallery: Array.from(files).slice(0, 5) }));
        }
    };

    // 🚀 REDIRECTION LOGIC
    useEffect(() => {
        if (user) {
            if (user.userType === "admin") navigate("/admin-dashboard", { replace: true });
            else if (user.userType === "institution") navigate("/institution-dashboard", { replace: true });
            else if (user.userType === "student") navigate("/student-dashboard", { replace: true });
            else navigate("/", { replace: true });
        }
    }, [user, navigate]);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleUserTypeChange = (type) => {
        setFormData(prev => ({
            ...prev,
            userType: type,
        }));
        setImages({ thumbnail: null, gallery: [] });
        setFileError(null);
    };

    // --- SUBMIT HANDLERS ---

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Password match check for registration
        if (view === 'register' && formData.userType !== "institution" && formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        // Institution validation
        if (view === 'register' && formData.userType === "institution") {
            if (!images.thumbnail) {
                toast.error("Please upload a thumbnail image.");
                return;
            }
            if (fileError) {
                toast.error(`Cannot submit: ${fileError}`);
                return;
            }
        }

        try {
            setLoading(true);

            if (view === 'login') {
                // --- LOGIN LOGIC ---
                let response = await usersAPI.login({
                    email: formData.email,
                    password: formData.password,
                    userType: formData.userType,
                });

                const userData = response.data.data;
                const token = response.data.token;

                localStorage.setItem("padhaiOn_user", JSON.stringify(userData));
                localStorage.setItem("padhaiOn_token", token);

                if (userData.userType === 'admin') {
                    // Clear any stored data immediately and throw an error to fail the login process.
                    localStorage.removeItem("padhaiOn_user");
                    localStorage.removeItem("padhaiOn_token");
                    setUser(null);
                    toast.error("login is restricted for the user.");
                    return; // STOP EXECUTION
                }

                // If we reach here, the user is a Student/Institution, so proceed:
                localStorage.setItem("padhaiOn_user", JSON.stringify(userData));
                localStorage.setItem("padhaiOn_token", token);

                setUser(userData);
                toast.success(`Welcome back, ${userData.name}!`);
            
            setUser(userData);
            toast.success(`Welcome back, ${userData.name}!`);
        } else {
            // --- REGISTRATION LOGIC ---
            if (formData.userType === "institution") {
                const data = new FormData();
                Object.keys(formData).forEach(key => {
                    if (typeof formData[key] !== 'object' || key === 'totalStudents') {
                        data.append(key, formData[key]);
                    }
                });
                data.append('thumbnail', images.thumbnail);
                images.gallery.forEach(file => {
                    data.append('galleryImages', file);
                });

                const response = await usersAPI.register(data);
                toast.success(response.data.message);
                setView("login");

            } else {
                const registrationData = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    userType: formData.userType,
                    password: formData.password,
                };

                await usersAPI.register(registrationData);
                toast.success("Registration successful! Please login.");
                setView("login");
            }
        }
    } catch (error) {
        console.error("Authentication error:", error);
        const isSuspended = error.response && error.response.status === 403 && error.response.data.isSuspended;

        if (!isSuspended) {
            toast.error(error.response?.data?.message || "Invalid Email or Password");
        }
    } finally {
        setLoading(false);
    }
};

// --- FORGOT PASSWORD HANDLERS ---

const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await usersAPI.forgotPassword({ email: formData.email, userType: formData.userType });
        toast.success("OTP sent to your email!");
        setView("reset-password"); // Correctly switch view
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally { setLoading(false); }
};

const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
        return toast.error("Passwords do not match");
    }
    setLoading(true);
    try {
        await usersAPI.resetPassword({
            email: formData.email,
            userType: formData.userType,
            otp: formData.otp,
            newPassword: formData.newPassword
        });
        toast.success("Password reset successful! Please login.");
        setView("login");
    } catch (error) {
        toast.error(error.response?.data?.message || "Reset failed");
    } finally { setLoading(false); }
};

// --- SUB-COMPONENTS (Defined BEFORE Return) ---

const renderForgotPassword = () => (
    <form onSubmit={handleSendOtp} className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-200">
            Enter your email address. We will send you a One-Time Password (OTP).
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter your email" />
            </div>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
            {loading ? "Sending..." : "Send OTP"}
        </button>
        <button type="button" onClick={() => setView("login")} className="w-full text-gray-600 text-sm mt-2 hover:text-gray-800 underline">
            Back to Login
        </button>
    </form>
);

const renderResetPassword = () => (
    <form onSubmit={handleResetPassword} className="space-y-6">
        <div className="bg-green-50 p-4 rounded-lg text-sm text-green-800 border border-green-200">
            OTP sent! Please enter the code from your email.
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
            <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input type="text" name="otp" required value={formData.otp} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="6-digit OTP" />
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input type="password" name="newPassword" required value={formData.newPassword} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="New Password" />
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Confirm New Password" />
            </div>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors">
            {loading ? "Resetting..." : "Reset Password"}
        </button>
    </form>
);

const renderRegistrationForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
        {/* ... Registration Fields ... */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg" placeholder={formData.userType === 'institution' ? "Institution Name" : "Enter your full name"} />
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter your email" />
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter your phone number" />
            </div>
        </div>

        {formData.userType === "institution" && (
            <>
                <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800">Institution Media</h4>
                    {fileError && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">{fileError}</div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail Image *</label>
                            <input type="file" name="thumbnail" required onChange={handleImageChange} accept="image/*" className="w-full text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images (Max 5)</label>
                            <input type="file" name="gallery" multiple onChange={handleImageChange} accept="image/*" className="w-full text-sm" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm">Total Students</label><input type="number" name="totalStudents" required value={formData.totalStudents} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg" /></div>
                    <div>
                        <label className="block text-sm">Category</label>
                        <select name="category" required value={formData.category} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg">
                            <option value="">Select</option><option value="School">School</option><option value="College">College</option><option value="Coaching Center">Coaching Center</option><option value="University">University</option><option value="Vocational Institute">Vocational Institute</option>
                        </select>
                    </div>
                </div>
                <input type="text" name="location" placeholder="Location (Area)" required value={formData.location} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg mb-4" />
                <input type="text" name="city" placeholder="City" required value={formData.city} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg mb-4" />
                <input type="number" name="established" placeholder="Est. Year" required value={formData.established} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg mb-4" />
                <input type="text" name="specialization" placeholder="Specialization" required value={formData.specialization} onChange={handleInputChange} className="w-full px-4 py-3 border rounded-lg mb-4" />
                <textarea name="description" placeholder="Description" required value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 border rounded-lg mb-4" />
            </>
        )}

        {/* Password Fields */}
        {(view === 'login' || (view === 'register' && formData.userType === "student")) && (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            autoComplete="new-password"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your password"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
                {view === 'register' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 border rounded-lg" placeholder="Confirm password" />
                        </div>
                    </div>
                )}
            </>
        )}
        <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
        >
            {loading ? "Processing..." : (view === 'login' ? "Sign In" : "Submit Request")}
        </button>
    </form>
);

return (
    <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-lg p-8">

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {view === 'login' ? "Welcome Back" : view === 'register' ? "Join PadhaiOn" : view === 'forgot-email' ? "Forgot Password" : "Reset Password"}
                    </h2>
                    <p className="text-gray-600">
                        {view === 'login' ? "Sign in to your account" : view === 'register' ? "Create an account" : "Secure your account"}
                    </p>
                </div>

                {/* Type Toggles - Hide during Forgot Password Flow */}
                {view !== 'forgot-email' && view !== 'reset-password' && (
                    <div className="flex justify-center mb-8">
                        <button
                            type="button"
                            onClick={() => handleUserTypeChange("student")}
                            className={`px-6 py-3 font-semibold rounded-l-lg transition-colors ${formData.userType === 'student' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            I am a Student
                        </button>
                        <button
                            type="button"
                            onClick={() => handleUserTypeChange("institution")}
                            className={`px-6 py-3 font-semibold rounded-r-lg transition-colors ${formData.userType === 'institution' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            I am an Educational Institution
                        </button>
                    </div>
                )}

                {/* VIEW SWITCHING */}
                {view === 'forgot-email' && renderForgotPassword()}
                {view === 'reset-password' && renderResetPassword()}

                {view === 'login' && (
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="email"
                                    name="email"
                                    autoComplete="username"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    autoComplete="current-password"
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <button type="button" onClick={() => setView('forgot-email')} className="text-sm text-blue-600 hover:underline">
                                Forgot Password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                        >
                            {loading ? "Processing..." : "Sign In"}
                        </button>
                        <p className="text-center mt-4 text-gray-600">
                            No account?{" "}
                            <button
                                type="button"
                                onClick={() => {
                                    setView('register');
                                    setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
                                }}
                                className="text-blue-600 font-bold hover:underline"
                            >
                                Register
                            </button>
                        </p>
                    </form>
                )}

                {view === 'register' && (
                    <div>
                        {renderRegistrationForm()}
                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                Already have an account?
                                <button
                                    onClick={() => {
                                        setView('login');
                                    }}
                                    className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Sign in
                                </button>
                            </p>
                            {formData.userType === "institution" && (
                                <p className="mt-2 text-sm text-gray-500">
                                    After submitting the form, an admin will review your request.
                                </p>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    </div>
);
}
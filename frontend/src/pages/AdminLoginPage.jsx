import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react"; 
// 🚀 Use the general usersAPI as the admin login path is exposed there
import {  adminAPI } from "../services/api"; 
import toast from "react-hot-toast";

export default function AdminLoginPage({ setUser }) {
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // 🚀 CALL THE DEDICATED ADMIN BACKEND ROUTE
      let response = await adminAPI.login({ 
        email: formData.email, 
        password: formData.password 
      });
      
      const userData = response.data.data;
      const token = response.data.token;

      // 🚀 VERIFY USER TYPE ON FRONTEND (Extra Safety)
      if (userData.userType !== 'admin') {
          throw new Error("Invalid access type.");
      }

      localStorage.setItem("padhaiOn_user", JSON.stringify(userData));
      localStorage.setItem("padhaiOn_token", token);

      setUser(userData); 
      toast.success(`Welcome, Admin ${userData.name}!`);
      // 🚀 REDIRECT TO ADMIN DASHBOARD
      navigate("/admin-dashboard", { replace: true });
      
    } catch (error) {
      console.error("Admin Authentication error:", error);
      // Display specific error message for 403 (Access Denied)
      const message = error.response?.data?.message || "Invalid Credentials or Access Denied.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-blue-700 mb-2">Admin Portal</h2>
          <p className="text-gray-600">Secure sign-in for platform administrators.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
             <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@padhaion.com"
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
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
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
           <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center"
           >
             {loading ? "Verifying Access..." : <><span className="mr-2">Admin Sign In</span> <ArrowRight className="h-4 w-4" /></>}
           </button>
        </form>

      </div>
    </div>
  );
}
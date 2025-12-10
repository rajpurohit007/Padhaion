import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Users, 
  Star, 
  AlertCircle, 
  CheckCircle, 
  Mail, 
  Phone, 
  User as UserIcon, 
  MessageSquare, 
  ThumbsUp, 
  Reply,
  Lock,
  Image,
  Trash2,
  Upload,
  Bell,      // Required for Notifications
  Megaphone  // Required for Highlighting
} from 'lucide-react';
import { institutionAPI, getImageUrl } from "../services/api"; 
import toast from "react-hot-toast";

// --- HELPER: Calculate Relative Time ---
const getRelativeTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  
  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = d2 - d1;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  
  return ""; 
};

// --- HELPER: Safe Image URL ---
const getSafeImageUrl = (url) => {
    if (!url) return null;
    return getImageUrl(url);
};

export default function InstitutionDashboard({ user }) {
  const navigate = useNavigate();
  
  // --- UI STATES ---
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  
  // --- DATA STATES ---
  const [institutionData, setInstitutionData] = useState(null);
  const [initialProfileState, setInitialProfileState] = useState(null); 

  const [inquiries, setInquiries] = useState([]);
  const [reviews, setReviews] = useState([]);
  
  // 🚀 NOTIFICATIONS STATE
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // --- INTERACTION STATES ---
  const [replyText, setReplyText] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [newFeature, setNewFeature] = useState("");
  
  // --- PASSWORD MODAL STATE ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- FORM STATE ---
  const [profileForm, setProfileForm] = useState({
    name: "", 
    category: "", 
    location: "", 
    city: "", 
    specialization: "", 
    established: "", 
    description: "", 
    totalStudents: 0, 
    contact: { phone: "", email: "" }, 
    features: [],
    thumbnailUrl: "", 
    galleryUrls: [] 
  });

  // --- FILE UPLOAD STATE ---
  const [newThumbnail, setNewThumbnail] = useState(null);
  const [newGalleryImages, setNewGalleryImages] = useState([]);

  // --- DATA FETCHING ---

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await institutionAPI.getProfile();
      
      if (res.data.data) {
        setInstitutionData(res.data.data);
        
        const formData = {
          ...res.data.data,
          established: res.data.data.established?.toString() || "",
          contact: res.data.data.contact || { phone: "", email: "" },
          features: res.data.data.features || [],
          thumbnailUrl: res.data.data.thumbnailUrl || "",
          galleryUrls: res.data.data.galleryUrls || []
        };
        
        setProfileForm(formData);
        setInitialProfileState(JSON.parse(JSON.stringify(formData))); 
        
        setNewThumbnail(null);
        setNewGalleryImages([]);

        if (res.data.data.isFirstLogin) {
            setShowPasswordModal(true);
        } else if (!res.data.data.profileCompleted) {
          setShowProfileAlert(true);
          if(activeTab === 'overview') setActiveTab("profile");
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      const res = await institutionAPI.getInquiries();
      setInquiries(res.data.data || []);
    } catch (error) { console.error("Inquiries error:", error); }
  };

  const fetchReviews = async () => {
    try {
      const res = await institutionAPI.getReviews();
      setReviews(res.data.data || []);
    } catch (error) { console.error("Reviews error:", error); }
  };

  // 🚀 FETCH NOTIFICATIONS (Ensures UI updates)
  const fetchNotifications = async () => {
      try {
          const res = await institutionAPI.getNotifications();
          setNotifications(res.data.data || []);
          setUnreadCount(res.data.unreadCount || 0);
      } catch (error) { console.error("Notification error:", error); }
  };

  // --- EFFECTS ---

  useEffect(() => {
    if (!user || user.userType !== "institution") {
      navigate("/login");
      return;
    }
    fetchDashboardData();
    fetchInquiries();
    fetchReviews();
    fetchNotifications(); // 🚀 Initial load call
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === "inquiries") fetchInquiries();
    if (activeTab === "reviews") fetchReviews();
    if (activeTab === "notifications") fetchNotifications(); // 🚀 Refresh when tab clicked
  }, [activeTab]);


  // --- HANDLERS ---
  
  const handleMarkAsRead = async (id) => {
      try {
          await institutionAPI.markNotificationRead(id);
          fetchNotifications();
      } catch (error) { console.error("Mark read error:", error); }
  };

  const handleMarkAllAsRead = async () => {
      try { await institutionAPI.markAllNotificationsRead(); fetchNotifications(); } catch (error) { console.error("Mark all error:", error); }
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" || name === "email") {
      setProfileForm((prev) => ({ ...prev, contact: { ...prev.contact, [name]: value } }));
    } else {
      setProfileForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setProfileForm((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index) => {
    setProfileForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // --- IMAGE HANDLERS ---

  const handleThumbnailChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewThumbnail(e.target.files[0]);
    }
  };

  const handleGalleryChange = (e) => {
    if (e.target.files) {
      const currentCount = profileForm.galleryUrls.length + newGalleryImages.length;
      const maxLimit = 5;
      const remainingSlots = maxLimit - currentCount;

      if (remainingSlots <= 0) {
          toast.error("Maximum limit of 5 gallery images reached.");
          e.target.value = null; 
          return;
      }

      const files = Array.from(e.target.files);
      
      if (files.length > remainingSlots) {
          toast.error(`You can only add ${remainingSlots} more image(s).`);
          e.target.value = null; 
          return;
      }

      setNewGalleryImages([...newGalleryImages, ...files]);
    }
  };

  const removeExistingGalleryImage = (indexToRemove) => {
    setProfileForm(prev => ({
        ...prev,
        galleryUrls: prev.galleryUrls.filter((_, i) => i !== indexToRemove)
    }));
  };

  const removeNewGalleryImage = (indexToRemove) => {
    setNewGalleryImages(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", profileForm.name);
      formData.append("category", profileForm.category);
      formData.append("location", profileForm.location);
      formData.append("city", profileForm.city);
      formData.append("specialization", profileForm.specialization);
      formData.append("established", profileForm.established);
      formData.append("description", profileForm.description);
      formData.append("totalStudents", profileForm.totalStudents);
      formData.append("contact[phone]", profileForm.contact.phone);
      formData.append("contact[email]", profileForm.contact.email);
      profileForm.features.forEach(f => formData.append("features[]", f));
      
      if (newThumbnail) formData.append("thumbnail", newThumbnail); 
      else formData.append("retainedThumbnail", profileForm.thumbnailUrl);

      formData.append("retainedGallery", JSON.stringify(profileForm.galleryUrls));
      newGalleryImages.forEach(file => formData.append("galleryImages", file));

      await institutionAPI.saveProfile(formData); 
      toast.success("Profile updated successfully!");
      setShowProfileAlert(false);
      fetchDashboardData(); 
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (reviewId) => {
      const text = replyText[reviewId];
      if (!text) return;
      try {
          await institutionAPI.replyToReview(reviewId, text);
          toast.success("Reply posted!");
          setActiveReplyId(null);
          setReplyText(prev => ({...prev, [reviewId]: ""}));
          fetchReviews(); 
      } catch (error) { toast.error("Failed to post reply."); }
  };

  const handleLikeToggle = async (reviewId) => {
      try { await institutionAPI.likeReview(reviewId); fetchReviews(); } catch (error) { console.error("Like failed", error); }
  };

  const handlePasswordChangeSubmit = async (e) => {
      e.preventDefault();
      if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
      if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

      try {
          await institutionAPI.changePassword(newPassword);
          toast.success("Password updated successfully!");
          setShowPasswordModal(false);
      } catch (error) {
          toast.error("Failed to update password");
      }
  };

  const hasUnsavedChanges = 
    JSON.stringify(profileForm) !== JSON.stringify(initialProfileState) ||
    newThumbnail !== null ||
    newGalleryImages.length > 0;


  // --- RENDER ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
const averageRating = reviews.length > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : (institutionData?.rating || 0);
  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
                <div className="flex items-center gap-3 mb-6 text-blue-600">
                    <Lock className="w-8 h-8" />
                    <h2 className="text-2xl font-bold text-gray-900">Security Update</h2>
                </div>
                <p className="text-gray-600 mb-6">Since this is your first login, please update your password.</p>
                <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                    <input type="password" required className="w-full p-3 border rounded-lg" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" />
                    <input type="password" required className="w-full p-3 border rounded-lg" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" />
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">Update Password</button>
                </form>
            </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Institution Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {institutionData?.name || "Partner"}</p>
        </div>

        {/* ALERT */}
        {showProfileAlert && !showPasswordModal && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700"><strong>Action Required:</strong> Please complete your institution profile.</p>
              </div>
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
            <div><p className="text-gray-600 text-sm">Students</p><p className="text-2xl font-bold">{institutionData?.totalStudents}</p></div>
            <Users className="h-10 w-10 text-blue-600" />
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
            <div><p className="text-gray-600 text-sm">Active Inquiries</p><p className="text-2xl font-bold text-blue-600">{inquiries.length}</p></div>
            <Mail className="h-10 w-10 text-blue-500" />
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
            <div><p className="text-gray-600 text-sm">Rating</p>
           <div className="flex flex-col">
                    <p className="text-2xl font-bold">{averageRating}/5</p>
                    <span className="text-xs text-gray-500">({reviews.length} Reviews)</span>
                </div></div>
            <Star className="h-10 w-10 text-yellow-600" />
          </div>
          {/* NEW: Notification Stat */}
          <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
              <div><p className="text-gray-600 text-sm">Notifications</p><p className="text-2xl font-bold">{unreadCount} New</p></div>
              <Bell className="h-10 w-10 text-orange-600" />
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-scroll">
              {/* 🚀 ADDED NOTIFICATIONS TAB HERE */}
              {["overview", "profile", "reviews", "inquiries", "notifications"].map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`px-6 py-4 text-sm font-medium capitalize flex items-center whitespace-nowrap ${activeTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
                >
                  {tab}
                  {/* 🚀 NOTIFICATION COUNT BADGE */}
                  {tab === "notifications" && unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">{unreadCount}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div>
                <h2 className="text-xl font-bold mb-4">Details</h2>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Name:</strong> {institutionData?.name}</p>
                    <p><strong>Category:</strong> {institutionData?.category}</p>
                    <p><strong>Location:</strong> {institutionData?.location}, {institutionData?.city}</p>
                    <p><strong>Est:</strong> {institutionData?.established}</p>
                </div>
              </div>
            )}

            {/* PROFILE */}
            {activeTab === "profile" && (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
                        <input type="text" name="name" value={profileForm.name} onChange={handleProfileFormChange} className="w-full border p-2 rounded" placeholder="Name" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input type="text" name="location" value={profileForm.location} onChange={handleProfileFormChange} className="w-full border p-2 rounded" placeholder="Location" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input type="text" name="city" value={profileForm.city} onChange={handleProfileFormChange} className="w-full border p-2 rounded" placeholder="City" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                        <input type="number" name="established" value={profileForm.established} onChange={handleProfileFormChange} className="w-full border p-2 rounded" placeholder="Year Est." required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Students</label>
                        <input type="number" name="totalStudents" value={profileForm.totalStudents} onChange={handleProfileFormChange} className="w-full border p-2 rounded" placeholder="Students" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                        <input type="text" name="specialization" value={profileForm.specialization} onChange={handleProfileFormChange} className="w-full border p-2 rounded" placeholder="Specialization" required />
                      </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" value={profileForm.description} onChange={handleProfileFormChange} className="w-full border p-2 rounded" rows={4} placeholder="Description"></textarea>
                  </div>
                  
                  {/* --- MEDIA SECTION --- */}
                  <div className="border-t pt-4 mt-4">
                      <h3 className="text-lg font-bold mb-4 flex items-center"><Image className="w-5 h-5 mr-2" /> Media Gallery</h3>
                      
                      {/* Thumbnail */}
                      <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail Image</label>
                          <div className="flex items-center gap-4">
                              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border">
                                  {newThumbnail ? (
                                      <img src={URL.createObjectURL(newThumbnail)} alt="New" className="w-full h-full object-cover" />
                                  ) : profileForm.thumbnailUrl ? (
                                      <img src={getSafeImageUrl(profileForm.thumbnailUrl)} alt="Current" className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400"><Image /></div>
                                  )}
                              </div>
                              <div>
                                  <input type="file" accept="image/*" onChange={handleThumbnailChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                  <p className="text-xs text-gray-500 mt-1">Upload to replace current thumbnail.</p>
                              </div>
                          </div>
                      </div>

                      {/* Gallery */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                          <div className="flex flex-wrap gap-4 mb-4">
                              {profileForm.galleryUrls.map((url, index) => (
                                  <div key={`exist-${index}`} className="relative w-24 h-24 group">
                                      <img src={getSafeImageUrl(url)} alt="Gallery" className="w-full h-full object-cover rounded-lg border" />
                                      <button type="button" onClick={() => removeExistingGalleryImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Trash2 className="w-3 h-3" />
                                      </button>
                                  </div>
                              ))}
                              {newGalleryImages.map((file, index) => (
                                  <div key={`new-${index}`} className="relative w-24 h-24 group">
                                      <img src={URL.createObjectURL(file)} alt="New Gallery" className="w-full h-full object-cover rounded-lg border border-blue-300" />
                                      <button type="button" onClick={() => removeNewGalleryImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Trash2 className="w-3 h-3" />
                                      </button>
                                  </div>
                              ))}
                          </div>
                          
                          <div className="flex items-center gap-2">
                             {(() => {
                                const currentCount = profileForm.galleryUrls.length + newGalleryImages.length;
                                const slotsLeft = 5 - currentCount;
                                const isFull = slotsLeft <= 0;

                                return (
                                    <>
                                        <label className={`cursor-pointer px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${isFull ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                                            <Upload className="w-4 h-4" /> Add Images
                                            <input type="file" multiple accept="image/*" onChange={handleGalleryChange} disabled={isFull} className="hidden" />
                                        </label>
                                        <span className={`text-xs ${isFull ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                            {isFull ? "Max limit reached (5/5)" : `${slotsLeft} slots remaining`}
                                        </span>
                                    </>
                                );
                             })()}
                          </div>
                      </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newFeature} 
                            onChange={(e) => setNewFeature(e.target.value)} 
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault(); 
                                    handleAddFeature();
                                }
                            }}
                            className="border p-2 rounded flex-1" 
                            placeholder="Add Feature (Press Enter)" 
                        />
                        <button type="button" onClick={handleAddFeature} className="bg-blue-600 text-white px-4 rounded">Add</button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                      {profileForm.features.map((f, i) => (
                          <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center">{f} <button type="button" onClick={() => handleRemoveFeature(i)} className="ml-2 text-red-500">×</button></span>
                      ))}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4">
                      <button 
                        type="submit" 
                        className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 transform ${
                            hasUnsavedChanges 
                                ? "bg-yellow-500 text-white shadow-lg scale-105 ring-2 ring-yellow-300 hover:bg-yellow-600 animate-pulse" 
                                : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {hasUnsavedChanges ? "⚠️ Save Changes" : "Save Changes"}
                      </button>
                      {hasUnsavedChanges && (
                          <span className="text-sm text-yellow-600 font-medium">You have unsaved changes</span>
                      )}
                  </div>

              </form>
            )}

            {/* REVIEWS */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Recent Reviews</h2>
                {reviews.length === 0 ? <p className="text-gray-500">No reviews yet.</p> : (
                    reviews.map((review) => (
                        <div key={review._id} className="border p-4 rounded-lg bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">{review.userId?.name?.charAt(0) || "S"}</div>
                                    <div>
                                        <p className="font-semibold">{review.userId?.name || "Student"}</p>
                                        <div className="flex text-yellow-500 text-sm">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />)}</div>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-700 mb-3 ml-11">{review.comment}</p>
                            <div className="flex items-center gap-4 ml-11">
                                <button onClick={() => handleLikeToggle(review._id)} className={`flex items-center text-sm gap-1 ${review.likes?.includes(user?.id) ? 'text-blue-600 font-bold' : 'text-gray-500'}`}><ThumbsUp className="w-4 h-4" /> {review.likes?.length || 0} Helpful</button>
                                {!review.reply && <button onClick={() => setActiveReplyId(activeReplyId === review._id ? null : review._id)} className="flex items-center text-sm gap-1 text-gray-500 hover:text-blue-600"><Reply className="w-4 h-4" /> Reply</button>}
                            </div>
                            {review.reply && <div className="ml-11 mt-3 bg-blue-50 p-3 rounded border-l-4 border-blue-400"><p className="text-xs font-bold text-blue-800">Your Reply:</p><p className="text-sm text-gray-700">{review.reply}</p></div>}
                            {activeReplyId === review._id && !review.reply && (
                                <div className="ml-11 mt-3">
                                    <textarea className="w-full p-2 border rounded text-sm mb-2" placeholder="Write a response..." value={replyText[review._id] || ""} onChange={(e) => setReplyText({...replyText, [review._id]: e.target.value})}></textarea>
                                    <div className="flex gap-2"><button onClick={() => handleReplySubmit(review._id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Post Reply</button><button onClick={() => setActiveReplyId(null)} className="text-gray-500 text-sm px-2">Cancel</button></div>
                                </div>
                            )}
                        </div>
                    ))
                )}
              </div>
            )}

            {/* INQUIRIES */}
            {activeTab === "inquiries" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Recent Inquiries</h2>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold border border-blue-200">
                        Total: {inquiries.length}
                    </span>
                </div>
                
                {inquiries.length === 0 ? <p className="text-gray-500">No active inquiries.</p> : (
                    inquiries.map((inq) => {
                      const relativeTime = getRelativeTime(inq.updatedAt || inq.createdAt);
                      return (
                        <div key={inq._id} className="bg-gray-50 p-4 rounded border">
                            <div className="flex items-center gap-2 mb-1">
                                <UserIcon className="w-4 h-4 text-gray-500" />
                                <span className="font-bold">{inq.studentName}</span>
                                <span className="text-xs text-gray-400">
                                  • {new Date(inq.updatedAt || inq.createdAt).toLocaleString()} 
                                  {relativeTime && <span className="ml-1 font-semibold text-blue-600">({relativeTime})</span>}
                                </span>
                            </div>
                            <p className="text-blue-600 font-medium text-sm mb-2">{inq.courseInterest}</p>
                            <p className="text-gray-600 text-sm mb-3">"{inq.message}"</p>
                            <div className="flex gap-4 text-sm text-gray-500"><span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {inq.studentPhone}</span><span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {inq.studentEmail}</span></div>
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* 🚀 NEW: NOTIFICATIONS TAB CONTENT */}
            {activeTab === "notifications" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Notifications</h2>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-16 w-16 text-gray-300 mx-mb-4" />
                    <p className="text-gray-600">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => {
                      // 🚀 Check and Highlight
                      const isPadhaiOnOfficial = notification.type === 'admin_broadcast';
                      
                      return (
                        <div
                          key={notification._id}
                          className={`border rounded-lg p-4 relative transition-all duration-200 ${
                            isPadhaiOnOfficial 
                              ? "bg-purple-50 border-purple-300 shadow-sm" // Highlight Style
                              : (notification.isRead ? "bg-white" : "bg-blue-50 border-blue-200")
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {isPadhaiOnOfficial && <Megaphone className="h-4 w-4 text-purple-600" />}
                                <h3 className={`font-semibold ${isPadhaiOnOfficial ? 'text-purple-900' : 'text-gray-900'}`}>
                                    {notification.title}
                                </h3>
                                {/* Official Badge */}
                                {isPadhaiOnOfficial && (
                                    <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                        Official
                                    </span>
                                )}
                                {!notification.isRead && !isPadhaiOnOfficial && (
                                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">New</span>
                                )}
                              </div>
                              <p className={`text-sm ${isPadhaiOnOfficial ? 'text-purple-800' : 'text-gray-600'}`}>
                                  {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification._id)}
                                className="ml-4 text-blue-600 hover:text-blue-800"
                                title="Mark as read"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
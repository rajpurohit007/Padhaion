import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, MapPin, Users, Trash2, Calendar, CheckCircle, ArrowLeft, Image, MessageSquare, ThumbsUp, Reply } from "lucide-react"; 
import { institutionsAPI, blogsAPI, getImageUrl } from "../services/api";
import toast from "react-hot-toast"; 
import ConfirmModal from "../components/ConfirmModal"; 

// Helper to safely get image URL
const getSafeImageUrl = (url) => {
    if (!url) return "/placeholder.svg";
    return getImageUrl(url);
};

export default function InstitutionDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate(); 
  
  // --- STATE MANAGEMENT ---
  const [institution, setInstitution] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroImage, setHeroImage] = useState(null); 

  // Inquiry State
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [inquiryData, setInquiryData] = useState({ 
      name: "", 
      email: "", 
      phone: "", 
      course: "", 
      message: "" 
  });

  // Reviews State
  const [reviews, setReviews] = useState([]); 
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  // --- INITIAL DATA FETCHING ---
  useEffect(() => {
    const loadPageData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Institution Details
            const instResponse = await institutionsAPI.getById(id);
            setInstitution(instResponse.data.data);

            // 2. Fetch Live Reviews
            try {
                const reviewsResponse = await institutionsAPI.getReviews(id);
                setReviews(reviewsResponse.data.data || []);
            } catch (err) {
                console.error("Error fetching reviews:", err);
                setReviews([]);
            }

            // 3. Fetch Related Blogs
            try {
                const blogResponse = await blogsAPI.getAll();
                setRelatedBlogs(blogResponse.data.data ? blogResponse.data.data.slice(0, 3) : []);
            } catch (err) {
                console.error("Error fetching blogs:", err);
            }

        } catch (error) {
            console.error("Error fetching institution data:", error);
        } finally {
            setLoading(false);
        }
    };

    loadPageData();
  }, [id]);
    
  // --- EFFECT: SET HERO IMAGE ---
  useEffect(() => {
      if (institution) {
          const primaryImage = institution.thumbnailUrl || institution.galleryUrls?.[0] || "/placeholder.svg";
          setHeroImage(getSafeImageUrl(primaryImage));
      }
  }, [institution]);

  // --- EFFECT: PRE-FILL USER DATA ---
  useEffect(() => {
    if (user) {
      setInquiryData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  // --- EFFECT: AUTO-CLOSE TOAST ---
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted]);


  // --- HANDLERS: INQUIRY SYSTEM ---

  const handleOpenInquiryForm = () => {
    if (user && user.userType !== 'student') {
          toast.error("Only students can send inquiries.");
          return;
      }
      if (!user) {
          setConfirmOpen(true);
          return;
      }
      setShowInquiryForm(true);
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (user && user.userType !== 'student') {
        toast.error("Institutions/Admins cannot send inquiries.");
        return;
    }
    if (!user) {
        toast.error("You must be logged in to send an inquiry.");
        navigate("/login");
        return;
    }

    // Prepare WhatsApp URL
    const adminPhone = "919825984800";
    const whatsappMessage = `Hi, I am interested in *${institution.name}*.\n\n*My Details:*\nName: ${inquiryData.name}\nPhone: ${inquiryData.phone}\nCourse: ${inquiryData.course || 'Not Specified'}\nMessage: ${inquiryData.message || 'I would like to know more.'}`;
    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(whatsappMessage)}`;

    try {
      // 1. Save to Database
      let payload = {
        userId: user.id || user._id,
        name: inquiryData.name,
        email: inquiryData.email,
        phone: inquiryData.phone,
        course: inquiryData.course,
        message: inquiryData.message,
      };

      await institutionsAPI.sendInquiry(id, payload);

      // 2. Update UI
      setIsSubmitted(true);
      setShowInquiryForm(false);
      setInquiryData(prev => ({ ...prev, course: "", message: "" })); // Clear specific fields

      // 3. Redirect to WhatsApp
      window.open(whatsappUrl, '_blank');
      toast.success("Inquiry saved! Opening WhatsApp...");

    } catch (error) {
      console.error("Error sending inquiry:", error);
      toast.error("Note: We couldn't save your inquiry to our history, but we will redirect you to WhatsApp now.");
      window.open(whatsappUrl, '_blank');
    }
  };

  // --- HANDLERS: REVIEW SYSTEM ---

  const handleReviewSubmit = async (e) => {
      e.preventDefault();
      
      if (!user) {
          toast.error("Please login to submit a review.");
          navigate("/login");
          return;
      }
      
      // Strict check for Student role
      if (user.userType !== 'student') {
          toast.error("Only students can write reviews.");
          return;
      }

      if (reviewRating === 0) {
          toast.error("Please select a star rating.");
          return;
      }

      try {
          // 1. Submit Review to API
          await institutionsAPI.addReview(id, {
              userId: user.id || user._id,
              rating: reviewRating,
              comment: reviewComment,
              course: "General" 
          });

          // 2. Reset Form
          setReviewComment("");
          setReviewRating(0);
          setShowReviewForm(false);
          toast.success("Review submitted successfully!");

          // 3. Refresh Data (to show new review & update avg rating)
          const updatedReviews = await institutionsAPI.getReviews(id);
          setReviews(updatedReviews.data.data);
          
          const updatedInst = await institutionsAPI.getById(id);
          setInstitution(updatedInst.data.data);

      } catch (error) {
          console.error("Review failed:", error);
          toast.error(error.response?.data?.message || "Failed to submit review.");
      }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInquiryData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

// 🚀 HANDLER: DELETE REVIEW
  const handleDeleteReview = async (reviewId) => {
      if (!confirm("Are you sure you want to delete your review?")) return;

      try {
          await institutionsAPI.deleteReview(reviewId);
          toast.success("Review deleted successfully");
          setReviews(prevReviews => prevReviews.filter(r => r._id !== reviewId));
      } catch (error) {
          console.error("Delete failed:", error);
          toast.error("Failed to delete review");
      }
  };
  // --- RENDER HELPERS ---

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Institution Not Found</h2>
          <Link to="/institutions" className="text-blue-600 hover:text-blue-700">
            Back to Institutions
          </Link>
        </div>
      </div>
    );
  }
    
  // Combine thumbnail and gallery images for display, removing duplicates
  const allImages = [institution.thumbnailUrl, ...(institution.galleryUrls || [])]
    .filter((url, index, self) => url && self.indexOf(url) === index)
    .map(url => getSafeImageUrl(url));

    const averageRating = reviews.length > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : (institution.rating || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* --- CONFIRM MODAL --- */}
      <ConfirmModal 
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => navigate("/login")}
        title="Login Required"
        message="You must be logged in to perform this action. Would you like to go to the login page?"
        confirmText="Go to Login"
      />

      {/* --- HERO SECTION --- */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link to="/institutions" className="inline-flex items-center text-blue-100 hover:text-white mb-8 group">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Institutions
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-4">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {institution.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-6">{institution.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-blue-100 mb-6">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span>{averageRating} ({reviews.length} Reviews)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-5 w-5" />
                  <span>{institution.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-5 w-5" />
                  <span>{institution.totalStudents.toLocaleString()} Students</span>
                </div>
              </div>
              <p className="text-xl text-blue-100 mb-8">
                Established in {institution.established}, specializing in {institution.specialization}
                with a commitment to excellence in education.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleOpenInquiryForm}
                  className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                >
                  Send Inquiry
                </button>
                <Link
                  to="/book-consultation"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors text-center"
                >
                  Free Consultation
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src={heroImage}
                alt={institution.name}
                className="rounded-xl shadow-2xl w-full max-h-[400px] object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.svg"; }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2">
            
            {/* CARD: GALLERY & ABOUT */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                
                {/* --- MOVED GALLERY TO TOP --- */}
                {allImages.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <Image className="h-5 w-5 mr-2 text-blue-500" /> Institution Gallery
                        </h3>
                        <div className="mb-4">
                            <img
                                src={heroImage}
                                alt="Gallery Hero"
                                className="w-full h-96 object-cover rounded-xl shadow-lg border border-gray-200"
                                onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.svg"; }}
                            />
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {allImages.map((imgUrl, index) => (
                                <img
                                    key={index}
                                    src={imgUrl}
                                    alt={`Gallery image ${index + 1}`}
                                    className={`w-20 h-20 object-cover rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                                        heroImage === imgUrl ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-gray-300'
                                    }`}
                                    onClick={() => setHeroImage(imgUrl)}
                                    onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.svg"; }}
                                />
                            ))}
                        </div>
                    </div>
                )}
                {/* --- END GALLERY --- */}

              <h2 className="text-2xl font-bold text-gray-900 mb-6">About {institution.name}</h2>
              <p className="text-gray-600 mb-6">
                {institution.name} is a premier {institution.category.toLowerCase()} established in{" "}
                {institution.established}. With over {new Date().getFullYear() - institution.established} years of
                excellence in education, we have been shaping the future of thousands of students. 
                {institution.description}
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {(institution.features || []).map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Specialization</h3>
              <p className="text-gray-600">
                Our institution specializes in {institution.specialization}, offering comprehensive programs designed to
                meet industry standards and prepare students for successful careers.
              </p>
            </div>

            {/* --- REVIEWS SECTION --- */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Student Reviews</h2>
                  
                  {/* Only show "Write Review" if logged in as Student */}
                  {user && user.userType === 'student' && (
                      <button 
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" /> Write a Review
                      </button>
                  )}
              </div>

              {/* REVIEW FORM */}
              {showReviewForm && user?.userType === 'student' && (
                  <form onSubmit={handleReviewSubmit} className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <h3 className="font-semibold mb-3 text-lg">Rate your experience</h3>
                      
                      {/* Star Rating Input */}
                      <div className="flex mb-4 gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                              <button 
                                type="button"
                                key={star}
                                onClick={() => setReviewRating(star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                              >
                                  <Star 
                                      className={`w-8 h-8 ${star <= reviewRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                  />
                              </button>
                          ))}
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="4"
                            placeholder="Share details of your own experience at this place..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            required
                        ></textarea>
                      </div>

                      <div className="flex justify-end gap-3">
                          <button 
                            type="button" 
                            onClick={() => setShowReviewForm(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium">
                              Post Review
                          </button>
                      </div>
                  </form>
              )}

              {/* REVIEWS LIST */}
              <div className="space-y-6">
                {reviews.length > 0 ? (
                    reviews.map((review) => (
                    <div key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-blue-600 font-bold text-lg">
                                {review.userId?.name?.charAt(0).toUpperCase() || "U"}
                            </span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-gray-900">{review.userId?.name || "Anonymous"}</span>
                                <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                {user && (user.id === review.userId?._id || user._id === review.userId?._id) && (
                                        <button 
                                            onClick={() => handleDeleteReview(review._id)} 
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                            title="Delete your review"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                            </div>
                            <div className="flex mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                ))}
                            </div>
                            <p className="text-gray-700">{review.comment}</p>

                            {/* --- VISIBLE REPLY SECTION --- */}
                            {review.reply && (
                                <div className="mt-3 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500 animate-fade-in">
                                    <p className="text-xs font-bold text-blue-700 mb-1 flex items-center">
                                        <Reply className="w-3 h-3 mr-1" /> Response from Institution
                                    </p>
                                    <p className="text-sm text-gray-700 italic">"{review.reply}"</p>
                                </div>
                            )}

                            {/* --- VISIBLE LIKE COUNT --- */}
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                <ThumbsUp className="w-3 h-3" /> 
                                <span>{review.likes?.length || 0} found this helpful</span>
                            </div>

                        </div>
                        </div>
                    </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        <p>No reviews yet.</p>
                        <p className="text-sm mt-1">Be the first to share your experience!</p>
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Star className="h-6 w-6 text-yellow-400 fill-current" />
                  <span className="text-2xl font-bold text-gray-900">{averageRating}</span>
                  <span className="text-gray-600">/ 5.0</span>
                </div>
                <p className="text-gray-600">Based on student reviews</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{institution.location}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{institution.totalStudents.toLocaleString()} Students</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">Established {institution.established}</span>
                </div>
              </div>

              <button
                onClick={handleOpenInquiryForm}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4"
              >
                Send Inquiry
              </button>
              <Link
                to="/book-consultation"
                className="w-full border border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors block text-center"
              >
                Free Consultation
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* INQUIRY MODAL */}
      {showInquiryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {user ? `Send Inquiry to ${institution.name}` : "Login Required"} 
              </h3>
              <button onClick={() => setShowInquiryForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>

            {user ? (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={inquiryData.name}
                  onChange={handleInputChange}
                  readOnly={!!user}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={inquiryData.email}
                  onChange={handleInputChange}
                  readOnly={!!user}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={inquiryData.phone}
                  onChange={handleInputChange}
                  readOnly={!!user}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course of Interest</label>
                <input
                  type="text"
                  name="course"
                  value={inquiryData.course}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. B.Tech"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={3}
                  name="message"
                  value={inquiryData.message}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about your requirements..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInquiryForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold"
                >
                  Contact via WhatsApp
                </button>
              </div>
            </form>
            ) : (
                <div className="text-center py-4">
                    <h4 className="text-lg font-semibold text-red-600 mb-3">Please Login to Send an Inquiry</h4>
                    <p className="text-gray-600 mb-6">You need to sign in to submit an inquiry to the institution.</p>
                    <Link
                        to="/login"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        onClick={() => setShowInquiryForm(false)}
                    >
                        Go to Login
                    </Link>
                </div>
            )}
          </div>
        </div>
      )}

      {isSubmitted && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-xl flex items-center space-x-2 z-50 transition-opacity duration-300">
          <CheckCircle className="h-5 w-5" />
          <span>Inquiry sent successfully! Redirecting to WhatsApp...</span>
        </div>
      )}
    </div>
  );
}
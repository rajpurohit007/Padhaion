import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Building2, Calendar, Star, CheckCircle, XCircle, Clock, Send, Search, Bell ,FileText,Upload,Trash2,Pencil} from "lucide-react";
// import { adminAPI } from "../services/api";
import { adminAPI, getImageUrl } from "../services/api";

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [institutionRequests, setInstitutionRequests] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [blogs, setBlogs] = useState([]);

  // Approval Modal State
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [approvalData, setApprovalData] = useState({
    scheduledDate: "",
    scheduledTime: "",
    mode: "online",
    meetingLink: "",
    location: "",
    notes: "",
  });

  // --- NEW: Notification Modal State ---
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifData, setNotifData] = useState({ target: "all", title: "", message: "" });
const [editingBlogId, setEditingBlogId] = useState(null);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [blogForm, setBlogForm] = useState({
    title: "", excerpt: "", content: "", author: "Admin", date: new Date().toISOString().split('T')[0], readTime: "5 min read", category: "Study Tips"
  });
  const [blogImage, setBlogImage] = useState(null);

  useEffect(() => {
    if (!user || user.userType !== "admin") {
      navigate("/login");
      return;
    }
    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, studentsRes, institutionsRes, requestsRes, consultationsRes, reviewsRes, blogsRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getStudents({ limit: 100 }),
        adminAPI.getInstitutions({ limit: 100 }),
        adminAPI.getInstitutionRequests({ status: "all" }),
        adminAPI.getConsultations({ status: "all" }),
        adminAPI.getReviews(),
        adminAPI.getBlogs(),
      ]);

      setStats(statsRes.data.data);
      setStudents(studentsRes.data.data);
      setInstitutions(institutionsRes.data.data);
      setInstitutionRequests(requestsRes.data.data);
      setConsultations(consultationsRes.data.data);
      setReviews(reviewsRes.data.data);
      setBlogs(blogsRes.data.data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      alert("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveInstitution = async (id) => {
    if (!confirm("Are you sure you want to approve this institution? Credentials will be sent via email.")) return;

    try {
      await adminAPI.approveInstitutionRequest(id);
      alert("Institution approved! Credentials sent via email.");
      loadDashboardData();
    } catch (error) {
      console.error("Error approving institution:", error);
      alert("Failed to approve institution");
    }
  };

  const handleRejectInstitution = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      await adminAPI.rejectInstitutionRequest(id, { reason });
      alert("Institution request rejected");
      loadDashboardData();
    } catch (error) {
      console.error("Error rejecting institution:", error);
      alert("Failed to reject institution");
    }
  };

  // Delete Institution Handler
  const handleDeleteInstitution = async (id) => {
    if (!confirm("Are you sure you want to permanently delete this institution? This cannot be undone.")) return;

    try {
      await adminAPI.deleteInstitution(id);
      alert("Institution deleted successfully.");
      loadDashboardData(); // Refresh list
    } catch (error) {
      console.error("Error deleting institution:", error);
      alert("Failed to delete institution");
    }
  };

  const handleApproveConsultation = (consultation) => {
    setSelectedConsultation(consultation);
    setShowApprovalModal(true);
  };

  const submitConsultationApproval = async () => {
    if (!approvalData.scheduledDate || !approvalData.scheduledTime) {
      alert("Please fill in date and time");
      return;
    }

    if (approvalData.mode === "online" && !approvalData.meetingLink) {
      alert("Please provide meeting link for online consultation");
      return;
    }

    if (approvalData.mode === "offline" && !approvalData.location) {
      alert("Please provide location for offline consultation");
      return;
    }

    if (!selectedConsultation) return;

    try {
      await adminAPI.approveConsultation(selectedConsultation._id, approvalData);
      alert("Consultation approved and student notified!");
      setShowApprovalModal(false);
      setApprovalData({
        scheduledDate: "",
        scheduledTime: "",
        mode: "online",
        meetingLink: "",
        location: "",
        notes: "",
      });
      loadDashboardData();
    } catch (error) {
      console.error("Error approving consultation:", error);
      alert("Failed to approve consultation");
    }
  };

  const handleRejectConsultation = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      await adminAPI.rejectConsultation(id, { reason });
      alert("Consultation rejected and student notified");
      loadDashboardData();
    } catch (error) {
      console.error("Error rejecting consultation:", error);
      alert("Failed to reject consultation");
    }
  };

  const handleDeleteReview = async (id) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await adminAPI.deleteReview(id);
      alert("Review deleted");
      loadDashboardData();
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review");
    }
  };

  const handleToggleUserStatus = async (id) => {
    try {
      await adminAPI.toggleUserStatus(id);
      alert("User status updated");
      loadDashboardData();
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert("Failed to update user status");
    }
  };

  // --- MODIFIED: Open Modal instead of Prompt ---
  const handleSendBulkNotification = () => {
    setShowNotifModal(true);
  };

  // --- NEW: Submit Handler for Notification Modal ---
  const submitBulkNotification = async (e) => {
    e.preventDefault();
    if (!notifData.title || !notifData.message) {
        alert("Please fill all fields");
        return;
    }

    try {
      // Send with 'admin_broadcast' type to trigger highlighting on dashboards
      await adminAPI.bulkSendNotification({ 
          userType: notifData.target, 
          title: notifData.title, 
          message: notifData.message,
          type: "admin_broadcast" 
      });
      
      alert(`Notification sent to ${notifData.target === 'all' ? 'everyone' : 'all ' + notifData.target + 's'}`);
      setShowNotifModal(false);
      setNotifData({ target: "all", title: "", message: "" });
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Failed to send notification");
    }
  };
const handleCreateBlog = async (e) => {
      e.preventDefault();
      if (!blogImage) return alert("Please upload an image");
      
      try {
          const formData = new FormData();
          Object.keys(blogForm).forEach(key => formData.append(key, blogForm[key]));
          formData.append("image", blogImage);

          await adminAPI.createBlog(formData);
          alert("Blog published successfully!");
          setShowBlogModal(false);
          setBlogForm({ title: "", excerpt: "", content: "", author: "Admin", date: new Date().toISOString().split('T')[0], readTime: "5 min read", category: "Study Tips" });
          setBlogImage(null);
          loadDashboardData();
      } catch (error) {
          console.error("Blog Error:", error);
          alert("Failed to create blog");
      }
  };

const handleEditBlog = (blog) => {
      setEditingBlogId(blog._id);
      setBlogForm({
          title: blog.title,
          excerpt: blog.excerpt,
          content: blog.content,
          author: blog.author,
          date: blog.date, 
          readTime: blog.readTime,
          category: blog.category
      });
      setBlogImage(null); // Keep null to keep existing image unless changed
      setShowBlogModal(true);
  };

  const handleSaveBlog = async (e) => {
      e.preventDefault();
      
      // Image is required only if creating a NEW blog
      if (!editingBlogId && !blogImage) return alert("Please upload an image for new blogs.");
      
      try {
          const formData = new FormData();
          Object.keys(blogForm).forEach(key => formData.append(key, blogForm[key]));
          
          // Only append image if a new one is selected
          if (blogImage) formData.append("image", blogImage);

          if (editingBlogId) {
              // 🚀 UPDATE MODE
              await adminAPI.updateBlog(editingBlogId, formData);
              alert("Blog updated successfully!");
          } else {
              // 🚀 CREATE MODE
              await adminAPI.createBlog(formData);
              alert("Blog published successfully!");
          }

          closeBlogModal();
          loadDashboardData();
      } catch (error) {
          console.error("Blog Error:", error);
          alert("Failed to save blog");
      }
  };
  const handleDeleteBlog = async (id) => {
      if (!confirm("Delete this blog?")) return;
      try {
          await adminAPI.deleteBlog(id);
          alert("Deleted");
          loadDashboardData();
      } catch (error) { console.error(error); alert("Failed to delete"); }
  };

  const closeBlogModal = () => {
      setShowBlogModal(false);
      setEditingBlogId(null);
      setBlogForm({ title: "", excerpt: "", content: "", author: "Admin", date: new Date().toISOString().split('T')[0], readTime: "5 min read", category: "Study Tips" });
      setBlogImage(null);
  };
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

  const filteredConsultations = consultations.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (searchTerm && !c.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredRequests = institutionRequests.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (searchTerm && !r.institutionName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage all platform activities and users</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                </div>
                <Users className="h-10 w-10 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Institutions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalInstitutions}</p>
                </div>
                <Building2 className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
                </div>
                <Clock className="h-10 w-10 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Consultations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingConsultations}</p>
                </div>
                <Calendar className="h-10 w-10 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
                </div>
                <Star className="h-10 w-10 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-scroll" aria-label="Tabs">
              {[
                { id: "overview", label: "Overview" },
                { id: "students", label: "Students" },
                { id: "institutions", label: "Institutions" },
                { id: "requests", label: "Institution Requests" },
                { id: "consultations", label: "Consultations" },
                { id: "reviews", label: "Reviews" },
                { id: "blogs", label: "Blogs" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
                  <button
                    onClick={handleSendBulkNotification}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send Bulk Notification</span>
                  </button>
                </div>

                {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentActivities.map((activity) => (
                      <div key={activity._id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <Bell className="h-5 w-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-600">{activity.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(activity.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent activities</p>
                )}
              </div>
            )}

            {activeTab === "students" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students
                        .filter((s) => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((student) => (
                          <tr key={student._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  student.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}
                              >
                                {student.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(student.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleToggleUserStatus(student._id)}
                                className="text-blue-600 hover:text-blue-800 mr-3"
                              >
                                {student.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "institutions" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search institutions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {institutions
                    .filter((i) => !searchTerm || i.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((institution) => (
                      <div key={institution._id} className="bg-gray-50 rounded-lg p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{institution.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{institution.category}</p>
                            <p className="text-sm text-gray-600 mb-2">{institution.location}</p>
                            <p className="text-sm text-gray-600">Contact: {institution.ownerId?.email || "N/A"}</p>
                          </div>
                          {/* 🚀 Delete Button */}
                          <button 
                            onClick={() => handleDeleteInstitution(institution._id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeTab === "requests" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4 mb-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <div key={request._id} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{request.institutionName}</h3>
                          <p className="text-sm text-gray-600">{request.category}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            request.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : request.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Contact Person</p>
                          <p className="text-sm font-medium text-gray-900">{request.contactPerson}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="text-sm font-medium text-gray-900">{request.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="text-sm font-medium text-gray-900">{request.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="text-sm font-medium text-gray-900">{request.location}</p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">{request.description}</p>

                      {request.status === "pending" && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleApproveInstitution(request._id)}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Approve & Send Credentials</span>
                          </button>
                          <button
                            onClick={() => handleRejectInstitution(request._id)}
                            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "consultations" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4 mb-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {filteredConsultations.map((consultation) => (
                    <div key={consultation._id} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{consultation.consultationType}</h3>
                          <p className="text-sm text-gray-600">Student: {consultation.userId?.name || "N/A"}</p>
                          <p className="text-sm text-gray-600">Email: {consultation.userId?.email || "N/A"}</p>
                          <p className="text-sm text-gray-600">Phone: {consultation.userId?.phone || "N/A"}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            consultation.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : consultation.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {consultation.status}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600">Preferred Date & Time</p>
                        <p className="text-sm font-medium text-gray-900">
                          {consultation.selectedDate} at {consultation.selectedTime}
                        </p>
                      </div>

                      {consultation.message && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">Message</p>
                          <p className="text-sm text-gray-900">{consultation.message}</p>
                        </div>
                      )}

                      {consultation.status === "approved" && (
                        <div className="bg-green-50 p-4 rounded-lg mb-4">
                          <p className="text-sm font-medium text-green-900 mb-2">Scheduled Details</p>
                          <p className="text-sm text-green-800">
                            Date: {consultation.scheduledDate} at {consultation.scheduledTime}
                          </p>
                          <p className="text-sm text-green-800">Mode: {consultation.meetingType}</p>
                          {consultation.meetingLink && (
                            <p className="text-sm text-green-800">Link: {consultation.meetingLink}</p>
                          )}
                          {consultation.meetingLocation && (
                            <p className="text-sm text-green-800">Location: {consultation.meetingLocation}</p>
                          )}
                        </div>
                      )}

                      {consultation.status === "pending" && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleApproveConsultation(consultation)}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Approve & Schedule</span>
                          </button>
                          <button
                            onClick={() => handleRejectConsultation(consultation._id)}
                            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{review.institutionId?.name || "N/A"}</h3>
                        <p className="text-sm text-gray-600">By: {review.userId?.name || "N/A"}</p>
                        <div className="flex items-center mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">{review.rating}/5</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-sm text-gray-700">{review.comment}</p>
                    <p className="text-xs text-gray-500 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 🚀 ADDED: BLOGS TAB CONTENT */}
            {activeTab === "blogs" && (
              <div className="space-y-6">
                  <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold">Manage Blogs</h2>
                      <button onClick={() => { setEditingBlogId(null); setShowBlogModal(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                          <FileText className="w-4 h-4 mr-2" /> Write New Blog
                      </button>
                  </div>

                  {blogs.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-900">No blogs published yet</h3>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {blogs.map(blog => (
                              <div key={blog._id} className="bg-white rounded-lg shadow overflow-hidden border">
                                  <img src={getImageUrl(blog.image)} alt={blog.title} className="w-full h-40 object-cover" onError={(e) => {e.target.src = "/placeholder.svg"}} />
                                  <div className="p-4">
                                      <h3 className="font-bold text-lg mb-2 line-clamp-1">{blog.title}</h3>
                                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{blog.excerpt}</p>
                                      <div className="flex justify-between items-center">
                                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{blog.category}</span>
                                          <div className="flex gap-2">
                                              {/* 🚀 EDIT BUTTON */}
                                              <button onClick={() => handleEditBlog(blog)} className="text-blue-600 hover:text-blue-800">
                                                  <Pencil className="w-5 h-5" />
                                              </button>
                                              <button onClick={() => handleDeleteBlog(blog._id)} className="text-red-600 hover:text-red-800">
                                                  <Trash2 className="w-5 h-5" />
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

     
      {/* --- CONSULTATION APPROVAL MODAL --- */}
      {showApprovalModal && selectedConsultation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule Consultation</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={approvalData.scheduledDate}
                    onChange={(e) => setApprovalData({ ...approvalData, scheduledDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={approvalData.scheduledTime}
                    onChange={(e) => setApprovalData({ ...approvalData, scheduledTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                <select
                  value={approvalData.mode}
                  onChange={(e) => setApprovalData({ ...approvalData, mode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              {approvalData.mode === "online" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Link</label>
                  <input
                    type="url"
                    value={approvalData.meetingLink}
                    onChange={(e) => setApprovalData({ ...approvalData, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {approvalData.mode === "offline" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={approvalData.location}
                    onChange={(e) => setApprovalData({ ...approvalData, location: e.target.value })}
                    placeholder="Office address..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={approvalData.notes}
                  onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
                  rows={3}
                  placeholder="Any additional information..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={submitConsultationApproval}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Approve & Notify Student
              </button>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW: NOTIFICATION MODAL --- */}
      {showNotifModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Send Bulk Notification</h2>
                <form onSubmit={submitBulkNotification}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Target Audience</label>
                        <select 
                            className="w-full border p-2 rounded" 
                            value={notifData.target} 
                            onChange={(e) => setNotifData({...notifData, target: e.target.value})}
                        >
                            <option value="all">Everyone (Students & Institutions)</option>
                            <option value="student">All Students</option>
                            <option value="institution">All Institutions</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input 
                            type="text" 
                            className="w-full border p-2 rounded" 
                            value={notifData.title} 
                            onChange={(e) => setNotifData({...notifData, title: e.target.value})} 
                            required 
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Message</label>
                        <textarea 
                            className="w-full border p-2 rounded" 
                            rows={3} 
                            value={notifData.message} 
                            onChange={(e) => setNotifData({...notifData, message: e.target.value})} 
                            required
                        ></textarea>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Send</button>
                        <button type="button" onClick={() => setShowNotifModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
      )}
      {showBlogModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold mb-4">{editingBlogId ? "Edit Blog" : "Write New Blog"}</h2>
                  <form onSubmit={handleSaveBlog}>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="col-span-2"><label className="block text-sm font-medium">Title</label><input className="w-full border p-2 rounded" value={blogForm.title} onChange={(e) => setBlogForm({...blogForm, title: e.target.value})} required /></div>
                          <div><label className="block text-sm font-medium">Author</label><input className="w-full border p-2 rounded" value={blogForm.author} onChange={(e) => setBlogForm({...blogForm, author: e.target.value})} required /></div>
                          <div><label className="block text-sm font-medium">Read Time</label><input className="w-full border p-2 rounded" value={blogForm.readTime} onChange={(e) => setBlogForm({...blogForm, readTime: e.target.value})} required /></div>
                          <div><label className="block text-sm font-medium">Category</label><select className="w-full border p-2 rounded" value={blogForm.category} onChange={(e) => setBlogForm({...blogForm, category: e.target.value})}>{["Study Tips", "Career Advice", "University Guide", "Academic Tips", "Study Abroad"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                          <div><label className="block text-sm font-medium">Date</label><input type="date" className="w-full border p-2 rounded" value={blogForm.date} onChange={(e) => setBlogForm({...blogForm, date: e.target.value})} required /></div>
                          <div className="col-span-2">
                              <label className="block text-sm font-medium">Cover Image {editingBlogId && "(Optional)"}</label>
                              <div className="flex items-center gap-4">
                                  {blogImage && <img src={URL.createObjectURL(blogImage)} alt="Preview" className="w-20 h-20 object-cover rounded" />}
                                  <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded flex items-center gap-2"><Upload className="w-4 h-4" /> {editingBlogId ? "Change File" : "Choose File"}<input type="file" accept="image/*" className="hidden" onChange={(e) => setBlogImage(e.target.files[0])} /></label>
                              </div>
                          </div>
                          <div className="col-span-2"><label className="block text-sm font-medium">Excerpt</label><textarea className="w-full border p-2 rounded" rows={2} value={blogForm.excerpt} onChange={(e) => setBlogForm({...blogForm, excerpt: e.target.value})} required></textarea></div>
                          <div className="col-span-2"><label className="block text-sm font-medium">Content</label><textarea className="w-full border p-2 rounded" rows={6} value={blogForm.content} onChange={(e) => setBlogForm({...blogForm, content: e.target.value})} required></textarea></div>
                      </div>
                      <div className="flex gap-3">
                          <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded">{editingBlogId ? "Update Blog" : "Publish Blog"}</button>
                          <button type="button" onClick={closeBlogModal} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded">Cancel</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
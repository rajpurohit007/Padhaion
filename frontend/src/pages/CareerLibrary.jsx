import React, { useState, useEffect, useCallback } from "react";
import { Search, ChevronRight, Filter, BookOpen, DollarSign, Briefcase } from "lucide-react";
import { careersAPI } from "../services/api";
import toast from "react-hot-toast";

const CATEGORIES = [
  "All Careers",
  "Science & Tech",
  "Commerce & Finance",
  "Medical",
  "Design & Arts",
  "Legal",
  "Management",
  "Humanities",
  "Other"
];

// --- 🚀 SMART IMAGE COMPONENT ---
// This handles broken images gracefully by showing a gradient background instead
const CareerImage = ({ src, alt, category }) => {
  const [hasError, setHasError] = useState(false);

  // Helper to pick a nice gradient based on category
  const getGradient = (cat) => {
    switch (cat) {
      case 'Science & Tech': return 'from-blue-500 to-cyan-400';
      case 'Medical': return 'from-emerald-500 to-teal-400';
      case 'Commerce & Finance': return 'from-indigo-500 to-purple-400';
      case 'Design & Arts': return 'from-pink-500 to-rose-400';
      case 'Legal': return 'from-slate-600 to-slate-400';
      case 'Management': return 'from-orange-500 to-amber-400';
      case 'Humanities': return 'from-yellow-500 to-orange-300';
      default: return 'from-gray-500 to-gray-400';
    }
  };

  // If image failed or no URL provided, render the Gradient Fallback
  if (hasError || !src) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getGradient(category)}`}>
        <Briefcase className="text-white/40 w-16 h-16" />
      </div>
    );
  }

  // Otherwise, render the image
  return (
    <img 
      src={src} 
      alt={alt} 
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      onError={() => setHasError(true)} // 🚀 Safety switch: If load fails, switch to gradient
    />
  );
};

export default function CareerLibrary() {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Careers");

  // 🚀 Optimized Fetch Function
  const fetchCareers = useCallback(async (search = "", category = "All Careers") => {
    try {
      setIsFetching(true); 
      const res = await careersAPI.getAll({ search, category });
      if (res.data.success) {
        setCareers(res.data.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      // 🚀 Ignore suspension/auth errors (handled globally by Modal)
      if (error.response?.status === 403 || error.response?.status === 401) return;
      
      // Only show toast if it's a real server error (not cancelled request)
      if (error.code !== "ERR_CANCELED") {
          toast.error("Failed to load careers");
      }
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchCareers(searchTerm, selectedCategory);
  }, []); 

  // Handle Category Click
  const handleCategoryChange = (category) => {
    if (category === selectedCategory || isFetching) return; 
    setSelectedCategory(category);
    fetchCareers(searchTerm, category);
  };

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
        if (!loading) fetchCareers(searchTerm, selectedCategory);
    }, 600); 
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* 1. HERO SECTION */}
      <div className="bg-blue-900 text-white py-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
            </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Career Library
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8 font-light">
            Explore thousands of career options, salary trends, and educational paths to find your perfect fit.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${isFetching ? "text-blue-300" : "text-gray-400"}`} />
            </div>
            <input 
              type="text" 
              placeholder="Search for a career (e.g. Data Scientist)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full text-gray-900 bg-white shadow-xl focus:ring-4 focus:ring-blue-400 outline-none transition-all disabled:opacity-70 disabled:cursor-wait"
              disabled={isFetching}
            />
            {isFetching && (
                <div className="absolute inset-y-0 right-4 flex items-center">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT GRID */}
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR: Categories */}
        <div className="lg:w-1/4 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-24 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Career Streams
            </div>
            <div className="p-2 space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  disabled={isFetching}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex justify-between items-center
                    ${selectedCategory === cat 
                      ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}
                    ${isFetching ? "opacity-50 cursor-wait" : "cursor-pointer"}
                  `}
                >
                  {cat}
                  {selectedCategory === cat && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENT: Career Grid */}
        <div className="lg:w-3/4">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
                {selectedCategory}
            </h2>
            <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border shadow-sm">
                {careers.length} Careers Found
            </span>
          </div>

          {loading ? (
            // LOADING SKELETON
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-pulse h-80 overflow-hidden">
                        <div className="h-40 bg-gray-200 w-full"></div>
                        <div className="p-6">
                            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                        </div>
                    </div>
                ))}
            </div>
          ) : careers.length === 0 ? (
            // EMPTY STATE
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">No careers found matching your criteria.</p>
                <button 
                    onClick={() => {setSearchTerm(""); setSelectedCategory("All Careers"); fetchCareers("", "All Careers")}}
                    className="mt-4 text-blue-600 hover:underline font-medium"
                >
                    Clear Filters
                </button>
            </div>
          ) : (
            // CAREER CARDS
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-100 transition-opacity duration-300">
              {careers.map((career) => (
                <div 
                    key={career._id} 
                    className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col h-full"
                >
                  {/* 🚀 SMART IMAGE HEADER */}
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                      <CareerImage 
                        src={career.image} 
                        alt={career.title} 
                        category={career.category} 
                      />
                      
                      <div className="absolute top-3 left-3">
                          <span className="text-xs font-bold text-blue-800 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm">
                              {career.category}
                          </span>
                      </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {career.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                        {career.description}
                    </p>

                    <div className="pt-4 border-t border-gray-100 mt-auto">
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center text-gray-700 font-medium bg-gray-50 px-2 py-1 rounded">
                                <DollarSign className="w-3 h-3 mr-1 text-green-600" /> 
                                {career.salaryRange}
                            </span>
                        </div>
                    </div>
                  </div>
                  
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors duration-300">
                    <span className="text-xs font-semibold text-gray-500 group-hover:text-white uppercase tracking-wide">View Roadmap</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"use client"
import React, { useState, useEffect } from "react";
import { Search } from "lucide-react"
import { blogsAPI, getImageUrl } from "../services/api" // 🚀 Added getImageUrl based on context
import BlogCard from "../components/BlogCard"

export default function Blog() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categories = ["All", "Study Tips", "Career Advice", "University Guide", "Academic Tips", "Study Abroad"]

  useEffect(() => {
    // Debounce could be added here for optimization, 
    // but moving the loader fixes the focus issue immediately.
    const timer = setTimeout(() => {
        fetchBlogs()
    }, 300); // Optional: Slight delay to prevent API spam on every key

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const params = {
        search: searchTerm,
        category: selectedCategory,
      }
      const response = await blogsAPI.getAll(params)
      
      // Ensure we process images if needed, matching your previous fixes
      const processedBlogs = (response.data.data || []).map(blog => ({
        ...blog,
        image: getImageUrl(blog.image)
      }));

      setBlogs(processedBlogs)
    } catch (error) {
      console.error("Error fetching blogs:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Educational Blog</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover insights, tips, and guidance to enhance your learning journey
          </p>
        </div>

        {/* 🚀 Search Section - Always Mounted to prevent focus loss */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 🚀 Content Section - Loader is now inside here */}
        {loading ? (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.length > 0 ? (
                    blogs.map((blog) => (
                        <BlogCard key={blog._id} blog={blog} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        <p className="text-xl">No blogs found.</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  )
}
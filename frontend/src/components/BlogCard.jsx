import React from "react";
import { Link } from "react-router-dom";
import { Calendar, User, Clock, ArrowRight } from "lucide-react";
// 🚀 FIX: Import the image helper
import { getImageUrl } from "../services/api";

export default function BlogCard({ blog }) {
  return (
    <article className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <Link to={`/blog/${blog._id}`}>
      
      
      <div className="relative">
        {/* 🚀 FIX: Use getImageUrl to resolve the full backend path */}
        <img 
            src={getImageUrl(blog.image)} 
            alt={blog.title} 
            className="w-full h-48 object-cover" 
            onError={(e) => {e.target.src = "/placeholder.svg"}} // Fallback if image fails
        />
        <div className="absolute top-4 left-4">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">{blog.category}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>{blog.author}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{blog.date}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{blog.readTime}</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
          {blog.title}
        </h3>

        <p className="text-gray-600 mb-4 line-clamp-3">{blog.excerpt}</p>

        <div
          
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group"
        >
          Read More
          <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
      </Link>
    </article>
  )
}
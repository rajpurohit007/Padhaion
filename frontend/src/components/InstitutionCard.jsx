// frontend\src\components\InstitutionCard.jsx

import { Link } from "react-router-dom"
import { Star, MapPin, Users, Phone, Mail, Award } from "lucide-react"

import React, { useState, useEffect } from "react";
import { getImageUrl, institutionsAPI } from "../services/api";

export default function InstitutionCard({ institution }) {
    if (!institution) return null 

    const contact = institution.contact || {}
    // Use thumbnailUrl first, fallback to generic placeholder
    const cardImage = getImageUrl(institution.thumbnailUrl);

    // 🚀 STATE: Hold live reviews
  const [reviews, setReviews] = useState([]);

  // 🚀 EFFECT: Fetch latest reviews for this card specifically
  useEffect(() => {
    const fetchCardReviews = async () => {
      try {
        const response = await institutionsAPI.getReviews(institution._id);
        setReviews(response.data.data || []);
      } catch (error) {
        console.error("Error fetching reviews for card:", error);
      }
    };

    if (institution._id) {
      fetchCardReviews();
    }
  }, [institution._id]);

  // 🚀 CALCULATION LOGIC (Matched exactly with Dashboard/Detail)
  const averageRating = reviews.length > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : (institution.rating || "0");

  const reviewCount = reviews.length; // Use live count, not prop count
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="relative">
          <img
            src={cardImage} 
            alt={institution.name || "Institution"}
            className="w-full h-48 object-cover"
            onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder.svg"; }}
          />
          <div className="absolute top-4 left-4">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              {institution.category || "N/A"}
            </span>
          </div>
          <div className="absolute top-4 right-4">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-bold text-gray-900">
              {averageRating}
            </span>
            <span className="text-xs text-gray-500 font-medium ml-0.5">
              ({reviewCount})
            </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-600 font-medium">
              Est. {institution.established || "N/A"}
            </span>
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{institution.totalStudents?.toLocaleString() || "0"}</span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {institution.name || "Unknown Institution"}
          </h3>

          <div className="flex items-center space-x-1 text-gray-600 mb-3">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{institution.city || "Location N/A"}</span>
          </div>

          <p className="text-gray-600 text-sm mb-4">
            Specializing in {institution.specialization || "General"}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {(institution.features || []).slice(0, 2).map((feature, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                {feature}
              </span>
            ))}
            {(institution.features || []).length > 2 && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                +{institution.features.length - 2} more
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                </a>
              )}
            </div>
            <Link
              to={`/institutions/${institution._id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-1"
            >
              <Award className="h-4 w-4" />
              <span>View Details</span>
            </Link>
          </div>
        </div>
      </div>
      
    )
  }
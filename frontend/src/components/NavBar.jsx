"use client"
import React from "react";
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { BookOpen, Menu, X, User, LogOut } from "lucide-react"
import logo from '../assets/padhai-on_logo.jpg';

export default function Navbar({ user, setUser }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem("padhaiOn_user")
    localStorage.removeItem("padhaiOn_token")
    setUser(null)
    setShowUserMenu(false)
  }

  const isActive = (path) => location.pathname === path

  const getDashboardLink = () => {
    if (!user) return null
    switch (user.userType) {
      case "admin":
        return { path: "/admin-dashboard", label: "Admin Dashboard" }
      case "institution":
        return { path: "/institution-dashboard", label: "Institution Dashboard" }
      case "student":
        return { path: "/student-dashboard", label: "My Dashboard" }
      default:
        return null
    }
  }

  const dashboardLink = getDashboardLink()

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/institutions", label: "Institutions" },
    { path: "/career-library", label: "Career Library" },
    { path: "/about", label: "About" },
    { path: "/blog", label: "Blog" },
    { path: "/contact", label: "Contact" },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src={logo}
              alt="PadhaiOn Logo"
              className="h-auto w-24 object-contain"
            />
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(link.path) ? "text-blue-600 bg-blue-50" : ""
                  }`}
              >
                {link.label}
              </Link>
            ))}
            {dashboardLink && (
              <Link
                to={dashboardLink.path}
                className={`text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(dashboardLink.path) ? "text-blue-600 bg-blue-50" : ""
                  }`}
              >
                {dashboardLink.label}
              </Link>
            )}
            {/* Only show Book Consultation for students and non-logged-in users */}
            {(!user || user.userType === "student") && (
              <Link
                to="/book-consultation"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Book Consultation
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">{user.name}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-xs text-gray-500">Logged in as</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{user.userType}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 inline mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Login
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 hover:text-blue-600">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive(link.path)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {dashboardLink && (
                <Link
                  to={dashboardLink.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive(dashboardLink.path)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                  onClick={() => setIsOpen(false)}
                >
                  {dashboardLink.label}
                </Link>
              )}
              <Link
                to="/book-consultation"
                className="block bg-blue-600 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Book Consultation
              </Link>
              {user ? (
                <>
                  <div className="px-3 py-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Logged in as</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{user.userType}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

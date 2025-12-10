import React from 'react';
import { Users, Target, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

import rajImg from '../assets/Raj-Image-crop-2.jpg'; 
import vimalImg from '../assets/Vimal-img-crop.jpg'; 
import shrutiImg from '../assets/shruti-img-crop.jpg'; 

const TeamMember = ({ name, role, description, image, linkedin, email }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300 border border-gray-100">
    <div className="w-32 h-32 mb-6 relative">
      <div className="absolute inset-0 bg-blue-600 rounded-full opacity-10 blur-md transform translate-x-1 translate-y-1"></div>
      <img 
        src={image} 
        alt={name} 
        className="w-full h-full object-cover rounded-full border-4 border-white shadow-md relative z-10"
      />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-1">{name}</h3>
    <p className="text-blue-600 font-medium mb-3">{role}</p>
    <p className="text-gray-600 text-sm mb-4">{description}</p>
    
    {/* 🚀 Social Links Section */}
    <div className="flex gap-3 mt-auto">
      {/* LinkedIn Link */}
      <a 
        href={linkedin} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
        aria-label="LinkedIn Profile"
      >
        <Linkedin className="w-5 h-5" />
      </a>
      
      {/* Email Link (mailto) */}
      <a 
        href={`mailto:${email}`} 
        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
        aria-label="Send Email"
      >
        <Mail className="w-5 h-5" />
      </a>
    </div>
  </div>
);

export default function AboutUs() {
  const team = [
    {
      name: "Vimal Majithiya",
      role: "Founder & Owner",
      description: "The visionary behind PadhaiOn. With years of experience in the education sector, Vimal is dedicated to guiding students toward their dream careers.",
      image: vimalImg,
      // 🚀 ADD ACTUAL LINKS HERE
      linkedin: "//linkedin.com/in/vimal-m-80705591", 
      email: "padhaion@gmail.com"
    },
    {
      name: "Raj Purohit",
      role: "Lead Developer",
      description: "The technical architect of the PadhaiOn platform. Passionate about building seamless digital experiences that connect students with opportunities.",
      image: rajImg,
      // 🚀 ADD ACTUAL LINKS HERE
      linkedin: "//linkedin.com/in/raj-purohit-2b4105285", 
      email: "rajpurohit7474747@gmail.com"
    },
    {
      name: "Shruti Dabhi",
      role: "Frontend Developer",
      description: "The creative mind behind our user interface. Ensures that PadhaiOn is not just functional, but beautiful and easy to use for everyone.",
      image: shrutiImg,
      // 🚀 ADD ACTUAL LINKS HERE
      linkedin: "//linkedin.com/in/shruti-dabhi-79234b308", 
      email: "shrutidabhi59@gmail.com"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Mission Section */}
      <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              At PadhaiOn, we believe every student deserves the right guidance to unlock their full potential. We bridge the gap between ambitious learners and top-tier educational institutions.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Target className="w-6 h-6" /></div>
                <div>
                  <h4 className="font-bold text-gray-900">Expert Consultancy</h4>
                  <p className="text-gray-600 text-sm">Personalized advice tailored to your goals.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Users className="w-6 h-6" /></div>
                <div>
                  <h4 className="font-bold text-gray-900">Student-First Approach</h4>
                  <p className="text-gray-600 text-sm">Your future is our top priority.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600 rounded-2xl transform rotate-3 opacity-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
              alt="Team collaboration" 
              className="relative rounded-2xl shadow-xl w-full object-cover h-80"
            />
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">The passionate professionals dedicated to building the best platform for your career journey.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {team.map((member, index) => (
              <TeamMember key={index} {...member} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Start Your Journey?</h2>
          <p className="text-blue-100 mb-8 text-lg">Connect with us today and let's build your future together.</p>
          <Link to="/contact" className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg inline-block">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
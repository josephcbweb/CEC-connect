import React from "react";
import Logo from "../assets/logo.png";
import { Link } from "react-router-dom";

export const Landing = () => {
  return (
    <div className="flex flex-col gap-10">
      <nav className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-4 sticky top-0 z-50 bg-white">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <img src={Logo} alt="College Logo" className="h-10 w-10" />
          <h1 className="text-xl sm:text-2xl font-bold text-[#3AA9AB]">
            <span className="text-2xl sm:text-3xl font-semibold text-[#3AA9AB]">
              CEC
            </span>
            connect
          </h1>
        </div>

        <ul className="flex flex-wrap justify-center gap-6 sm:gap-10 font-medium text-[#031D44]">
          <li className="hover:text-[#3AA9AB] cursor-pointer">Home</li>
          <li className="hover:text-[#3AA9AB] cursor-pointer">About</li>
          <li className="hover:text-[#3AA9AB] cursor-pointer">Departments</li>
          <li className="hover:text-[#3AA9AB] cursor-pointer">Contact</li>
        </ul>

        <ul className="flex gap-6 sm:gap-10 font-medium text-[#031D44] mt-4 sm:mt-0">
          <li>
            <Link to="/signup" className="hover:text-[#3AA9AB] cursor-pointer">
              Sign up
            </Link>
          </li>
          <li className="hover:text-[#3AA9AB] cursor-pointer">Log in</li>
        </ul>
      </nav>

      <h1 className="text-2xl sm:text-4xl text-center text-[#031D44] px-4">
        A Smarter Way To Manage Your College
      </h1>

      <p className="text-center text-base sm:text-lg px-4 sm:px-20">
        Acads is a comprehensive college management dashboard that simplifies
        administration, connects departments, and brings the entire campus onto
        one platform.
      </p>

      <div className="flex justify-center mt-6 sm:mt-10">
        <button
          className="w-40 sm:w-48 h-12 sm:h-20 bg-[#031D44] text-white border-4 sm:border-8 rounded-2xl 
                           hover:bg-[#F8F8F8] hover:text-black transition-colors duration-300"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

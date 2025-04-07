"use client";
import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { HiMenu, HiUser, HiLogout } from "react-icons/hi";
import { signOut, useSession } from "next-auth/react";

const Header = ({ toggleSidebar, toggleCollapse, isCollapsed = true }) => {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { data: session } = "";

  // Get page title based on current path
  const getPageTitle = () => {
    switch (pathname) {
      default:
        return "Penilaian Sejawat";
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 lg:hidden hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              onClick={toggleSidebar}
            >
              <HiMenu size={24} />
            </button>
          </div>

          {/* Title */}
          <div className="flex-1 flex justify-center lg:justify-start">
            <h1 className="text-xl font-semibold text-gray-800">
              {getPageTitle()}
            </h1>
          </div>

          {/* User profile dropdown */}
          <div className="ml-4 flex items-center md:ml-6">
            <div className="relative" ref={dropdownRef}>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 text-sm hover:bg-gray-200 transition-colors focus:outline-none cursor-pointer"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="hidden md:block text-gray-700 font-medium">
                  {session?.user.name || "User"}
                </span>
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm">
                  <span className="font-medium">
                    {session?.user.name ? session?.user.name.charAt(0) : "..."}
                  </span>
                </div>
              </div>

              {/* Enhanced Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200 ease-in-out">
                  <div className="px-4 py-3 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        <span className="text-lg font-medium">
                          {session?.user.name
                            ? session?.user.name.charAt(0)
                            : "..."}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {session?.user.name || "User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {session?.user.email}
                        </p>
                        <p className="text-xs font-medium text-blue-600 mt-1">
                          {session?.user.role || "User"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <HiLogout className="text-gray-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

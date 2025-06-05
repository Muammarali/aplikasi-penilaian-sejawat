"use client";
import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { HiMenu, HiUser, HiLogout } from "react-icons/hi";
import { IoLogOut } from "react-icons/io5";
import { RiAdminLine } from "react-icons/ri";
import { signOut, useSession } from "next-auth/react";

const Header = ({ toggleSidebar, toggleCollapse, isCollapsed = true }) => {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { data: session } = useSession();

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

  const getUserInitials = (name) => {
    if (!name) return "?";
    const names = name.trim().split(/\s+/);
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  };

  const getRoleColorClass = (role) => {
    switch (role) {
      case "Admin":
        return "bg-red-500";
      case "Dosen":
        return "bg-green-500";
      case "Mahasiswa":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Dosen":
        return "bg-green-100 text-green-800";
      case "Mahasiswa":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
                  {session?.user.nama || "..."}
                </span>
                <div
                  className={`h-8 w-8 rounded-full ${getRoleColorClass(
                    session?.user?.role
                  )} flex items-center justify-center text-white shadow-sm`}
                >
                  <span className="font-medium text-sm">
                    {getUserInitials(session?.user?.nama)}
                  </span>
                </div>
              </div>

              {/* Enhanced Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200 ease-in-out overflow-hidden">
                  <div className="px-4 py-2 pb-4 border-b">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`h-10 min-w-10 rounded-full ${getRoleColorClass(
                          session?.user?.role
                        )} flex items-center justify-center text-white`}
                      >
                        <span className="font-medium text-lg">
                          {getUserInitials(session?.user?.nama)}
                        </span>
                      </div>
                      <div className="w-full overflow-hidden text-ellipsis">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session?.user.nama || "..."}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {session?.user.email}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleBadgeClass(
                            session?.user?.role
                          )}`}
                        >
                          <RiAdminLine className="mr-1" size={10} />
                          {session?.user?.role || "Loading..."}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 flex items-center gap-1 hover:bg-zinc-200 transition"
                  >
                    <IoLogOut size={20} className="text-zinc-600" />
                    <span>Logout</span>
                  </button>
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

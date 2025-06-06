"use client";
import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiDashboardLine, RiAdminLine } from "react-icons/ri";
import { BiTask } from "react-icons/bi";
import {
  LuUsers,
  LuBookOpen,
  LuSettings,
  LuClock,
  LuBell,
} from "react-icons/lu";
import { HiAcademicCap } from "react-icons/hi";
import { useSession } from "next-auth/react";

// Constants untuk menu navigasi
const NAVIGATION_ITEMS = [
  {
    name: "Home",
    href: "/",
    subpaths: ["/"],
    icon: <RiDashboardLine size={22} />,
    roles: ["Admin", "Mahasiswa", "Dosen"],
  },
  {
    name: "Mata Kuliah",
    href: "/matakuliah",
    subpaths: ["/matakuliah"],
    icon: <LuBookOpen size={22} />,
    roles: ["Dosen", "Mahasiswa"],
  },
  // Menu khusus Admin
  {
    name: "Kelola Pengguna",
    href: "/admin/users",
    subpaths: ["/admin/users/new", "/admin/users/edit", "/admin/users/view"],
    icon: <LuUsers size={22} />,
    roles: ["Admin"],
  },
  {
    name: "Kelola Dosen & MK",
    href: "/admin/dosen-matakuliah",
    subpaths: [
      "/admin/dosen-matakuliah/assign",
      "/admin/dosen-matakuliah/view",
    ],
    icon: <HiAcademicCap size={22} />,
    roles: ["Admin"],
  },
];

const Sidebar = ({
  isOpen,
  toggleSidebar,
  isCollapsed = false,
  setIsCollapsed,
}) => {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Get user initials like in header
  const getUserInitials = (name) => {
    if (!name) return "?";
    const names = name.trim().split(/\s+/);
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  };

  // Get role color class like in header
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

  // Get role badge class like in header
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

  // Function to toggle collapsed state
  const handleToggleCollapse = () => {
    if (setIsCollapsed) {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Memoize filtered navigation untuk optimasi performa
  const filteredNavigation = useMemo(() => {
    const userRole = session?.user?.role;
    if (!userRole) return [];

    return NAVIGATION_ITEMS.filter((item) => item.roles.includes(userRole));
  }, [session?.user?.role]);

  // Fungsi untuk menentukan apakah menu aktif berdasarkan path
  const isMenuActive = (item) => {
    // Exact match untuk halaman utama "/"
    if (item.href === "/" && pathname === "/") return true;

    // Untuk path lain, cek exact match terlebih dahulu
    if (pathname === item.href) return true;

    // Cek untuk sub-path, tapi skip jika item.href adalah "/"
    if (item.subpaths?.length > 0 && item.href !== "/") {
      return item.subpaths.some((subpath) => {
        // Exact match untuk subpath
        if (pathname === subpath) return true;

        // StartsWith check untuk nested paths (misal: /admin/users/123)
        // Tapi pastikan tidak konflik dengan root path
        return (
          pathname.startsWith(subpath + "/") ||
          pathname.startsWith(item.href + "/")
        );
      });
    }

    // Untuk non-root paths, cek jika pathname dimulai dengan href + "/"
    // Ini untuk menangani nested routes seperti /admin/users/edit/123
    if (item.href !== "/" && pathname.startsWith(item.href + "/")) {
      return true;
    }

    return false;
  };

  // Component untuk menu item
  const MenuItem = ({ item, isMobile = false }) => {
    const isActive = isMenuActive(item);

    return (
      <Link
        key={item.name}
        href={item.href}
        className={`group flex mb-2 items-center ${
          isCollapsed && !isMobile ? "justify-center" : ""
        }         px-3 py-3 text-lg font-medium rounded-lg transition-all duration-200 relative ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`}
        title={isCollapsed && !isMobile ? item.name : ""}
        onClick={() => {
          if (isMobile && window.innerWidth < 1024) {
            toggleSidebar();
          }
        }}
      >
        <div
          className={`${isCollapsed && !isMobile ? "" : "mr-3"} ${
            isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
          } transition-colors duration-200`}
        >
          {item.icon}
        </div>
        {(!isCollapsed || isMobile) && (
          <span className="truncate">{item.name}</span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 right-0 z-30 bg-white shadow-lg transform transition-transform ease-in-out duration-300 lg:hidden ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-blue-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">P</span>
            </div>
            <div className="pt-1">
              <p className="text-xs text-white">Aplikasi</p>
              <p className="text-lg text-white font-semibold">
                Penilaian Sejawat
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-2 text-white hover:text-blue-100 hover:bg-blue-700 rounded-lg focus:outline-none transition-colors"
            onClick={toggleSidebar}
            aria-label="Tutup menu"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="p-4 space-y-1 max-h-screen overflow-y-auto pb-8">
          {filteredNavigation.map((item) => (
            <MenuItem key={item.name} item={item} isMobile={true} />
          ))}
        </nav>
      </div>

      {/* Desktop Sidebar - FIXED POSITION */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div
          className={`fixed top-0 left-0 h-screen flex flex-col ${
            isCollapsed ? "w-16" : "w-64"
          } bg-white border-r border-gray-200 transition-all duration-300 z-20`}
        >
          {/* Header/Logo Section */}
          <div className="flex items-center justify-start h-16 px-3 pt-2 flex-shrink-0 bg-white">
            {isCollapsed ? (
              // Logo only when collapsed
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white text-lg">P</span>
              </div>
            ) : (
              // Full logo + text when expanded
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-white text-lg">P</span>
                </div>
                <div className="pt-1">
                  <p className="text-xs">Aplikasi</p>
                  <p className="text-lg font-semibold">Penilaian Sejawat</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col flex-grow overflow-hidden">
            {/* Menu Label */}
            <div className="px-4 py-3">
              {!isCollapsed ? (
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Menu
                </h3>
              ) : (
                <div className="text-center">
                  <span className="text-xs font-semibold text-gray-400">
                    •••
                  </span>
                </div>
              )}
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
              {filteredNavigation.map((item) => (
                <MenuItem key={item.name} item={item} />
              ))}
            </nav>

            {/* Bottom Information Panel */}
            <div className="border-t border-gray-100 flex-shrink-0">
              {/* Toggle Button */}
              <div className="p-3 border-b border-gray-100">
                <button
                  type="button"
                  className={`w-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none transition-colors flex items-center ${
                    isCollapsed ? "justify-center" : "justify-center"
                  }`}
                  onClick={handleToggleCollapse}
                  title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <svg
                    className={`h-4 w-4 transform transition-transform duration-200 ${
                      isCollapsed ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  </svg>
                  {!isCollapsed && (
                    <span className="ml-1 text-sm">Collapse</span>
                  )}
                </button>
              </div>

              {/* User Information - Expanded */}
              {!isCollapsed && session?.user && (
                <div className="p-4 space-y-2">
                  {/* User Avatar & Info - Same style as header */}
                  <div className="flex items-center space-x-3">
                    <div
                      className={`h-10 w-10 rounded-full ${getRoleColorClass(
                        session.user.role
                      )} flex items-center justify-center text-white shadow-sm`}
                    >
                      <span className="font-medium text-sm">
                        {getUserInitials(session.user.nama)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session.user.nama || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* User Information - Collapsed */}
              {isCollapsed && session?.user && (
                <div className="p-3 flex justify-center items-center">
                  <div
                    className={`h-10 w-10 rounded-full ${getRoleColorClass(
                      session.user.role
                    )} flex items-center justify-center text-white shadow-sm`}
                    title={`${session.user.nama || session.user.email}\n${
                      session.user.email
                    }\n${session.user.role}`}
                  >
                    <span className="font-medium text-sm">
                      {getUserInitials(session.user.nama)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

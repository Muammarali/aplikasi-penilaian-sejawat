"use client";
import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiDashboardLine, RiAdminLine } from "react-icons/ri";
import { BiTask } from "react-icons/bi";
import { LuUsers, LuBookOpen, LuSettings } from "react-icons/lu";
import { HiAcademicCap } from "react-icons/hi";
import { useSession } from "next-auth/react";

// Constants untuk menu navigasi
const NAVIGATION_ITEMS = [
  {
    name: "Home",
    href: "/",
    subpaths: ["/"],
    icon: <RiDashboardLine size={24} className="ml-1" />,
    roles: ["Admin", "Mahasiswa", "Dosen"],
  },
  {
    name: "Mata Kuliah",
    href: "/matakuliah",
    subpaths: ["/matakuliah"],
    icon: <LuBookOpen size={24} className="ml-1" />,
    roles: ["Dosen", "Mahasiswa"],
  },
  // Menu khusus Admin
  {
    name: "Kelola Pengguna",
    href: "/admin/users",
    subpaths: ["/admin/users/new", "/admin/users/edit", "/admin/users/view"],
    icon: <LuUsers size={24} className="ml-1" />,
    roles: ["Admin"],
  },
  {
    name: "Kelola Dosen & MK",
    href: "/admin/dosen-matakuliah",
    subpaths: [
      "/admin/dosen-matakuliah/assign",
      "/admin/dosen-matakuliah/view",
    ],
    icon: <HiAcademicCap size={24} className="ml-1" />,
    roles: ["Admin"],
  },
];

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed = false }) => {
  const pathname = usePathname();
  const { data: session } = useSession();

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
        className={`group flex items-center ${
          isCollapsed && !isMobile ? "justify-center" : ""
        } px-2 py-2 text-${
          isMobile ? "md" : "lg"
        } font-medium rounded-md transition-colors duration-200 ${
          isActive
            ? "bg-blue-50 text-blue-500"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
            isActive
              ? "text-blue-500"
              : "text-gray-400 group-hover:text-gray-500"
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
        className={`fixed top-0 left-0 right-0 z-30 bg-white shadow-lg rounded-b-2xl transform transition-transform ease-in-out duration-300 lg:hidden ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="text-xl font-semibold text-blue-500">
            Penilaian Sejawat
          </div>
          <button
            type="button"
            className="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
            onClick={toggleSidebar}
            aria-label="Tutup menu"
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="mt-5 px-2 space-y-1 max-h-screen overflow-y-auto pb-8">
          {/* Role Badge untuk Mobile */}
          {/* {session?.user?.role && (
            <div className="mb-4 px-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  session.user.role === "Admin"
                    ? "bg-red-100 text-red-800"
                    : session.user.role === "Dosen"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                <RiAdminLine className="mr-1" size={12} />
                {session.user.role}
              </span>
            </div>
          )} */}

          {filteredNavigation.map((item) => (
            <MenuItem key={item.name} item={item} isMobile={true} />
          ))}
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ease-in-out">
        <div
          className={`flex flex-col ${
            isCollapsed ? "w-16" : "w-64"
          } border-r border-gray-200 bg-white transition-all duration-300`}
        >
          {/* Header dengan Role Badge */}
          {/* {!isCollapsed && (
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
              <div className="text-xl font-semibold text-blue-500">
                Penilaian Sejawat
              </div>
            </div>
          )} */}

          <div className="flex flex-col flex-grow overflow-y-auto">
            {/* Role Badge untuk Desktop */}
            {/* {session?.user?.role && !isCollapsed && (
              <div className="mt-4 px-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    session.user.role === "Admin"
                      ? "bg-red-100 text-red-800"
                      : session.user.role === "Dosen"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  <RiAdminLine className="mr-1" size={12} />
                  {session.user.role}
                </span>
              </div>
            )} */}

            <nav className="mt-5 flex-1 px-2 space-y-1">
              {filteredNavigation.map((item) => (
                <MenuItem key={item.name} item={item} />
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

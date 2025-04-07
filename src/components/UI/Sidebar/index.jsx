"use client";
import React, { ReactElement, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiDashboardLine } from "react-icons/ri";
import { BiTask } from "react-icons/bi";
import { LuUsers } from "react-icons/lu";

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed = false }) => {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Mata Kuliah",
      href: "/matakuliah",
      subpaths: ["/matakuliah"],
      icon: <RiDashboardLine size={24} className="ml-1" />,
    },
    {
      name: "Daftar Kelas",
      href: "/daftarkelas",
      subpaths: ["/daftarkelas/new", "/daftarkelas/edit", "/daftarkelas/view"],
      icon: <BiTask size={24} className="ml-1" />,
    },
  ];

  // Fungsi untuk menentukan apakah menu aktif berdasarkan path
  const isMenuActive = (item) => {
    if (pathname === item.href) return true;

    // Cek juga untuk sub-path
    if (item.subpaths) {
      return item.subpaths.some(
        (subpath) =>
          pathname.startsWith(subpath) ||
          (item.href !== "/" && pathname.startsWith(item.href))
      );
    }

    // Khusus untuk Dashboard, cek apakah root path
    if (item.href === "/" && pathname === "/") return true;

    return false;
  };

  return (
    <>
      {/* Sidebar for mobile - Coming from top */}
      <div
        className={`fixed top-0 left-0 right-0 z-30 bg-white shadow-lg rounded-b-2xl transform transition-transform ease-in-out duration-300 lg:hidden ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="text-xl font-semibold text-blue-600">
            Penilaian Sejawat
          </div>
          <button
            type="button"
            className="ml-4 text-gray-500 focus:outline-none focus:text-gray-700"
            onClick={toggleSidebar}
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
          {navigation.map((item) => {
            const isActive = isMenuActive(item);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-md font-medium rounded-md ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    toggleSidebar();
                  }
                }}
              >
                <div
                  className={`mr-3 ${
                    isActive
                      ? "text-blue-600"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                >
                  {item.icon}
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar for desktop - collapsed or expanded */}
      <div
        className={`hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ease-in-out`}
      >
        <div
          className={`flex flex-col ${
            isCollapsed ? "w-16" : "w-64"
          } border-r border-gray-200 bg-white transition-all duration-300`}
        >
          {/* <div className="flex items-center h-16 px-4 border-b border-gray-200">
                        {!isCollapsed && (
                            <div className="text-xl font-semibold text-blue-600">Todo App</div>
                        )}
                        {isCollapsed && (
                            <div className="w-full flex justify-center">
                            </div>
                        )}
                    </div> */}
          <div className="flex flex-col flex-grow overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = isMenuActive(item);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center ${
                      isCollapsed ? "justify-center" : ""
                    } px-2 py-2 text-lg font-medium rounded-md ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    title={isCollapsed ? item.name : ""}
                  >
                    <div
                      className={`${isCollapsed ? "" : "mr-3"} ${
                        isActive
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    >
                      {item.icon}
                    </div>
                    {!isCollapsed && item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

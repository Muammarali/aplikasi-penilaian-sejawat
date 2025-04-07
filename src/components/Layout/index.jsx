"use client";
import React, { useState, useEffect, ReactNode } from "react";
import Header from "../UI/Header";
import Sidebar from "../UI/Sidebar";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    mounted && (
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} />

        {/* Overlay untuk mobile saat sidebar terbuka */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-transparent bg-opacity-50 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Ketika screen mobile sidebar muncul dari atas */}
        <div
          className={`fixed top-0 left-0 right-0 z-30 bg-white shadow-lg transform transition-transform ease-in-out duration-300 lg:hidden ${
            sidebarOpen ? "translate-y-0" : "-translate-y-full"
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
        </div>

        <div className="flex flex-1">
          {/* Bagian sidebar */}
          <Sidebar
            isOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
            isCollapsed={isCollapsed}
          />

          {/* Main content akan ditampilkan di bagian ini */}
          <main className="flex-1 p-6 lg:ml-0">{children}</main>
        </div>
      </div>
    )
  );
};

export default Layout;

"use client";
import React, { useState } from "react";
import { IoSearch } from "react-icons/io5";

const RekapNilaiMahasiswa = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const students = [
    { npm: "6181901090", nama: "Faisal Surya Pratama", hasil: 88 },
    { npm: "6181901091", nama: "Irysad Hanif Sjahbandi", hasil: 86 },
    { npm: "6181901091", nama: "Irsad Fadlurohman", hasil: 86 },
    { npm: "6181901091", nama: "Alexander Jose", hasil: 86 },
    { npm: "6181901091", nama: "Michael Yoga", hasil: 86 },
    { npm: "6181901091", nama: "Yoga Ananta", hasil: 86 },
  ];

  const filteredStudents = students.filter(
    (student) =>
      student.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.npm.includes(searchTerm)
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="bg-blue-500 text-white px-6 py-4 rounded-t-lg">
          <h1 className="text-xl font-semibold">Rekap Form Sebelum UTS</h1>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Filter Cari"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  NPM
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Nama
                </th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">
                  Hasil Penilaian
                </th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {student.npm}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {student.nama}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {student.hasil}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-blue-500 hover:text-blue-700 hover:underline font-medium text-sm transition-colors">
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada data yang ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RekapNilaiMahasiswa;

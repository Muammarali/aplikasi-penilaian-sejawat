"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";

const DaftarKelompok = () => {
  const [dataKelompok, setDataKelompok] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("daftar-kelompok");
  const params = useParams();
  const router = useRouter();

  function restoreSpace(text) {
    return text.replace(/-/g, " ");
  }

  const fetchKelompok = async () => {
    try {
      const response = await axios.post("/api/daftarkelompok/fetch", {
        matkul: restoreSpace(params.matkul),
      });

      const data = response.data.rows;
      console.log(response.data.rows);
      setDataKelompok(data);
    } catch (error) {
      console.error("Error fetching mata kuliah:", error);
    }
  };

  useEffect(() => {
    fetchKelompok();
  }, []);

  // Filtering logic
  const filteredDaftarKelompok = dataKelompok.filter((daftarKelompok) => {
    const matchesSearch = daftarKelompok?.nama_kelompok
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Logic untuk Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDaftarKelompok = filteredDaftarKelompok.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredDaftarKelompok.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Tab rendering logic
  const renderTabContent = () => {
    switch (activeTab) {
      case "daftar-kelompok":
        return (
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-[2fr_3fr_2fr] gap-4 px-4 py-3 bg-emerald-600 rounded-md font-semibold text-zinc-100 text-sm">
              <div className="truncate whitespace-nowrap">Kelompok</div>
              <div className="truncate whitespace-nowrap">Jumlah Anggota</div>
              <div className="truncate whitespace-nowrap">Aksi</div>
            </div>

            <ul className="space-y-2">
              {currentDaftarKelompok.map((daftarKelompok) => (
                <li
                  key={daftarKelompok?.id_kelompok}
                  className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="grid grid-cols-[2fr_3fr_2fr] gap-4 items-center">
                    <div className="text-sm text-gray-800">
                      {daftarKelompok?.nama_kelompok}
                    </div>
                    <div className="text-sm text-gray-800">
                      {daftarKelompok?.jumlah_anggota} /{" "}
                      {daftarKelompok?.kapasitas} anggota
                    </div>
                    <div>
                      <button className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-all text-sm">
                        Lihat
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination Component */}
            {filteredDaftarKelompok.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                paginate={paginate}
                indexOfFirstItem={indexOfFirstItem}
                indexOfLastItem={indexOfLastItem}
                data={filteredDaftarKelompok}
              />
            )}
          </div>
        );
      case "form-penilaian":
        return (
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-[2fr_3fr_2fr] gap-4 px-4 py-3 bg-emerald-600 rounded-md font-semibold text-zinc-100 text-sm">
              <div className="truncate whitespace-nowrap">Nama Form</div>
              <div className="truncate whitespace-nowrap">Jenis Form</div>
              <div className="truncate whitespace-nowrap">Aksi</div>
            </div>

            <ul className="space-y-2">
              {currentDaftarKelompok.map((daftarKelompok) => (
                <li
                  key={daftarKelompok?.id_kelompok}
                  className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="grid grid-cols-[2fr_3fr_2fr] gap-4 items-center">
                    <div className="text-sm text-gray-800">
                      {daftarKelompok?.nama_kelompok}
                    </div>
                    <div className="text-sm text-gray-800">
                      {daftarKelompok?.jumlah_anggota} /{" "}
                      {daftarKelompok?.kapasitas} anggota
                    </div>
                    <div className="space-x-2">
                      <button className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-all text-sm">
                        Edit
                      </button>
                      <button className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-all text-sm">
                        Hapus
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination Component */}
            {filteredDaftarKelompok.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                paginate={paginate}
                indexOfFirstItem={indexOfFirstItem}
                indexOfLastItem={indexOfLastItem}
                data={filteredDaftarKelompok}
              />
            )}
          </div>
          //   <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          //     <h2 className="text-lg font-semibold mb-4">Form Penilaian</h2>
          //     <p className="text-gray-600">
          //       Form penilaian untuk kelompok mata kuliah{" "}
          //       {restoreSpace(params.matkul)}
          //     </p>
          //     {/* Form penilaian content would go here */}
          //     <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
          //       <p className="text-sm text-gray-500">
          //         Form penilaian belum tersedia
          //       </p>
          //     </div>
          //   </div>
        );
      case "rekap-nilai":
        return (
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Rekap Nilai</h2>
            <p className="text-gray-600">
              Rekap nilai untuk mata kuliah {restoreSpace(params.matkul)}
            </p>
            {/* Rekap nilai content would go here */}
            <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-sm text-gray-500">
                Data rekap nilai belum tersedia
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full lg:max-w-6xl">
      <div className="min-w-96 space-y-4">
        <div className="text-2xl font-bold">{restoreSpace(params.matkul)}</div>

        {/* Tab Bar */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("daftar-kelompok")}
              className={`py-3 px-4 text-sm transition-colors border-b-2 ${
                activeTab === "daftar-kelompok"
                  ? "border-emerald-600 font-bold text-emerald-600"
                  : "border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Daftar Kelompok
            </button>
            <button
              onClick={() => setActiveTab("form-penilaian")}
              className={`py-3 px-4 text-sm transition-colors border-b-2 ${
                activeTab === "form-penilaian"
                  ? "border-emerald-600 font-bold text-emerald-600"
                  : "border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Form Penilaian
            </button>
            <button
              onClick={() => setActiveTab("rekap-nilai")}
              className={`py-3 px-4 text-sm transition-colors border-b-2 ${
                activeTab === "rekap-nilai"
                  ? "border-emerald-600 font-bold text-emerald-600"
                  : "border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Rekap Nilai
            </button>
          </nav>
        </div>

        {/* Show search box only for Daftar Kelompok tab */}
        {/* {activeTab === "daftar-kelompok" && (
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Cari nama kelompok"
              className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 focus:outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        )} */}

        {/* Title based on active tab */}
        <div className="text-xl font-bold p-0 m-0">
          {activeTab === "daftar-kelompok" && "Daftar Kelompok"}
          {activeTab === "form-penilaian" && "Form Penilaian Sejawat"}
          {activeTab === "rekap-nilai" && "Rekap Nilai"}
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
  paginate,
  indexOfFirstItem,
  indexOfLastItem,
  data,
}) => {
  const generatePageNumbers = () => {
    const pageNumbers = [];

    if (totalPages <= 5) {
      pageNumbers.push(...Array.from({ length: totalPages }, (_, i) => i + 1));
    } else {
      pageNumbers.push(1);

      if (currentPage > 3) pageNumbers.push("...");

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      pageNumbers.push(
        ...Array.from(
          { length: endPage - startPage + 1 },
          (_, i) => startPage + i
        )
      );

      if (currentPage < totalPages - 2) pageNumbers.push("...");

      if (totalPages > 1) pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-0 py-4 border-t border-gray-200 mt-6">
      <div className="text-sm text-gray-500 mb-3 sm:mb-0">
        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> -{" "}
        <span className="font-medium">
          {Math.min(indexOfLastItem, data.length)}
        </span>{" "}
        of <span className="font-medium">{data.length}</span> results
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="text-center inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Prev
        </button>

        <div className="hidden md:flex space-x-1">
          {generatePageNumbers().map((number, index) => (
            <button
              key={index}
              onClick={() => typeof number === "number" && paginate(number)}
              disabled={number === "..."}
              className={`text-center inline-flex items-center justify-center w-8 h-8 text-sm font-medium rounded-md ${
                currentPage === number
                  ? "z-10 bg-emerald-600 text-white border-emerald-600"
                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              } ${number === "..." ? "cursor-default" : ""}`}
            >
              {number}
            </button>
          ))}
        </div>

        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="text-center inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DaftarKelompok;

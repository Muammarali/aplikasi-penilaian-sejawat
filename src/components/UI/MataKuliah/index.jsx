"use client";
import { useState, useEffect } from "react";
import axios from "axios";

const MataKuliah = () => {
  const [dataMataKuliah, setDataMataKuliah] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchMatkul = async () => {
    try {
      const response = await axios.get("/api/matakuliah/fetch");
      const data = response.data.data.rows;
      setDataMataKuliah(data);
    } catch (error) {
      console.error("Error fetching mata kuliah:", error);
    }
  };

  useEffect(() => {
    fetchMatkul();
  }, []);

  // Filtering logic
  const filteredMatkul = dataMataKuliah.filter((matkul) => {
    const matchesSearch =
      matkul?.kode_mk?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matkul?.nama?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Logic untuk Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMatkul = filteredMatkul.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMatkul.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="w-5xl">
      <div className="min-w-96 space-y-4">
        <div className="text-2xl font-bold">Daftar Mata Kuliah</div>

        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Cari kode/nama mata kuliah"
            className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 focus:outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {true && (
            <button
              // onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              {/* <AiOutlineClose /> */}
            </button>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-emerald-400 rounded-md font-semibold text-zinc-800 text-sm">
            <div>Kode Mata Kuliah</div>
            <div>Nama</div>
            <div>Kelas</div>
            <div>Aksi</div>
          </div>

          <ul className="space-y-2">
            {currentMatkul.map((matkul) => (
              <li
                key={matkul?.id_mk}
                className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="text-sm text-gray-800">{matkul?.kode_mk}</div>
                  <div className="text-sm text-gray-800">{matkul?.nama}</div>
                  <div className="text-sm text-gray-800">{matkul?.kelas}</div>
                  <div>
                    {/* Ganti dengan aksi yang kamu inginkan, contoh: */}
                    <button className="text-sm text-blue-600 hover:underline">
                      Gabung
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination Component */}
          {filteredMatkul.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              paginate={paginate}
              indexOfFirstItem={indexOfFirstItem}
              indexOfLastItem={indexOfLastItem}
              data={filteredMatkul}
            />
          )}
        </div>
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
                  ? "z-10 bg-emerald-500 text-white border-emerald-500"
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

export default MataKuliah;

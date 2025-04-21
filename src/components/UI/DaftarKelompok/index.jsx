"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";

const DaftarKelompok = () => {
  const [dataKelompok, setDataKelompok] = useState([]);
  const [formPenilaian, setFormPenilaian] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("daftar-kelompok");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_kelompok: "",
    kapasitas: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  function parseMatkulParam(slug) {
    const parts = slug.split("-");
    const id_mk = parts.pop();
    const kelas = parts.pop();
    const nama_matkul = parts.join(" ");
    return { nama_matkul, kelas, id_mk };
  }

  const fetchKelompok = async () => {
    try {
      const { nama_matkul, kelas, id_mk } = parseMatkulParam(params.matkul);

      const response = await axios.post("/api/daftarkelompok/fetch", {
        nama_matkul,
        kelas,
        id_mk,
        id_user: session?.user?.id_user,
      });

      if (!response.data.success) {
        router.push("/daftarkelas");
        return;
      }

      const data = response.data.rows;
      setDataKelompok(data);
    } catch (error) {
      console.error("Error on route", error);
      router.push("/daftarkelas");
    }
  };

  const fetchFormPenilaian = async () => {
    try {
      const { nama_matkul, kelas, id_mk } = parseMatkulParam(params.matkul);

      const response = await axios.post("/api/formpenilaian/fetch", {
        nama_matkul,
        kelas,
        id_mk,
        id_user: session?.user?.id_user,
      });

      const data = response.data.data.rows;
      setFormPenilaian(data);
    } catch (error) {
      console.error("Error on route", error);
      router.push("/daftarkelas");
    }
  };

  useEffect(() => {
    fetchFormPenilaian();
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
            <div className="grid grid-cols-[2fr_3fr_2fr] gap-4 px-4 py-3 bg-blue-600 rounded-md font-semibold text-zinc-100 text-sm">
              <div className="truncate whitespace-nowrap">Kelompok</div>
              <div className="truncate whitespace-nowrap">Jumlah Anggota</div>
              <div className="truncate whitespace-nowrap">Aksi</div>
            </div>

            <ul className="space-y-2">
              {currentDaftarKelompok.length === 0 ? (
                <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm text-gray-500">
                    Mata kuliah ini belum memiliki kelompok
                  </p>
                </div>
              ) : (
                currentDaftarKelompok.map((daftarKelompok) => (
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
                      <div className="space-x-2 space-y-2 sm:space-y-0">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all text-sm">
                          Lihat
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all text-sm">
                          Ubah
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
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
            <div className="grid grid-cols-[2fr_3fr_2fr] gap-4 px-4 py-3 bg-blue-600 rounded-md font-semibold text-zinc-100 text-sm">
              <div className="truncate whitespace-nowrap">Nama Form</div>
              <div className="truncate whitespace-nowrap">Jenis Form</div>
              <div className="truncate whitespace-nowrap">Aksi</div>
            </div>

            <ul className="space-y-2">
              {formPenilaian.length === 0 ? (
                <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm text-gray-500">
                    Mata kuliah ini belum memiliki form penilaian
                  </p>
                </div>
              ) : (
                formPenilaian.map((form) => (
                  <li
                    key={form?.id_form}
                    className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="grid grid-cols-[2fr_3fr_2fr] gap-4 items-center">
                      <div className="text-sm text-gray-800">{form?.nama}</div>
                      <div className="text-sm text-gray-800">{form?.jenis}</div>
                      {session?.user?.role === "Dosen" ? (
                        <div className="space-x-2">
                          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all text-sm">
                            Ubah
                          </button>
                          <button className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all text-sm">
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <div className="space-x-2">
                          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all text-sm">
                            Isi
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))
              )}
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
              Rekap nilai untuk mata kuliah{" "}
              {parseMatkulParam(params.matkul).nama_matkul}
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

  const handleTambahKelompok = () => {
    setIsModalOpen(true);
  };

  // Add these functions to handle form changes and submission
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.nama_kelompok.trim()) {
      setError("Nama kelompok tidak boleh kosong");
      return;
    }

    const kapasitas = parseInt(formData.kapasitas);

    if (isNaN(kapasitas) || kapasitas < 2 || kapasitas > 20) {
      setError("Kapasitas harus berupa angka antara 2 hingga 20");
      return;
    }

    try {
      setIsSubmitting(true);
      const { nama_matkul, kelas, id_mk } = parseMatkulParam(params.matkul);

      const response = await axios.post("/api/daftarkelompok/tambah", {
        nama_kelompok: formData.nama_kelompok,
        kapasitas,
        nama_matkul,
        kelas,
        id_mk,
        id_user: session?.user?.id_user,
      });

      if (response.data.success) {
        setIsModalOpen(false);
        setFormData({
          nama_kelompok: "",
          kapasitas: "5", // default-nya string
        });
        fetchKelompok();
      } else {
        setError(response.data.message || "Gagal membuat kelompok");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      setError("Terjadi kesalahan saat membuat kelompok");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full lg:max-w-6xl">
      <div className="min-w-96 space-y-4">
        <div className="text-2xl font-bold">
          {parseMatkulParam(params.matkul).nama_matkul +
            " " +
            parseMatkulParam(params.matkul).kelas}
        </div>

        {/* Tab Bar */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("daftar-kelompok")}
              className={`py-3 px-4 text-sm transition-colors border-b-2 ${
                activeTab === "daftar-kelompok"
                  ? "border-blue-600 font-bold text-blue-600"
                  : "border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Daftar Kelompok
            </button>
            <button
              onClick={() => setActiveTab("form-penilaian")}
              className={`py-3 px-4 text-sm transition-colors border-b-2 ${
                activeTab === "form-penilaian"
                  ? "border-blue-600 font-bold text-blue-600"
                  : "border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Form Penilaian
            </button>
            <button
              onClick={() => setActiveTab("rekap-nilai")}
              className={`py-3 px-4 text-sm transition-colors border-b-2 ${
                activeTab === "rekap-nilai"
                  ? "border-blue-600 font-bold text-blue-600"
                  : "border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Rekap Nilai
            </button>
          </nav>
        </div>

        {/* Title based on active tab */}
        <div className={`text-xl font-bold p-0 m-0 flex justify-between`}>
          {activeTab === "daftar-kelompok" && "Daftar Kelompok"}
          {activeTab === "daftar-kelompok" &&
            (session?.user?.role === "Dosen" ? (
              <div className="">
                <button
                  className="px-4 py-2 border-1 border-blue-600 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-all text-sm"
                  onClick={() => handleTambahKelompok()}
                >
                  Buat Kelompok
                </button>
              </div>
            ) : (
              ""
            ))}
          {activeTab === "form-penilaian" && "Form Penilaian Sejawat"}
          {activeTab === "form-penilaian" &&
            (session?.user?.role === "Dosen" ? (
              <div className="">
                <button className="px-4 py-2 border-1 border-blue-600 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-all text-sm">
                  Buat Form
                </button>
              </div>
            ) : (
              ""
            ))}
          {activeTab === "rekap-nilai" && "Rekap Nilai"}
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
      <TambahKelompokModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        error={error}
        isSubmitting={isSubmitting}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
};

const TambahKelompokModal = ({
  isOpen,
  onClose,
  formData,
  error,
  isSubmitting,
  handleChange,
  handleSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(75, 85, 99, 0.4)" }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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

        <h2 className="text-xl font-semibold mb-4">Buat Kelompok Baru</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Nama Kelompok <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama_kelompok"
              value={formData.nama_kelompok}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan nama kelompok"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Kapasitas Anggota <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="kapasitas"
              value={formData.kapasitas}
              onChange={handleChange}
              min="2"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
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
                  ? "z-10 bg-blue-600 text-white border-blue-600"
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

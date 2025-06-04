"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import toast from "react-hot-toast";

const DetailMataKuliahModal = ({ isOpen, onClose, mataKuliah }) => {
  const [activeTab, setActiveTab] = useState("detail");
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [enrolledMahasiswa, setEnrolledMahasiswa] = useState([]);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [importedData, setImportedData] = useState([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch daftar mahasiswa dan mahasiswa yang sudah terdaftar
  useEffect(() => {
    if (isOpen && mataKuliah) {
      fetchMahasiswaData();
    }
  }, [isOpen, mataKuliah]);

  const fetchMahasiswaData = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "/api/admin/dosen-matakuliah/fetch/mahasiswa",
        { id_mk: mataKuliah.id }
      );

      const { enrolled, notEnrolled } = response.data;

      setMahasiswaList(notEnrolled);
      setEnrolledMahasiswa(enrolled);
    } catch (error) {
      console.error("Error fetching mahasiswa data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Updated handleAddMahasiswa using the new API endpoint
  const handleAddMahasiswa = async () => {
    if (selectedMahasiswa.length === 0) return;

    setLoading(true);
    try {
      const res = await axios.post("/api/admin/dosen-matakuliah/daftar", {
        id_mk: mataKuliah.id || mataKuliah.id_mk,
        mahasiswaIds: selectedMahasiswa,
      });

      if (res.data.success) {
        // Refresh data
        await fetchMahasiswaData();
        setSelectedMahasiswa([]);

        // Show success message (you can replace this with your toast implementation)
        toast.success(res.data.message);
      } else {
        // Show error message
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error("Error adding mahasiswa:", error);
      toast.error("Terjadi kesalahan saat menambahkan mahasiswa.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMahasiswa = async (mahasiswaId) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin mengeluarkan mahasiswa ini dari mata kuliah?"
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/admin/dosen-matakuliah/daftar/hapus", {
        id_mk: mataKuliah.id || mataKuliah.id_mk,
        id_user: mahasiswaId,
      });

      if (res.data.success) {
        // Refresh data
        await fetchMahasiswaData();

        // Show success message
        toast.success(res.data.message);
      } else {
        // Show error message
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error("Error removing mahasiswa:", error);
      toast.error("Terjadi kesalahan saat mengeluarkan mahasiswa.");
    } finally {
      setLoading(false);
    }
  };

  const filteredMahasiswa = mahasiswaList.filter(
    (mahasiswa) =>
      !enrolledMahasiswa.some(
        (enrolled) => enrolled.id_user === mahasiswa.id
      ) &&
      (mahasiswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mahasiswa.npm.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCheckboxChange = (mahasiswaId) => {
    setSelectedMahasiswa((prev) =>
      prev.includes(mahasiswaId)
        ? prev.filter((id) => id !== mahasiswaId)
        : [...prev, mahasiswaId]
    );
  };

  // Handle Excel file import
  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file);

      const worksheet = workbook.getWorksheet(1); // Get first worksheet
      if (!worksheet) {
        toast.error("File Excel kosong atau tidak valid");
        return;
      }

      const npmList = [];

      // Read data from worksheet
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        // Try different possible column indices for NPM
        let npm = null;

        // Check each cell in the row for NPM-like data
        row.eachCell((cell, colNumber) => {
          const cellValue = cell.value;
          if (
            (cellValue && typeof cellValue === "string") ||
            typeof cellValue === "number"
          ) {
            const header = worksheet.getRow(1).getCell(colNumber).value;
            if (header && typeof header === "string") {
              const headerLower = header.toLowerCase();
              if (
                headerLower.includes("npm") ||
                headerLower.includes("NPM") ||
                headerLower.includes("student") ||
                headerLower === "id"
              ) {
                npm = String(cellValue).trim();
              }
            }
            // If no header match, try first column or if it looks like NPM
            if (
              !npm &&
              (colNumber === 1 || /^\d+$/.test(String(cellValue).trim()))
            ) {
              npm = String(cellValue).trim();
            }
          }
        });

        if (npm && npm.length > 0) {
          npmList.push({
            npm: npm,
            rowIndex: rowNumber,
          });
        }
      });

      if (npmList.length === 0) {
        toast.error(
          "Tidak ditemukan data NPM dalam file Excel. Pastikan ada kolom NPM dan data tidak kosong."
        );
        return;
      }

      setImportedData(npmList);
      setShowImportPreview(true);
      toast.success(
        `Berhasil membaca ${npmList.length} data NPM dari file Excel`
      );
    } catch (error) {
      console.error("Error reading Excel file:", error);
      toast.error("Gagal membaca file Excel. Pastikan format file benar.");
    }
  };

  // Handle import mahasiswa from Excel
  const handleImportMahasiswa = async () => {
    if (importedData.length === 0) return;

    setLoading(true);
    try {
      const npmList = importedData.map((item) => item.npm);

      const res = await axios.post(
        "/api/admin/dosen-matakuliah/daftar/import",
        {
          id_mk: mataKuliah.id || mataKuliah.id_mk,
          npmList: npmList,
        }
      );

      if (res.data.success) {
        await fetchMahasiswaData();
        setImportedData([]);
        setShowImportPreview(false);
        toast.success(res.data.message);

        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error("Error importing mahasiswa:", error);
      toast.error("Terjadi kesalahan saat mengimport mahasiswa.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel import
  const handleCancelImport = () => {
    setImportedData([]);
    setShowImportPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Download template function
  const downloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();

      // Create main data sheet
      const worksheet = workbook.addWorksheet("Data Mahasiswa");

      // Add header
      worksheet.columns = [{ header: "NPM", key: "npm", width: 15 }];

      // Add sample data
      worksheet.addRow({ npm: "12345678" });
      worksheet.addRow({ npm: "87654321" });
      worksheet.addRow({ npm: "11223344" });
      worksheet.addRow({ npm: "" });

      // Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFCCCCCC" },
      };

      // Create instructions sheet
      const instructionsSheet = workbook.addWorksheet("Instruksi");
      instructionsSheet.columns = [
        { header: "Instruksi Penggunaan", key: "instruksi", width: 50 },
      ];

      instructionsSheet.addRow({
        instruksi:
          "1. Isi kolom NPM dengan NPM mahasiswa yang ingin ditambahkan",
      });
      instructionsSheet.addRow({
        instruksi: "2. Hapus baris contoh dan isi dengan data sebenarnya",
      });
      instructionsSheet.addRow({
        instruksi: "3. Pastikan NPM dalam format yang benar (angka)",
      });
      instructionsSheet.addRow({
        instruksi: "4. Simpan file dan upload kembali ke sistem",
      });
      instructionsSheet.addRow({ instruksi: "" });
      instructionsSheet.addRow({ instruksi: "Format yang didukung:" });
      instructionsSheet.addRow({
        instruksi: "- Kolom bisa bernama: NPM, npm",
      });
      instructionsSheet.addRow({ instruksi: "- File format: .xlsx" });

      // Style instructions header
      instructionsSheet.getRow(1).font = { bold: true };
      instructionsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFCCCCCC" },
      };

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "template-import-mahasiswa.xlsx";
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Template berhasil didownload");
    } catch (error) {
      console.error("Error generating template:", error);
      toast.error("Gagal membuat template Excel");
    }
  };

  if (!isOpen || !mataKuliah) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(75, 85, 99, 0.4)" }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Detail Mata Kuliah
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-2 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("detail")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "detail"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Detail Mata Kuliah
            </button>
            <button
              onClick={() => setActiveTab("mahasiswa")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "mahasiswa"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Daftar Mahasiswa ({enrolledMahasiswa.length})
            </button>
            <button
              onClick={() => setActiveTab("tambah")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tambah"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Tambah Mahasiswa
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === "detail" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode Mata Kuliah
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {mataKuliah.kodeMatkul || mataKuliah.kode_mk}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKS
                  </label>
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                    {mataKuliah.sks} SKS
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Mata Kuliah
                </label>
                <div className="text-lg text-gray-900">
                  {mataKuliah.namaMatkul || mataKuliah.nama}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kelas
                  </label>
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                    {mataKuliah.kelas}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tahun Ajaran
                  </label>
                  <div className="text-gray-900">
                    {mataKuliah.tahunAjaran || mataKuliah.tahun_ajaran}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosen Pengampu
                </label>
                {mataKuliah?.dosenPengampu?.length > 0 ||
                mataKuliah?.dosen_pengampu?.length > 0 ? (
                  <div className="space-y-2">
                    {(
                      mataKuliah.dosenPengampu ||
                      mataKuliah.dosen_pengampu ||
                      []
                    ).map((dosen, index) => (
                      <div
                        key={index}
                        className="inline-block bg-green-50 text-green-700 px-3 py-1 rounded-md mr-2"
                      >
                        {dosen.nama}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">
                    Belum ada dosen pengampu
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === "mahasiswa" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Mahasiswa Terdaftar ({enrolledMahasiswa.length})
                </h3>
              </div>

              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : enrolledMahasiswa.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          NPM
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nama
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {enrolledMahasiswa.map((mahasiswa) => (
                        <tr key={mahasiswa.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {mahasiswa.npm}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {mahasiswa.nama}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mahasiswa.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() =>
                                handleRemoveMahasiswa(mahasiswa.id)
                              }
                              className="text-red-600 hover:text-red-900"
                              disabled={loading}
                            >
                              Keluarkan
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Belum ada mahasiswa yang terdaftar di mata kuliah ini
                </div>
              )}
            </div>
          )}

          {activeTab === "tambah" && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Tambah Mahasiswa ke Mata Kuliah
                </h3>

                {/* Import from Excel Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-md font-medium text-gray-700 mb-3">
                    Import dari Excel
                  </h4>
                  <div className="flex items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileImport}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <button
                      onClick={downloadTemplate}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Download Template
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Format yang didukung: .xlsx, .xls. Pastikan file memiliki
                    kolom NPM.
                  </p>
                </div>

                {/* Import Preview */}
                {showImportPreview && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-medium text-blue-700">
                        Preview Data Import ({importedData.length} mahasiswa)
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={handleImportMahasiswa}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loading ? "Mengimport..." : "Import Semua"}
                        </button>
                        <button
                          onClick={handleCancelImport}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {importedData.slice(0, 20).map((item, index) => (
                          <div
                            key={index}
                            className="bg-white p-2 rounded text-sm"
                          >
                            <span className="font-medium">{item.npm}</span>
                            <span className="text-gray-500 text-xs ml-1">
                              (Row {item.rowIndex})
                            </span>
                          </div>
                        ))}
                      </div>
                      {importedData.length > 20 && (
                        <p className="text-xs text-gray-500 mt-2">
                          ... dan {importedData.length - 20} data lainnya
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-700 mb-3">
                    Atau Pilih Manual
                  </h4>
                </div>

                {/* Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Cari mahasiswa berdasarkan nama atau NPM..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Selected Count */}
                {selectedMahasiswa.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-md">
                    <span className="text-sm text-blue-700">
                      {selectedMahasiswa.length} mahasiswa dipilih
                    </span>
                    <button
                      onClick={handleAddMahasiswa}
                      disabled={loading}
                      className="ml-4 px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "Menambahkan..." : "Tambahkan"}
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : filteredMahasiswa.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredMahasiswa.map((mahasiswa) => (
                    <div
                      key={mahasiswa.id}
                      className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        id={`mahasiswa-${mahasiswa.id}`}
                        checked={selectedMahasiswa.includes(mahasiswa.id)}
                        onChange={() => handleCheckboxChange(mahasiswa.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`mahasiswa-${mahasiswa.id}`}
                        className="ml-3 flex-1 cursor-pointer"
                      >
                        <div className="font-medium text-gray-900">
                          {mahasiswa.nama}
                        </div>
                        <div className="text-sm text-gray-500">
                          {mahasiswa.npm} - {mahasiswa.email}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm
                    ? "Tidak ada mahasiswa yang cocok dengan pencarian"
                    : "Semua mahasiswa sudah terdaftar di mata kuliah ini"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailMataKuliahModal;

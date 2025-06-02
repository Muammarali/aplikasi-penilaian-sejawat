"use client";
import React, { useState, useEffect } from "react";
import ExcelJS from "exceljs";

const KelolaMataKuliah = () => {
  // Data dummy dosen
  const [dosenList] = useState([
    {
      id: 1,
      npm: "198501012010011001",
      nama: "Dr. Ahmad Santoso",
      email: "ahmad.santoso@univ.ac.id",
    },
    {
      id: 2,
      npm: "198603052011012002",
      nama: "Prof. Dr. Siti Aminah",
      email: "siti.aminah@univ.ac.id",
    },
    {
      id: 3,
      npm: "198712102012011003",
      nama: "Dr. Budi Hartono, M.T.",
      email: "budi.hartono@univ.ac.id",
    },
    {
      id: 4,
      npm: "199001152013012004",
      nama: "Dr. Rina Kusuma, S.Kom., M.Kom.",
      email: "rina.kusuma@univ.ac.id",
    },
  ]);

  // Data dummy mata kuliah (without semester and deskripsi)
  const [mataKuliah, setMataKuliah] = useState([
    {
      id: 1,
      kodeMatkul: "IF101",
      namaMatkul: "Algoritma dan Pemrograman",
      sks: 3,
      tahunAjaran: "2024/2025",
      dosenPengampu: [
        { id: 1, npm: "198501012010011001", nama: "Dr. Ahmad Santoso" },
      ],
    },
    {
      id: 2,
      kodeMatkul: "IF201",
      namaMatkul: "Struktur Data",
      sks: 3,
      tahunAjaran: "2024/2025",
      dosenPengampu: [
        { id: 2, npm: "198603052011012002", nama: "Prof. Dr. Siti Aminah" },
        { id: 3, npm: "198712102012011003", nama: "Dr. Budi Hartono, M.T." },
      ],
    },
    {
      id: 3,
      kodeMatkul: "IF301",
      namaMatkul: "Basis Data",
      sks: 4,
      tahunAjaran: "2024/2025",
      dosenPengampu: [
        {
          id: 4,
          npm: "199001152013012004",
          nama: "Dr. Rina Kusuma, S.Kom., M.Kom.",
        },
      ],
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingMatkul, setEditingMatkul] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTahunAjaran, setFilterTahunAjaran] = useState("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [matkulPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    kodeMatkul: "",
    namaMatkul: "",
    sks: 2,
    tahunAjaran: "2024/2025",
    dosenPengampu: [],
  });

  const [selectedDosen, setSelectedDosen] = useState([]);
  const [importData, setImportData] = useState([]);
  const [importPreview, setImportPreview] = useState(false);

  // Generate tahun ajaran options
  const generateTahunAjaran = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -2; i <= 3; i++) {
      const year1 = currentYear + i;
      const year2 = year1 + 1;
      years.push(`${year1}/${year2}`);
    }
    return years;
  };

  const tahunAjaranOptions = generateTahunAjaran();

  // Get unique tahun ajaran dari data
  const uniqueTahunAjaran = [
    ...new Set(mataKuliah.map((mk) => mk.tahunAjaran)),
  ];

  // Filter dan search mata kuliah
  const filteredMataKuliah = mataKuliah.filter((mk) => {
    const matchesSearch =
      mk.namaMatkul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mk.kodeMatkul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mk.dosenPengampu.some((dosen) =>
        dosen.nama.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesTahunAjaran =
      filterTahunAjaran === "semua" || mk.tahunAjaran === filterTahunAjaran;
    return matchesSearch && matchesTahunAjaran;
  });

  // Pagination
  const indexOfLastMatkul = currentPage * matkulPerPage;
  const indexOfFirstMatkul = indexOfLastMatkul - matkulPerPage;
  const currentMataKuliah = filteredMataKuliah.slice(
    indexOfFirstMatkul,
    indexOfLastMatkul
  );
  const totalPages = Math.ceil(filteredMataKuliah.length / matkulPerPage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDosenSelection = (dosen) => {
    const isSelected = selectedDosen.find((d) => d.id === dosen.id);
    if (isSelected) {
      setSelectedDosen((prev) => prev.filter((d) => d.id !== dosen.id));
    } else {
      setSelectedDosen((prev) => [...prev, dosen]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      try {
        const matkulData = {
          ...formData,
          dosenPengampu: selectedDosen,
          sks: parseInt(formData.sks),
        };

        if (editingMatkul) {
          // Update mata kuliah
          setMataKuliah((prev) =>
            prev.map((mk) =>
              mk.id === editingMatkul.id
                ? { ...matkulData, id: editingMatkul.id }
                : mk
            )
          );
        } else {
          // Add new mata kuliah
          const newMatkul = {
            ...matkulData,
            id: Date.now(),
          };
          setMataKuliah((prev) => [...prev, newMatkul]);
        }

        // Reset form
        setFormData({
          kodeMatkul: "",
          namaMatkul: "",
          sks: 2,
          tahunAjaran: "2024/2025",
          dosenPengampu: [],
        });
        setSelectedDosen([]);
        setEditingMatkul(null);
        setShowModal(false);
      } catch (error) {
        console.error("Error saving mata kuliah:", error);
        alert("Terjadi error saat menyimpan data mata kuliah");
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  const handleEdit = (matkul) => {
    setEditingMatkul(matkul);
    setFormData({
      kodeMatkul: matkul.kodeMatkul,
      namaMatkul: matkul.namaMatkul,
      sks: matkul.sks,
      tahunAjaran: matkul.tahunAjaran,
    });
    setSelectedDosen(matkul.dosenPengampu);
    setShowModal(true);
  };

  const handleDelete = (matkulId) => {
    if (confirm("Apakah Anda yakin ingin menghapus mata kuliah ini?")) {
      setMataKuliah((prev) => prev.filter((mk) => mk.id !== matkulId));
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file);

      const worksheet = workbook.getWorksheet(1);
      const jsonData = [];

      // Skip header row (row 1) dan mulai dari row 2
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const rowData = {
            kodeMatkul: row.getCell(1).value?.toString() || "",
            namaMatkul: row.getCell(2).value?.toString() || "",
            sks: parseInt(row.getCell(3).value) || 2,
            tahunAjaran: row.getCell(4).value?.toString() || "2024/2025",
            dosenNpm: row.getCell(5).value?.toString() || "",
          };

          // Validasi data tidak kosong
          if (rowData.kodeMatkul && rowData.namaMatkul) {
            jsonData.push(rowData);
          }
        }
      });

      // Process data dan mapping dosen
      const processedData = jsonData.map((matkulData, index) => {
        const dosenPengampu = [];
        if (matkulData.dosenNpm) {
          const npmList = matkulData.dosenNpm
            .split(",")
            .map((npm) => npm.trim());
          npmList.forEach((npm) => {
            const dosen = dosenList.find((d) => d.npm === npm);
            if (dosen) {
              dosenPengampu.push(dosen);
            }
          });
        }

        return {
          id: Date.now() + index,
          kodeMatkul: matkulData.kodeMatkul,
          namaMatkul: matkulData.namaMatkul,
          sks: matkulData.sks,
          tahunAjaran: matkulData.tahunAjaran,
          dosenPengampu: dosenPengampu,
        };
      });

      setImportData(processedData);
      setImportPreview(true);
    } catch (error) {
      console.error("Error reading Excel file:", error);
      alert("Error membaca file Excel. Pastikan format file sesuai template.");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmImport = () => {
    setMataKuliah((prev) => [...prev, ...importData]);
    setImportData([]);
    setImportPreview(false);
    setShowImportModal(false);
  };

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template Mata Kuliah");

    // Add headers
    worksheet.columns = [
      { header: "Kode Matkul", key: "kodeMatkul", width: 15 },
      { header: "Nama Mata Kuliah", key: "namaMatkul", width: 35 },
      { header: "SKS", key: "sks", width: 10 },
      { header: "Tahun Ajaran", key: "tahunAjaran", width: 15 },
      {
        header: "NPM Dosen (pisahkan dengan koma)",
        key: "dosenNpm",
        width: 35,
      },
    ];

    // Add sample data
    worksheet.addRow({
      kodeMatkul: "IF101",
      namaMatkul: "Algoritma dan Pemrograman",
      sks: 3,
      tahunAjaran: "2024/2025",
      dosenNpm: "198501012010011001",
    });

    worksheet.addRow({
      kodeMatkul: "IF201",
      namaMatkul: "Struktur Data",
      sks: 3,
      tahunAjaran: "2024/2025",
      dosenNpm: "198603052011012002,198712102012011003",
    });

    // Style header
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6E6FA" },
      };
    });

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_mata_kuliah.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportMataKuliah = async () => {
    setIsLoading(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Data Mata Kuliah");

      // Add headers
      worksheet.columns = [
        { header: "Kode Matkul", key: "kodeMatkul", width: 15 },
        { header: "Nama Mata Kuliah", key: "namaMatkul", width: 35 },
        { header: "SKS", key: "sks", width: 10 },
        { header: "Tahun Ajaran", key: "tahunAjaran", width: 15 },
        { header: "Dosen Pengampu", key: "dosenPengampu", width: 40 },
      ];

      // Add data
      mataKuliah.forEach((mk) => {
        worksheet.addRow({
          kodeMatkul: mk.kodeMatkul,
          namaMatkul: mk.namaMatkul,
          sks: mk.sks,
          tahunAjaran: mk.tahunAjaran,
          dosenPengampu: mk.dosenPengampu.map((d) => d.nama).join(", "),
        });
      });

      // Style header
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE6E6FA" },
        };
      });

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data_mata_kuliah_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Error saat export data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Kelola Mata Kuliah
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Kelola data mata kuliah dan dosen pengampu
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={exportMataKuliah}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Export Excel
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Import Excel
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Tambah Mata Kuliah
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari nama mata kuliah, kode, atau dosen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={filterTahunAjaran}
                onChange={(e) => setFilterTahunAjaran(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="semua">Semua Tahun Ajaran</option>
                {uniqueTahunAjaran.map((tahun) => (
                  <option key={tahun} value={tahun}>
                    {tahun}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Processing...</span>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Mata Kuliah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tahun Ajaran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dosen Pengampu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentMataKuliah.map((mk) => (
                <tr key={mk.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {mk.kodeMatkul}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {mk.namaMatkul}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {mk.sks} SKS
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {mk.tahunAjaran}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {mk.dosenPengampu.length > 0 ? (
                        <div className="space-y-1">
                          {mk.dosenPengampu.map((dosen, index) => (
                            <div
                              key={index}
                              className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded"
                            >
                              {dosen.nama}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">
                          Belum ada dosen
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(mk)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(mk.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Menampilkan {indexOfFirstMatkul + 1}-
                {Math.min(indexOfLastMatkul, filteredMataKuliah.length)} dari{" "}
                {filteredMataKuliah.length} data
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === i + 1
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add/Edit Mata Kuliah */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingMatkul ? "Edit Mata Kuliah" : "Tambah Mata Kuliah Baru"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kode Mata Kuliah
                    </label>
                    <input
                      type="text"
                      name="kodeMatkul"
                      value={formData.kodeMatkul}
                      onChange={handleInputChange}
                      placeholder="e.g., IF101"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Mata Kuliah
                    </label>
                    <input
                      type="text"
                      name="namaMatkul"
                      value={formData.namaMatkul}
                      onChange={handleInputChange}
                      placeholder="e.g., Algoritma dan Pemrograman"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKS
                    </label>
                    <select
                      name="sks"
                      value={formData.sks}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Array.from({ length: 6 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} SKS
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tahun Ajaran
                    </label>
                    <select
                      name="tahunAjaran"
                      value={formData.tahunAjaran}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {tahunAjaranOptions.map((tahun) => (
                        <option key={tahun} value={tahun}>
                          {tahun}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dosen Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Dosen Pengampu
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-80 overflow-y-auto">
                    <div className="space-y-2">
                      {dosenList.map((dosen) => {
                        const isSelected = selectedDosen.find(
                          (d) => d.id === dosen.id
                        );
                        return (
                          <div
                            key={dosen.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-blue-50 border-blue-300"
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => handleDosenSelection(dosen)}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={!!isSelected}
                                onChange={() => handleDosenSelection(dosen)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {dosen.nama}
                                </div>
                                <div className="text-xs text-gray-500">
                                  NPM: {dosen.npm} | {dosen.email}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedDosen.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-800 mb-2">
                        Dosen Terpilih ({selectedDosen.length}):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedDosen.map((dosen) => (
                          <span
                            key={dosen.id}
                            className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full"
                          >
                            {dosen.nama}
                            <button
                              type="button"
                              onClick={() => handleDosenSelection(dosen)}
                              className="ml-1 text-green-500 hover:text-green-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMatkul(null);
                    setFormData({
                      kodeMatkul: "",
                      namaMatkul: "",
                      sks: 2,
                      tahunAjaran: "2024/2025",
                      dosenPengampu: [],
                    });
                    setSelectedDosen([]);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading
                    ? "Processing..."
                    : editingMatkul
                    ? "Update"
                    : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Import Data Mata Kuliah
              </h2>
            </div>

            <div className="px-6 py-4">
              {!importPreview ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">
                      Upload file Excel (.xlsx) dengan format kolom:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      <table className="text-xs w-full min-w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1 px-2">A</th>
                            <th className="text-left py-1 px-2">B</th>
                            <th className="text-left py-1 px-2">C</th>
                            <th className="text-left py-1 px-2">D</th>
                            <th className="text-left py-1 px-2">E</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-1 px-2">Kode Matkul</td>
                            <td className="py-1 px-2">Nama Mata Kuliah</td>
                            <td className="py-1 px-2">SKS</td>
                            <td className="py-1 px-2">Tahun Ajaran</td>
                            <td className="py-1 px-2">NPM Dosen</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <p>
                        • NPM Dosen: Pisahkan dengan koma jika lebih dari satu
                        (contoh: 198501012010011001,198603052011012002)
                      </p>
                      <p>• SKS: Angka 1-6</p>
                      <p>
                        • Tahun Ajaran: Format YYYY/YYYY (contoh: 2024/2025)
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={downloadTemplate}
                      disabled={isLoading}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
                    >
                      Download Template
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileImport}
                      disabled={isLoading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      Preview Data ({importData.length} records)
                    </h3>
                    <div className="space-x-2">
                      <button
                        onClick={() => setImportPreview(false)}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                      >
                        Kembali
                      </button>
                      <button
                        onClick={confirmImport}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Konfirmasi Import
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">
                            Kode
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">
                            Nama Mata Kuliah
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">
                            SKS
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">
                            Tahun Ajaran
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">
                            Dosen
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData.slice(0, 50).map((mk, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2 text-sm">
                              {mk.kodeMatkul}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {mk.namaMatkul}
                            </td>
                            <td className="px-4 py-2 text-sm">{mk.sks}</td>
                            <td className="px-4 py-2 text-sm">
                              {mk.tahunAjaran}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {mk.dosenPengampu.length > 0 ? (
                                <div className="space-y-1">
                                  {mk.dosenPengampu.map((dosen, idx) => (
                                    <div
                                      key={idx}
                                      className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded"
                                    >
                                      {dosen.nama}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">
                                  Tidak ada dosen
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importData.length > 50 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Menampilkan 50 dari {importData.length} records
                      </p>
                    )}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">
                      Informasi Import:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>
                        • Total {importData.length} mata kuliah akan diimport
                      </li>
                      <li>
                        • Dosen akan dipetakan berdasarkan NPM yang ada di
                        database
                      </li>
                      <li>• Data yang tidak valid akan dilewati</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportPreview(false);
                  setImportData([]);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaMataKuliah;

"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import ExcelJS from "exceljs";
import toast from "react-hot-toast";
import DetailMataKuliahModal from "../DetailMataKuliahModal";

const KelolaMataKuliah = () => {
  // Data dosen
  const [dosenList, setDosenList] = useState([]);

  // Data mata kuliah (dengan kelas)
  const [mataKuliah, setMataKuliah] = useState([]);

  const fetchMataKuliah = async () => {
    try {
      const response = await axios.get("/api/admin/dosen-matakuliah/fetch");
      const data = response.data.rows;

      // Clean dan normalize data untuk konsistensi
      const cleanedData = data.map((mk, index) => ({
        // Pastikan setiap item punya ID yang unik
        id: mk.id_mk || mk.id || `temp-${Date.now()}-${index}`,
        id_mk: mk.id_mk,
        kodeMatkul: mk.kodeMatkul || mk.kode_mk || "",
        namaMatkul: mk.namaMatkul || mk.nama || "",
        kelas: mk.kelas || "",
        sks: mk.sks || 0,
        tahunAjaran: mk.tahunAjaran || mk.tahun_ajaran || "",
        dosenPengampu: Array.isArray(mk.dosenPengampu)
          ? mk.dosenPengampu
          : Array.isArray(mk.dosen_pengampu)
          ? mk.dosen_pengampu
          : [],
      }));

      // TAMBAHAN: Remove duplicates berdasarkan kombinasi unique fields
      const uniqueData = cleanedData.reduce((acc, current) => {
        const identifier = `${current.kodeMatkul}-${current.kelas}-${current.tahunAjaran}`;
        const existing = acc.find(
          (item) =>
            `${item.kodeMatkul}-${item.kelas}-${item.tahunAjaran}` ===
            identifier
        );

        if (!existing) {
          acc.push(current);
        } else {
          // Jika ada duplikat, ambil yang punya ID lebih besar (lebih baru)
          if (current.id_mk > existing.id_mk) {
            const index = acc.indexOf(existing);
            acc[index] = current;
          }
        }
        return acc;
      }, []);

      console.log("Fetched and cleaned mata kuliah data:", uniqueData);
      console.log(
        "Removed duplicates:",
        cleanedData.length - uniqueData.length
      );
      setMataKuliah(uniqueData);
    } catch (error) {
      console.error("Error fetching mata kuliah:", error);
    }
  };

  const fetchDosen = async () => {
    try {
      const response = await axios.get(
        "/api/admin/dosen-matakuliah/fetch/dosen"
      );
      const data = response.data.rows;

      setDosenList(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDosen();
    fetchMataKuliah();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingMatkul, setEditingMatkul] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTahunAjaran, setFilterTahunAjaran] = useState("semua");
  const [filterKelas, setFilterKelas] = useState("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [matkulPerPage] = useState(10);
  const [selectedMataKuliah, setSelectedMataKuliah] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    kodeMatkul: "",
    namaMatkul: "",
    kelas: "A",
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

      // Tambahkan semester Ganjil dan Genap untuk setiap tahun ajaran
      years.push(`${year1}/${year2} Ganjil`);
      years.push(`${year1}/${year2} Genap`);
    }

    return years;
  };

  const tahunAjaranOptions = generateTahunAjaran();

  // Generate kelas options (A-Z)
  const kelasOptions = Array.from({ length: 4 }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  // Get unique tahun ajaran dari data
  const uniqueTahunAjaran = [
    ...new Set(mataKuliah.map((mk) => mk.tahunAjaran)),
  ];

  // Get unique kelas dari data
  const uniqueKelas = [...new Set(mataKuliah.map((mk) => mk.kelas))].sort();

  // Filter dan search mata kuliah
  const filteredMataKuliah = mataKuliah.filter((mk) => {
    const matchesSearch =
      mk?.namaMatkul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mk?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mk?.kodeMatkul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mk?.kode_mk?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mk?.kelas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mk?.dosenPengampu?.some((dosen) =>
        dosen?.nama?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesTahunAjaran =
      filterTahunAjaran === "semua" ||
      mk?.tahunAjaran === filterTahunAjaran ||
      mk?.tahun_ajaran === filterTahunAjaran;

    const matchesKelas = filterKelas === "semua" || mk?.kelas === filterKelas;

    return matchesSearch && matchesTahunAjaran && matchesKelas;
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

  const handleRowClick = (mk) => {
    setSelectedMataKuliah(mk);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMataKuliah(null);
  };

  // Alternative version dengan try-catch yang lebih detail
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validasi form di frontend
      if (
        !formData.kodeMatkul ||
        !formData.namaMatkul ||
        selectedDosen.length === 0
      ) {
        toast.error("Mohon lengkapi semua field yang wajib diisi");
        setIsLoading(false);
        return;
      }

      const matkulData = {
        kodeMatkul: formData.kodeMatkul.trim(),
        namaMatkul: formData.namaMatkul.trim(),
        kelas: formData.kelas,
        sks: parseInt(formData.sks),
        tahunAjaran: formData.tahunAjaran,
        dosenPengampu: selectedDosen,
      };

      let response;

      if (editingMatkul) {
        // UPDATE mata kuliah
        console.log("Updating mata kuliah with data:", matkulData);

        const updateData = {
          ...matkulData,
          id: editingMatkul.id_mk || editingMatkul.id,
        };

        response = await axios.put(
          "/api/admin/dosen-matakuliah/kelolamk",
          updateData
        );

        if (response.data.success) {
          // SOLUSI: Fetch ulang data dari server untuk menghindari duplicate keys
          await fetchMataKuliah();

          console.log("Mata kuliah updated successfully");
          toast.success("Mata kuliah berhasil diperbarui!");
        } else {
          toast.error(`Error: ${response.data.message}`);
        }
      } else {
        // INSERT mata kuliah baru
        console.log("Creating new mata kuliah with data:", matkulData);

        response = await axios.post(
          "/api/admin/dosen-matakuliah/kelolamk",
          matkulData
        );

        if (response.data.success) {
          await fetchMataKuliah();
          toast.success("Mata kuliah berhasil ditambahkan!");
        } else {
          toast.error(`Error: ${response.data.message}`);
        }
      }

      // Reset form
      resetForm();
    } catch (error) {
      console.error("Error in handleSubmit:", error);

      if (error.response) {
        const { status, data } = error.response;

        switch (status) {
          case 400:
            toast.error(
              `Validasi Error: ${data.message || "Data tidak valid"}`
            );
            break;
          case 409:
            toast.error(`Conflict: ${data.message || "Data sudah ada"}`);
            break;
          case 500:
            toast.error(
              `Server Error: ${data.message || "Terjadi kesalahan server"}`
            );
            break;
          default:
            toast.error(
              `Error ${status}: ${data.message || "Terjadi kesalahan"}`
            );
        }
      } else if (error.request) {
        toast.error(
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
        );
      } else {
        toast.error(
          `Error: ${error.message || "Terjadi kesalahan tidak terduga"}`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      kodeMatkul: "",
      namaMatkul: "",
      kelas: "A",
      sks: 2,
      tahunAjaran: "2024/2025 Genap",
    });
    setSelectedDosen([]);
    setEditingMatkul(null);
    setShowModal(false);
  };

  const handleEdit = (matkul) => {
    console.log("Editing matkul:", matkul);

    setEditingMatkul(matkul);

    // Mapping field yang lebih robust untuk menangani variasi struktur data
    setFormData({
      kodeMatkul: matkul.kodeMatkul || matkul.kode_mk || "",
      namaMatkul: matkul.namaMatkul || matkul.nama || "",
      kelas: matkul.kelas || "A",
      sks: matkul.sks || 2,
      tahunAjaran:
        matkul.tahunAjaran || matkul.tahun_ajaran || "2024/2025 Ganjil",
    });

    // Handle dosen pengampu dengan berbagai format
    let dosenPengampu = [];
    if (matkul.dosenPengampu && Array.isArray(matkul.dosenPengampu)) {
      dosenPengampu = matkul.dosenPengampu;
    } else if (matkul.dosen_pengampu && Array.isArray(matkul.dosen_pengampu)) {
      dosenPengampu = matkul.dosen_pengampu;
    }

    setSelectedDosen(dosenPengampu);
    setShowModal(true);
  };

  const debugDuplicateKeys = () => {
    console.log("=== DEBUG DUPLICATE ANALYSIS ===");
    console.log("Total items:", currentMataKuliah.length);

    // Check duplicate combinations
    const combinations = currentMataKuliah.map(
      (mk) => `${mk.kodeMatkul}-${mk.kelas}-${mk.tahunAjaran}`
    );

    const duplicateCombinations = combinations.filter(
      (combo, index) => combinations.indexOf(combo) !== index
    );

    if (duplicateCombinations.length > 0) {
      console.warn("Duplicate combinations found:", [
        ...new Set(duplicateCombinations),
      ]);

      // Show detailed duplicate data
      duplicateCombinations.forEach((dupCombo) => {
        const duplicates = currentMataKuliah.filter(
          (mk) => `${mk.kodeMatkul}-${mk.kelas}-${mk.tahunAjaran}` === dupCombo
        );
        console.warn(`Duplicate data for ${dupCombo}:`, duplicates);
      });
    } else {
      console.log("No duplicate combinations found");
    }

    // Check duplicate IDs
    const ids = currentMataKuliah.map((mk) => mk.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

    if (duplicateIds.length > 0) {
      console.warn("Duplicate IDs found:", [...new Set(duplicateIds)]);
    } else {
      console.log("No duplicate IDs found");
    }
  };

  // Panggil debugDuplicateKeys() di useEffect untuk monitoring
  useEffect(() => {
    if (currentMataKuliah.length > 0) {
      debugDuplicateKeys();
    }
  }, [currentMataKuliah]);

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
            kelas: row.getCell(3).value?.toString() || "A",
            sks: parseInt(row.getCell(4).value) || 2,
            tahunAjaran: row.getCell(5).value?.toString() || "2024/2025 Ganjil",
            dosenNpm: row.getCell(6).value?.toString() || "",
          };

          // Validasi data tidak kosong
          if (rowData.kodeMatkul && rowData.namaMatkul) {
            // Validasi format tahun ajaran
            const tahunParts = rowData.tahunAjaran.split(" ");
            if (
              tahunParts.length !== 2 ||
              !["Ganjil", "Genap"].includes(tahunParts[1])
            ) {
              console.warn(
                `Format tahun ajaran tidak valid untuk baris ${rowNumber}: ${rowData.tahunAjaran}`
              );
              // Set default jika format salah
              rowData.tahunAjaran = "2024/2025 Ganjil";
            }

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
            } else {
              console.warn(`Dosen dengan NPM ${npm} tidak ditemukan`);
            }
          });
        }

        return {
          id: `import-${Date.now()}-${index}`, // ID unik untuk import
          kodeMatkul: matkulData.kodeMatkul,
          namaMatkul: matkulData.namaMatkul,
          kelas: matkulData.kelas,
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

  const confirmImport = async () => {
    setIsLoading(true);

    try {
      const successfulImports = [];
      const failedImports = [];

      // Import satu per satu untuk handling error yang lebih baik
      for (const [index, mkData] of importData.entries()) {
        try {
          const response = await axios.post(
            "/api/admin/dosen-matakuliah/kelolamk",
            {
              kodeMatkul: mkData.kodeMatkul,
              namaMatkul: mkData.namaMatkul,
              kelas: mkData.kelas,
              sks: mkData.sks,
              tahunAjaran: mkData.tahunAjaran,
              dosenPengampu: mkData.dosenPengampu,
            }
          );

          if (response.data.success) {
            successfulImports.push(mkData);
          } else {
            failedImports.push({
              data: mkData,
              error: response.data.message,
              row: index + 2, // +2 karena index 0 = row 2 di Excel
            });
          }
        } catch (error) {
          failedImports.push({
            data: mkData,
            error: error.response?.data?.message || error.message,
            row: index + 2,
          });
        }
      }

      // Refresh data dari server
      await fetchMataKuliah();

      // Show results
      if (successfulImports.length > 0) {
        alert(
          `Import berhasil: ${successfulImports.length} mata kuliah ditambahkan`
        );
      }

      if (failedImports.length > 0) {
        console.error("Failed imports:", failedImports);
        const errorMessages = failedImports
          .map((failed) => `Baris ${failed.row}: ${failed.error}`)
          .join("\n");
        alert(
          `Import gagal untuk ${failedImports.length} data:\n${errorMessages}`
        );
      }
    } catch (error) {
      console.error("Error during import:", error);
      alert("Terjadi kesalahan saat import data");
    } finally {
      setIsLoading(false);
      setImportData([]);
      setImportPreview(false);
      setShowImportModal(false);
    }
  };

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template Mata Kuliah");

    // Add headers
    worksheet.columns = [
      { header: "Kode Matkul", key: "kodeMatkul", width: 15 },
      { header: "Nama Mata Kuliah", key: "namaMatkul", width: 35 },
      { header: "Kelas", key: "kelas", width: 10 },
      { header: "SKS", key: "sks", width: 10 },
      { header: "Tahun Ajaran", key: "tahunAjaran", width: 20 },
      {
        header: "NIK Dosen (pisahkan dengan koma)",
        key: "dosenNpm",
        width: 35,
      },
    ];

    // Add sample data dengan format semester
    worksheet.addRow({
      kodeMatkul: "AIF233301",
      namaMatkul: "Algoritma dan Pemrograman",
      kelas: "A",
      sks: 3,
      tahunAjaran: "2024/2025 Ganjil",
      dosenNpm: "2025060201",
    });

    worksheet.addRow({
      kodeMatkul: "AIF233301",
      namaMatkul: "Algoritma dan Pemrograman",
      kelas: "B",
      sks: 3,
      tahunAjaran: "2024/2025 Ganjil",
      dosenNpm: "2025060201,2025060202",
    });

    worksheet.addRow({
      kodeMatkul: "AIF233302",
      namaMatkul: "Struktur Data",
      kelas: "A",
      sks: 3,
      tahunAjaran: "2024/2025 Genap",
      dosenNpm: "2025060201",
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

    // Add data validation untuk tahun ajaran (opsional)
    // worksheet.getCell('E2').dataValidation = {
    //   type: 'list',
    //   allowBlank: true,
    //   formulae: ['"2024/2025 Ganjil,2024/2025 Genap,2025/2026 Ganjil,2025/2026 Genap"']
    // };

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
        { header: "Kelas", key: "kelas", width: 10 },
        { header: "SKS", key: "sks", width: 10 },
        { header: "Tahun Ajaran", key: "tahunAjaran", width: 20 },
        { header: "Dosen Pengampu", key: "dosenPengampu", width: 40 },
        { header: "NIK Dosen", key: "npmDosen", width: 35 },
      ];

      // Add data
      mataKuliah.forEach((mk) => {
        worksheet.addRow({
          kodeMatkul: mk.kodeMatkul || mk.kode_mk,
          namaMatkul: mk.namaMatkul || mk.nama,
          kelas: mk.kelas,
          sks: mk.sks,
          tahunAjaran: mk.tahunAjaran || mk.tahun_ajaran,
          dosenPengampu: (mk.dosenPengampu || mk.dosen_pengampu || [])
            .map((d) => d.nama)
            .join(", "),
          npmDosen: (mk.dosenPengampu || mk.dosen_pengampu || [])
            .map((d) => d.npm)
            .join(", "),
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
    <div className="w-full max-6-7xl mx-auto">
      <div className="flex flex-col space-y-4">
        {/* Header */}
        <div className="">
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
        <div className="">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari nama mata kuliah, kode, kelas, atau dosen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="semua">Semua Kelas</option>
                {uniqueKelas.map((kelas) => (
                  <option key={kelas} value={kelas}>
                    {kelas}
                  </option>
                ))}
              </select>
              <select
                value={filterTahunAjaran}
                onChange={(e) => setFilterTahunAjaran(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="semua">Semua Tahun Ajaran</option>
                {tahunAjaranOptions.map((tahun) => (
                  <option key={tahun} value={tahun}>
                    {tahun}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-500">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-white tracking-wider rounded-l-md">
                  Kode
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-white tracking-wider">
                  Nama Mata Kuliah
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-white tracking-wider">
                  Kelas
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-white tracking-wider">
                  SKS
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-white tracking-wider">
                  Tahun Ajaran
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-white tracking-wider">
                  Dosen Pengampu
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-white tracking-wider rounded-r-md">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentMataKuliah.map((mk, index) => {
                // Buat key yang benar-benar unik menggunakan timestamp dan index
                const uniqueKey = `mk-${index}-${
                  mk.id || mk.id_mk || Date.now()
                }-${Math.random().toString(36).substr(2, 9)}`;

                return (
                  <tr
                    key={uniqueKey}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(mk)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {mk.kodeMatkul || mk.kode_mk}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {mk.namaMatkul || mk.nama}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {mk.kelas}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {mk.sks} SKS
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {mk.tahunAjaran || mk.tahun_ajaran}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {mk?.dosenPengampu?.length > 0 ||
                        mk?.dosen_pengampu?.length > 0 ? (
                          <div className="space-y-1">
                            {(mk.dosenPengampu || mk.dosen_pengampu || []).map(
                              (dosen, dosenIndex) => (
                                <div
                                  key={`${uniqueKey}-dosen-${dosenIndex}-${
                                    dosen.id || dosen.nama
                                  }`}
                                  className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded"
                                >
                                  {dosen.nama}
                                </div>
                              )
                            )}
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
                          Ubah
                        </button>
                        <button
                          onClick={() => handleDelete(mk.id || mk.id_mk)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Nonaktifkan
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <DetailMataKuliahModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            mataKuliah={selectedMataKuliah}
          />
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
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(75, 85, 99, 0.4)" }}
        >
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
                      placeholder="e.g., AIF233301"
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kelas
                      </label>
                      <select
                        name="kelas"
                        value={formData.kelas}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {kelasOptions.map((kelas) => (
                          <option key={kelas} value={kelas}>
                            {kelas}
                          </option>
                        ))}
                      </select>
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
                      kelas: "A",
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
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(75, 85, 99, 0.4)" }}
        >
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
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
                            <th className="text-left py-1 px-2">F</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-1 px-2">Kode Matkul</td>
                            <td className="py-1 px-2">Nama Mata Kuliah</td>
                            <td className="py-1 px-2">Kelas</td>
                            <td className="py-1 px-2">SKS</td>
                            <td className="py-1 px-2">Tahun Ajaran</td>
                            <td className="py-1 px-2">NIK Dosen</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <p>
                        • NIK Dosen: Pisahkan dengan koma jika lebih dari satu
                        (contoh: 2025060201,2025060202)
                      </p>
                      <p>• Kelas: Huruf A-Z (contoh: A, B, C)</p>
                      <p>• SKS: Angka 1 s/d 6</p>
                      <p>
                        • Tahun Ajaran: Format YYYY/YYYY Ganjil/Genap (contoh:
                        2024/2025 Ganjil, 2024/2025 Genap)
                      </p>
                      <p>
                        • Catatan: Untuk mata kuliah yang sama dengan kelas
                        berbeda, buat baris terpisah
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
                        disabled={isLoading}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm disabled:opacity-50"
                      >
                        Kembali
                      </button>
                      <button
                        onClick={confirmImport}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                      >
                        {isLoading ? "Importing..." : "Konfirmasi Import"}
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
                            Kelas
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
                          <tr
                            key={`import-preview-${index}`}
                            className="border-b"
                          >
                            <td className="px-4 py-2 text-sm">
                              {mk.kodeMatkul}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {mk.namaMatkul}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                {mk.kelas}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">{mk.sks}</td>
                            <td className="px-4 py-2 text-sm">
                              {mk.tahunAjaran}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {mk?.dosenPengampu?.length > 0 ? (
                                <div className="space-y-1">
                                  {mk?.dosenPengampu?.map((dosen, idx) => (
                                    <div
                                      key={`import-dosen-${index}-${idx}`}
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
                      <li>
                        • Mata kuliah dengan kelas berbeda akan ditambahkan
                        sebagai entri terpisah
                      </li>
                      <li>
                        • Data akan divalidasi sebelum disimpan ke database
                      </li>
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
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
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

"use client";
import React, { useState, useEffect } from "react";
import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import axios from "axios";
import toast from "react-hot-toast";

const KelolaUsers = () => {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/admin/users");

      if (response.data.success) {
        setIsLoading(false);
      }

      setUsers(response.data.data.rows);
    } catch (error) {
      toast.error("Gagal mengambil data dari server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    npm: "",
    nama: "",
    email: "",
    password: "",
    role: "Mahasiswa",
  });

  const [importData, setImportData] = useState([]);
  const [importPreview, setImportPreview] = useState(false);

  // Filter dan search users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.npm.includes(searchTerm);
    const matchesRole = filterRole === "semua" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const hashPassword = async (password) => {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let userData = { ...formData };

      if (
        formData.password &&
        (editingUser === null || formData.password !== "")
      ) {
        userData.password = await hashPassword(formData.password);
      } else if (editingUser && !formData.password) {
        // Jika edit dan password kosong, jangan kirim password (biarkan undefined)
        delete userData.password;
      }

      if (editingUser) {
        // Update user - panggil API PUT dengan axios
        userData.id_user = editingUser.id_user;

        const response = await axios.put("/api/admin/users/ubah", userData);

        if (response.data.success) {
          // Update state users
          setUsers((prev) =>
            prev.map((user) =>
              user.id_user === editingUser.id_user
                ? { ...response.data.data }
                : user
            )
          );

          toast.success("Data user berhasil diubah");
        } else {
          toast.error(response.data.message || "Gagal mengubah data user");
          return;
        }
      } else {
        // Add new user - panggil API POST dengan axios
        const response = await axios.post("/api/admin/users/tambah", userData);

        if (response.data.success) {
          // Tambah ke state users
          setUsers((prev) => [...prev, response.data.data]);
          toast.success("Berhasil menambah user");
        } else {
          toast.error(response.data.message || "Gagal menambah user");
          return;
        }
      }

      // Reset form jika berhasil
      setFormData({
        npm: "",
        nama: "",
        email: "",
        password: "",
        role: "Mahasiswa",
      });
      setEditingUser(null);
      setShowModal(false);
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast.error(error.response.data.message || "Server error");
      } else {
        toast.error("Terjadi error saat menyimpan data user");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      npm: user.npm,
      nama: user.nama,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    // Konfirmasi delete
    if (!confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      return;
    }

    try {
      // Panggil API DELETE dengan axios
      const response = await axios.delete("/api/admin/users/hapus", {
        data: { id_user: userId },
      });

      if (response.data.success) {
        // Update state users - hapus user dari array
        setUsers((prev) => prev.filter((user) => user.id_user !== userId));

        // Optional: tampilkan success message
        toast.success(response.data.message || "Berhasil menghapus user");
      } else {
        toast.error(response.data.message || "Gagal menghapus");
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Terjadi error saat menghapus user");
      }
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
          // Ambil nilai raw dan konversi sesuai tipe data
          const npmValue = row.getCell(1).value;
          const namaValue = row.getCell(2).value;
          const emailValue = row.getCell(3).value;
          const passwordValue = row.getCell(4).value;
          const roleValue = row.getCell(5).value;

          // Konversi NPM ke string dulu, lalu akan dikonversi ke int di API
          const npm = npmValue ? npmValue.toString().trim() : "";
          const nama = namaValue ? namaValue.toString().trim() : "";

          // Handle email hyperlink object
          let email = "";
          if (emailValue) {
            if (typeof emailValue === "object") {
              // Check for hyperlink object structure
              email =
                emailValue.text ||
                emailValue.hyperlink ||
                emailValue.toString();
            } else {
              email = emailValue.toString().trim();
            }
          }

          const password = passwordValue
            ? passwordValue.toString().trim()
            : "password123";
          const role = roleValue ? roleValue.toString().trim() : "Mahasiswa";

          // Validasi NPM harus angka
          if (npm && isNaN(parseInt(npm))) {
            toast.error(
              `NPM pada baris ${rowNumber} harus berupa angka: ${npm}`
            );
            setIsLoading(false);
            return;
          }

          // Validasi data tidak kosong
          if (npm && nama && email) {
            jsonData.push({
              npm,
              nama,
              email,
              password,
              role,
            });
          }
        }
      });

      if (jsonData.length === 0) {
        toast.error("Tidak ada data valid yang ditemukan dalam file Excel");
        return;
      }

      // Hash semua password
      const processedData = await Promise.all(
        jsonData.map(async (userData) => ({
          npm: userData.npm,
          nama: userData.nama,
          email: userData.email, // Email sudah diproses di atas
          password: await hashPassword(userData.password),
          role: userData.role,
        }))
      );

      console.log(processedData);

      setImportData(processedData);
      setImportPreview(true);
    } catch (error) {
      toast.error(
        "Error membaca file Excel. Pastikan format file sesuai template."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const confirmImport = async () => {
    if (importData.length === 0) {
      toast.error("Tidak ada data untuk diimport");
      return;
    }

    setIsLoading(true);

    try {
      // Panggil API POST dengan array data untuk bulk import
      const response = await axios.post("/api/admin/users/tambah", importData);

      if (response.data.success) {
        // Update state users dengan data yang berhasil diimport
        setUsers((prev) => [...prev, ...response.data.data]);
        toast.success(`${response.data.count} user berhasil diimport`);

        // Reset import state
        setImportData([]);
        setImportPreview(false);
        setShowImportModal(false);

        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      // Handle axios error response
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Terjadi error saat mengimport data user");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template Users");

    // Add headers
    worksheet.columns = [
      { header: "NPM", key: "npm", width: 15 },
      { header: "Nama", key: "nama", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Password", key: "password", width: 30 },
      { header: "Role", key: "role", width: 15 },
    ];

    // Add sample data
    worksheet.addRow({
      npm: "6181901072",
      nama: "Nama mahasiswa",
      email: "mahasiswa@gmail.com",
      password: "password123",
      role: "Mahasiswa",
    });

    worksheet.addRow({
      npm: "2025060201",
      nama: "Nama dosen",
      email: "dosen@gmail.com",
      password: "password123",
      role: "Dosen",
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
    a.download = "template_users.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportUsers = async () => {
    setIsLoading(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Data Users");

      // Add headers
      worksheet.columns = [
        { header: "NPM", key: "npm", width: 20 },
        { header: "Nama", key: "nama", width: 30 },
        { header: "Email", key: "email", width: 30 },
        { header: "Role", key: "role", width: 15 },
      ];

      // Add data (exclude password for security)
      users.forEach((user) => {
        worksheet.addRow({
          npm: user.npm,
          nama: user.nama,
          email: user.email,
          role: user.role,
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
      a.download = `data_users_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Error saat export data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:max-w-6xl mx-auto justify-center">
      <div className="">
        {/* Header */}
        <div className="">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Kelola Pengguna
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Kelola data mahasiswa dan dosen
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={exportUsers}
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
                Tambah User
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari nama, email, atau NPM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-2 py-2.5 border border-gray-300 rounded-lg"
              >
                <option value="semua">Semua Role</option>
                <option value="Mahasiswa">Mahasiswa</option>
                <option value="Dosen">Dosen</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pt-4">
          <table className="w-full">
            <thead className="bg-blue-500">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-white tracking-wider rounded-l-md">
                  NPM
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-white tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-white tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-white tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-white tracking-wider rounded-r-md">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.map((user) => (
                <tr key={user.id_user} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.npm || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.nama}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === "Dosen"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ubah
                      </button>
                      <button
                        onClick={() => handleDelete(user.id_user)}
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
                Menampilkan {indexOfFirstUser + 1}-
                {Math.min(indexOfLastUser, filteredUsers.length)} dari{" "}
                {filteredUsers.length} data
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

      {/* Modal Add/Edit User */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(75, 85, 99, 0.4)" }}
        >
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingUser ? "Ubah User" : "Tambah User Baru"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NPM
                </label>
                <input
                  type="text"
                  name="npm"
                  value={formData?.npm || ""}
                  onChange={handleInputChange}
                  placeholder="Nomor Pokok Mahasiswa / NIP"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg "
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleInputChange}
                  placeholder="Masukkan nama lengkap"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="users@gmail.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password{" "}
                  {editingUser && "(Kosongkan jika tidak ingin mengubah)"}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                  placeholder={
                    editingUser
                      ? "Kosongkan jika tidak ingin mengubah"
                      : "Masukkan password"
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Mahasiswa">Mahasiswa</option>
                  <option value="Dosen">Dosen</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({
                      npm: "",
                      nama: "",
                      email: "",
                      password: "",
                      role: "Mahasiswa",
                    });
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
                    : editingUser
                    ? "Ubah"
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
                Import Data Excel
              </h2>
            </div>

            <div className="px-6 py-4">
              {!importPreview ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">
                      Upload file Excel dengan format kolom:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <table className="text-xs w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1 px-2">Kolom A</th>
                            <th className="text-left py-1 px-2">Kolom B</th>
                            <th className="text-left py-1 px-2">Kolom C</th>
                            <th className="text-left py-1 px-2">Kolom D</th>
                            <th className="text-left py-1 px-2">Kolom E</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-1 px-2">NPM</td>
                            <td className="py-1 px-2">Nama</td>
                            <td className="py-1 px-2">Email</td>
                            <td className="py-1 px-2">Password</td>
                            <td className="py-1 px-2">Role</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      * Password akan di-hash secara otomatis menggunakan bcrypt
                      <br />* Jika password kosong, akan menggunakan
                      "password123" sebagai default
                    </p>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={downloadTemplate}
                      disabled={isLoading}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
                    >
                      Download Template
                    </button>
                  </div>

                  <div className="flex flex-col space-x-4">
                    <h2>Upload file Excel</h2>
                    <p className="text-xs text-gray-500 mt-2">
                      * Format yang diterima (.xlsx dan .xls)
                      <br />* Maksimal ukuran file 1 Mb
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileImport}
                      disabled={isLoading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 cursor-pointer"
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
                            NPM
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">
                            Nama
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">
                            Email
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">
                            Role
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b">
                            Password Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData.slice(0, 50).map((user, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2 text-sm">{user.npm}</td>
                            <td className="px-4 py-2 text-sm">{user.nama}</td>
                            <td className="px-4 py-2 text-sm">{user.email}</td>
                            <td className="px-4 py-2 text-sm">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.role === "Dosen"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Hashed
                              </span>
                            </td>
                          </tr>
                        ))}
                        {importData.length > 50 && (
                          <tr>
                            <td
                              colSpan="5"
                              className="px-4 py-2 text-sm text-gray-500 text-center"
                            >
                              ... dan {importData.length - 50} data lainnya
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
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
        </div>
      )}
    </div>
  );
};

export default KelolaUsers;

"use client";
import { useState, useEffect, Fragment } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { FiLogOut } from "react-icons/fi";

const DaftarKelompok = () => {
  const [dataKelompok, setDataKelompok] = useState([]);
  const [formPenilaian, setFormPenilaian] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("daftar-kelompok");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalUbahOpen, setIsModalUbahOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_kelompok: "",
    kapasitas: 4,
  });
  const [formUbahData, setFormUbahData] = useState({
    nama_kelompok: "",
    kapasitas: 4,
  });
  const { isOpen, openModal, closeModal, initialData } =
    usePeerEvaluationModal();
  const [isUbahKelompokId, setIsUbahKelompokId] = useState("");
  const [isAnggotaModalOpen, setIsAnggotaModalOpen] = useState(false);
  const [selectedKelompok, setSelectedKelompok] = useState(null);
  const [anggotaKelompok, setAnggotaKelompok] = useState([]);
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
        id_user: session?.user?.id,
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
        id_user: session?.user?.id,
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

  const handleChangeStatusForm = async (formId, status) => {
    try {
      const response = await axios.put("/api/formpenilaian/ubahstatus", {
        id_form: formId,
        status: status,
      });

      if (response.data.success) {
        setIsModalOpen(false);
        setFormData({
          nama_kelompok: "",
          kapasitas: "5", // default-nya string
        });
        fetchFormPenilaian();
      } else {
        setError(response.data.message || "Gagal membuat kelompok");
      }
    } catch (error) {
      console.error("Error saat mengubah status form", error);
    }
  };

  // Tab rendering logic
  const renderTabContent = () => {
    switch (activeTab) {
      case "daftar-kelompok":
        return (
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-[2fr_3fr_2fr] gap-4 px-4 py-3 bg-blue-500 rounded-md font-semibold text-zinc-100 text-sm">
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
                        <button
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all text-sm"
                          onClick={() => handleViewAnggota(daftarKelompok)}
                        >
                          Lihat
                        </button>
                        {session?.user?.role === "Dosen" && (
                          <button
                            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-all text-sm"
                            onClick={() =>
                              handleUbahKelompok(daftarKelompok?.id_kelompok)
                            }
                          >
                            Ubah
                          </button>
                        )}
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
            <div className="grid grid-cols-[2.5fr_1fr_1fr_2fr] gap-4 px-4 py-3 bg-blue-500 rounded-md font-semibold text-zinc-100 text-sm">
              <div className="truncate whitespace-nowrap">Nama Form</div>
              <div className="truncate whitespace-nowrap">Jenis Form</div>
              <div className="truncate whitespace-nowrap">Status</div>
              <div className="truncate whitespace-nowrap">Aksi</div>
            </div>

            <ul className="space-y-2">
              {(() => {
                // Filter dulu sesuai role
                const visibleForms =
                  session?.user?.role === "Mahasiswa"
                    ? formPenilaian.filter((form) => form.status)
                    : formPenilaian;

                if (visibleForms.length === 0) {
                  return (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-sm text-gray-500">
                        Form penilaian belum tersedia
                      </p>
                    </div>
                  );
                }

                return visibleForms.map((form) => (
                  <li
                    key={form?.id_form}
                    className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="grid grid-cols-[2.5fr_1fr_1fr_2fr] gap-4 items-center">
                      <div className="text-sm text-gray-800">{form?.nama}</div>
                      <div className="text-sm text-gray-800">{form?.jenis}</div>
                      <div className="text-sm text-gray-800">
                        {form?.status ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      {session?.user?.role === "Dosen" ? (
                        <div className="space-x-2 space-y-2 lg:space-y-0">
                          <button className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-all text-sm">
                            Ubah
                          </button>
                          {form?.status ? (
                            <button
                              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all text-sm"
                              onClick={() =>
                                handleChangeStatusForm(form?.id_form, false)
                              }
                            >
                              Nonaktifkan
                            </button>
                          ) : (
                            <button
                              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-all text-sm"
                              onClick={() =>
                                handleChangeStatusForm(form?.id_form, true)
                              }
                            >
                              Aktifkan
                            </button>
                          )}
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
                ));
              })()}
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

  const handleUbahKelompok = async (kelompokId) => {
    setIsModalUbahOpen(true);
    setIsUbahKelompokId(kelompokId);
    try {
      const response = await axios.post(
        "/api/daftarkelompok/fetchubahkelompok",
        {
          id_kelompok: kelompokId,
        }
      );

      const namaKelompok = response?.data?.data?.nama_kelompok;
      const kapasitas = response?.data?.data?.kapasitas;

      if (response.data.success) {
        setFormUbahData({
          nama_kelompok: namaKelompok,
          kapasitas: kapasitas,
        });
      } else {
        setError(response.data.message || "Gagal mengambil data kelompok");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Terjadi kesalahan saat mengambil data kelompok");
    }
  };

  // Add these functions to handle form changes and submission
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUbahChange = (e) => {
    const { name, value } = e.target;

    setFormUbahData((prev) => ({
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
        id_user: session?.user?.id,
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

  const handleUbah = async (e) => {
    e.preventDefault();
    setError("");

    if (!formUbahData.nama_kelompok.trim()) {
      setError("Nama kelompok tidak boleh kosong");
      return;
    }

    const kapasitas = parseInt(formUbahData.kapasitas);

    if (isNaN(kapasitas) || kapasitas < 2 || kapasitas > 20) {
      setError("Kapasitas harus berupa angka antara 2 hingga 20");
      return;
    }

    try {
      setIsSubmitting(true);
      const { id_mk } = parseMatkulParam(params.matkul);

      const response = await axios.put("/api/daftarkelompok/ubah", {
        nama_kelompok: formUbahData.nama_kelompok,
        kapasitas,
        id_kelompok: isUbahKelompokId,
        id_mk,
        id_user: session?.user?.id,
      });

      if (response.data.success) {
        setIsModalOpen(false);
        setFormUbahData({
          nama_kelompok: "",
          kapasitas: "4", // default-nya string
        });
        fetchKelompok();
        setIsModalUbahOpen(false);
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

  const fetchAnggotaKelompok = async (kelompokId) => {
    try {
      const response = await axios.post("/api/daftarkelompok/fetchanggota", {
        id_kelompok: kelompokId,
      });

      // console.log(response.data.rows);

      if (response.data.success) {
        setAnggotaKelompok(response.data.rows || []);
      } else {
        setAnggotaKelompok([]);
        console.error("Failed to fetch anggota:", response.data.message);
      }
    } catch (error) {
      setAnggotaKelompok([]);
      console.error("Error fetching anggota kelompok:", error);
    }
  };

  // Add this handler for the view button
  const handleViewAnggota = (kelompok) => {
    setSelectedKelompok(kelompok);
    fetchAnggotaKelompok(kelompok.id_kelompok);
    setIsAnggotaModalOpen(true);
  };

  const handleKeluarKelompok = async (kelompokId) => {
    try {
      // Confirm before leaving the group
      if (
        !window.confirm("Apakah Anda yakin ingin keluar dari kelompok ini?")
      ) {
        return;
      }

      // Call the API to leave the group
      const response = await axios.post("/api/daftarkelompok/keluar", {
        id_kelompok: kelompokId,
        id_user: session?.user?.id,
      });

      if (response.data.success) {
        // Refresh the anggota list
        fetchAnggotaKelompok(kelompokId);

        // Refresh the main kelompok list to update counts
        fetchKelompok();

        // Show success message (optional)
        alert("Berhasil keluar dari kelompok");
      } else {
        alert(response.data.message || "Gagal keluar dari kelompok");
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      alert("Terjadi kesalahan saat keluar dari kelompok");
    }
  };

  const handleKeluarkanKelompok = async (userId, kelompokId) => {
    try {
      // Confirm before leaving the group
      if (
        !window.confirm(
          "Apakah Anda yakin ingin mengeluarkannya dari kelompok?"
        )
      ) {
        return;
      }

      // Call the API to leave the group
      const response = await axios.post("/api/daftarkelompok/keluar", {
        id_kelompok: kelompokId,
        id_user: userId,
      });

      if (response.data.success) {
        // Refresh the anggota list
        fetchAnggotaKelompok(kelompokId);

        // Refresh the main kelompok list to update counts
        fetchKelompok();

        // Show success message (optional)
        alert("Berhasil mengeluarkan mahasiswa dari kelompok");
      } else {
        alert(
          response.data.message || "Gagal mengeluarkan mahasiswa dari kelompok"
        );
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      alert("Terjadi kesalahan saat mengeluarkan mahasiswa dari kelompok");
    }
  };

  const handleGabungKelompok = async (kelompokId) => {
    try {
      // Konfirmasi sebelum bergabung
      if (
        !window.confirm("Apakah Anda yakin ingin bergabung ke kelompok ini?")
      ) {
        return;
      }

      // Panggil API untuk bergabung ke kelompok
      const response = await axios.post("/api/daftarkelompok/gabung", {
        id_kelompok: kelompokId,
        id_user: session?.user?.id,
        peran: "Anggota", // default peran
      });

      if (response.data.success) {
        // Refresh daftar anggota kelompok
        fetchAnggotaKelompok(kelompokId);

        // Refresh daftar kelompok utama (untuk update jumlah anggota)
        fetchKelompok();

        // Tampilkan pesan sukses
        alert("Berhasil bergabung ke kelompok");
      } else {
        alert(response.data.message || "Gagal bergabung ke kelompok");
      }
    } catch (error) {
      console.error("Error joining group:", error);
      alert("Terjadi kesalahan saat bergabung ke kelompok");
    }
  };

  const handleJadiKetua = async (kelompokId) => {
    if (
      !window.confirm("Apakah Anda yakin ingin menjadi ketua di kelompok ini?")
    ) {
      return;
    }

    try {
      const response = await axios.post(
        "/api/daftarkelompok/jadiketuakelompok",
        {
          id_kelompok: kelompokId,
          id_user: session?.user?.id,
        }
      );

      if (response.data.success) {
        alert("Berhasil menjadi ketua!");
        fetchAnggotaKelompok(kelompokId); // refresh data
      } else {
        alert(response.data.message || "Gagal menjadi ketua");
      }
    } catch (error) {
      console.error("Gagal menjadikan ketua:", error);
      alert("Terjadi kesalahan saat mencoba jadi ketua");
    }
  };

  const handleUndurKetua = async (kelompokId) => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin mengudurkan diri dari ketua di kelompok ini?"
      )
    ) {
      return;
    }
    try {
      const response = await axios.post("/api/daftarkelompok/ketuaundurdiri", {
        id_kelompok: kelompokId,
        id_user: session?.user?.id,
      });

      if (response.data.success) {
        alert("Berhasil mengudurkan diri!");
        fetchAnggotaKelompok(kelompokId); // refresh data
      } else {
        alert(response.data.message || "Gagal mengudurkan diri!");
      }
    } catch (error) {
      console.error("Gagal mengudurkan diri:", error);
      alert("Terjadi kesalahan saat mencoba mengudurkan diri dari ketua");
    }
  };

  const getKomponenByJenisForm = (formData) => {
    const result = {
      anggota_ke_anggota: [],
      anggota_ke_ketua: [],
      ketua_ke_anggota: [],
    };

    if (formData.jenis_form === "1") {
      result.anggota_ke_anggota = formData.komponen_anggota_ke_anggota.map(
        (item) => ({
          ...item,
          tipe_penilaian: "Anggota ke Anggota",
        })
      );

      result.anggota_ke_ketua = formData.komponen_anggota_ke_ketua.map(
        (item) => ({
          ...item,
          tipe_penilaian: "Anggota ke Ketua",
        })
      );
    } else if (formData.jenis_form === "2") {
      result.anggota_ke_anggota = formData.komponen_anggota_ke_anggota.map(
        (item) => ({
          ...item,
          tipe_penilaian: "Anggota ke Anggota",
        })
      );
    } else if (formData.jenis_form === "3") {
      result.ketua_ke_anggota = formData.komponen_ketua_ke_anggota.map(
        (item) => ({
          ...item,
          tipe_penilaian: "Ketua ke Anggota",
        })
      );
    }

    return result;
  };

  const handleSubmitForm = (formData) => {
    const komponenYangDipakai = getKomponenByJenisForm(formData);
    console.log(formData.jenis_form);
    console.log(komponenYangDipakai);
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
                  ? "border-blue-500 font-bold text-blue-500"
                  : "border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Daftar Kelompok
            </button>
            <button
              onClick={() => setActiveTab("form-penilaian")}
              className={`py-3 px-4 text-sm transition-colors border-b-2 ${
                activeTab === "form-penilaian"
                  ? "border-blue-500 font-bold text-blue-500"
                  : "border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Form Penilaian
            </button>
            <button
              onClick={() => setActiveTab("rekap-nilai")}
              className={`py-3 px-4 text-sm transition-colors border-b-2 ${
                activeTab === "rekap-nilai"
                  ? "border-blue-500 font-bold text-blue-500"
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
                  className="px-4 py-2 border-1 border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-all text-sm"
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
                <button
                  className="px-4 py-2 border-1 border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-all text-sm"
                  onClick={() => openModal()}
                >
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

      <AnggotaKelompokModal
        isOpen={isAnggotaModalOpen}
        onClose={() => setIsAnggotaModalOpen(false)}
        kelompok={selectedKelompok}
        anggotaList={anggotaKelompok}
        currentIdUser={session?.user?.id}
        onKeluarKelompok={handleKeluarKelompok}
        onKeluarkanKelompok={handleKeluarkanKelompok}
        onGabungKelompok={handleGabungKelompok}
        onJadiKetua={handleJadiKetua}
        onUndurKetua={handleUndurKetua}
        userRole={session?.user?.role}
      />

      <TambahKelompokModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        error={error}
        isSubmitting={isSubmitting}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
      />

      <UbahKelompokModal
        isOpen={isModalUbahOpen}
        onClose={() => setIsModalUbahOpen(false)}
        formData={formUbahData}
        error={error}
        isSubmitting={isSubmitting}
        handleChange={handleUbahChange}
        handleSubmit={handleUbah}
      />

      <PeerEvaluationModal
        isOpen={isOpen}
        onClose={closeModal}
        onSubmit={handleSubmitForm}
        initialData={initialData}
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

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UbahKelompokModal = ({
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

        <h2 className="text-xl font-semibold mb-4">Ubah Kelompok</h2>

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

          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-md"
            >
              Hapus
            </button>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Menyimpan..." : "Perbarui"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const AnggotaKelompokModal = ({
  isOpen,
  onClose,
  kelompok,
  anggotaList = [],
  currentIdUser,
  onKeluarKelompok,
  onKeluarkanKelompok,
  onGabungKelompok,
  onJadiKetua,
  onUndurKetua,
  userRole,
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

        <h2 className="text-xl font-semibold mb-4">
          Anggota {kelompok?.nama_kelompok || "Kelompok"}
        </h2>

        <div className="mb-2 text-sm text-gray-600">
          {anggotaList.length} / {kelompok?.kapasitas} anggota
        </div>

        {anggotaList.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200 text-center">
            <p className="text-gray-500">
              Belum ada anggota dalam kelompok ini
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <ul className="divide-y divide-gray-200">
              {anggotaList.map((anggota, index) => (
                <li key={anggota.id_user || index} className="py-3 px-2">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 min-w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      <span className="text-lg font-medium">
                        {anggota.nama_user?.charAt(0) || "User"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {anggota.nama_user || "Nama tidak tersedia"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {anggota.npm || anggota.nip || "ID tidak tersedia"}
                      </p>
                    </div>
                    {anggota.peran === "Ketua" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Ketua
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        Anggota
                      </span>
                    )}

                    {userRole === "Dosen" && (
                      <div>
                        <button
                          type="button"
                          className="flex items-center gap-1 px-2 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-md"
                          onClick={() =>
                            onKeluarkanKelompok(
                              anggota?.id_user,
                              kelompok?.id_kelompok
                            )
                          }
                        >
                          <FiLogOut size={18} />
                          Keluarkan
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {anggotaList.some((anggota) => anggota.id_user == currentIdUser) ? (
          <div className="mt-6 space-y-3">
            {/* If I'm already ketua, show undur ketua button */}
            {anggotaList.find(
              (anggota) =>
                anggota.id_user == currentIdUser && anggota.peran === "Ketua"
            ) ? (
              <button
                onClick={() => onUndurKetua(kelompok?.id_kelompok)}
                className="w-full px-4 py-2 text-white bg-yellow-500 hover:bg-yellow-600 rounded-md"
              >
                Undur diri dari ketua
              </button>
            ) : (
              /* If there's no ketua yet, show jadi ketua button */
              !anggotaList.some((anggota) => anggota.peran === "Ketua") && (
                <button
                  type="button"
                  onClick={() => onJadiKetua(kelompok?.id_kelompok)}
                  className="w-full px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-md"
                >
                  Jadikan saya ketua
                </button>
              )
            )}

            {/* Tombol keluar dan batal */}
            <div className="flex justify-between space-x-4">
              <button
                type="button"
                onClick={() => onKeluarKelompok(kelompok?.id_kelompok)}
                className="w-full px-4 py-2 text-white border rounded-md bg-red-500 hover:bg-red-600"
              >
                Keluar dari kelompok
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Batal
              </button>
            </div>
          </div>
        ) : anggotaList.length < kelompok?.kapasitas ? (
          userRole === "Mahasiswa" && (
            <div className="mt-6 flex justify-between space-x-4">
              <button
                type="button"
                onClick={() => onGabungKelompok(kelompok?.id_kelompok)}
                className="w-full px-4 py-2 text-white border rounded-md bg-blue-500 hover:bg-blue-500"
              >
                Gabung
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Batal
              </button>
            </div>
          )
        ) : (
          <div className="mt-6 flex justify-between space-x-4">
            <button
              type="button"
              className="w-full px-4 py-2 text-gray-700 border bg-gray-200 border-gray-300 rounded-md disabled"
            >
              Penuh
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const usePeerEvaluationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialData, setInitialData] = useState(null);

  const openModal = (data = null) => {
    setInitialData(data);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setInitialData(null);
  };

  return {
    isOpen,
    openModal,
    closeModal,
    initialData,
  };
};

const ModalBackdrop = ({ children, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity z-0"
          style={{ backgroundColor: "rgba(75,85,99,0.4" }}
          // onClick={onClose}
          aria-hidden="true"
        ></div>
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

// Form Penilaian Sejawat Component
const PeerEvaluationForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    nama_form: initialData?.nama_form || "",
    jenis_form: initialData?.jenis_form || "1",
    komponen_anggota_ke_anggota: initialData?.komponen_anggota_ke_anggota || [
      { nama_komponen: "", bobot: "", deskripsi: "" },
    ],
    komponen_anggota_ke_ketua: initialData?.komponen_anggota_ke_ketua || [
      { nama_komponen: "", bobot: "", deskripsi: "" },
    ],
    komponen_ketua_ke_anggota: initialData?.komponen_ketua_ke_anggota || [
      { nama_komponen: "", bobot: "", deskripsi: "" },
    ],
    jenis3_option: initialData?.jenis3_option || "anggota_ke_anggota",
  });

  const [errors, setErrors] = useState({});
  const [isKetua, setIsKetua] = useState(true); // Asumsi: nilai ini akan diambil dari konteks autentikasi

  // Reset form berdasarkan jenis yang dipilih
  useEffect(() => {
    if (formData.jenis_form === "2") {
      setFormData((prev) => ({
        ...prev,
        komponen_anggota_ke_ketua: [],
        komponen_ketua_ke_anggota: [],
      }));
    } else if (formData.jenis_form === "1") {
      if (formData.komponen_anggota_ke_ketua.length === 0) {
        setFormData((prev) => ({
          ...prev,
          komponen_anggota_ke_ketua: [
            { nama_komponen: "", bobot: "", deskripsi: "" },
          ],
          komponen_ketua_ke_anggota: [],
        }));
      }
    } else if (formData.jenis_form === "3") {
      if (formData.komponen_ketua_ke_anggota.length === 0) {
        setFormData((prev) => ({
          ...prev,
          komponen_anggota_ke_ketua: [],
          komponen_ketua_ke_anggota: [
            { nama_komponen: "", bobot: "", deskripsi: "" },
          ],
        }));
      }
    }
  }, [formData.jenis_form]);

  // Reset form saat initialData berubah
  useEffect(() => {
    if (initialData) {
      setFormData({
        nama_form: initialData.nama_form || "",
        jenis_form: initialData.jenis_form || "1",
        komponen_anggota_ke_anggota:
          initialData.komponen_anggota_ke_anggota || [
            { nama_komponen: "", bobot: "", deskripsi: "" },
          ],
        komponen_anggota_ke_ketua: initialData.komponen_anggota_ke_ketua || [
          { nama_komponen: "", bobot: "", deskripsi: "" },
        ],
        komponen_ketua_ke_anggota: initialData.komponen_ketua_ke_anggota || [
          { nama_komponen: "", bobot: "", deskripsi: "" },
        ],
        jenis3_option: initialData.jenis3_option || "anggota_ke_anggota",
      });
    }
  }, [initialData]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleKomponenChange = (index, field, value, type) => {
    let komponenKey;

    if (type === "anggota_ke_anggota") {
      komponenKey = "komponen_anggota_ke_anggota";
    } else if (type === "anggota_ke_ketua") {
      komponenKey = "komponen_anggota_ke_ketua";
    } else if (type === "ketua_ke_anggota") {
      komponenKey = "komponen_ketua_ke_anggota";
    }

    // Jika field adalah bobot, pastikan hanya bilangan bulat dan maksimal 3 digit
    if (field === "bobot") {
      // Hapus semua karakter non-digit
      value = value.replace(/[^\d]/g, "");

      // Batasi maksimal 3 digit
      if (value.length > 3) {
        value = value.slice(0, 3);
      }

      // Jika value bukan string kosong, konversi ke integer string lagi
      if (value !== "") {
        value = parseInt(value, 10).toString();
      }
    }

    const updatedKomponen = [...formData[komponenKey]];
    updatedKomponen[index] = {
      ...updatedKomponen[index],
      [field]: value,
    };

    setFormData((prev) => ({
      ...prev,
      [komponenKey]: updatedKomponen,
    }));
  };

  const addKomponen = (type) => {
    let komponenKey;

    if (type === "anggota_ke_anggota") {
      komponenKey = "komponen_anggota_ke_anggota";
    } else if (type === "anggota_ke_ketua") {
      komponenKey = "komponen_anggota_ke_ketua";
    } else if (type === "ketua_ke_anggota") {
      komponenKey = "komponen_ketua_ke_anggota";
    }

    setFormData((prev) => ({
      ...prev,
      [komponenKey]: [
        ...prev[komponenKey],
        { nama_komponen: "", bobot: "", deskripsi: "" },
      ],
    }));
  };

  const removeKomponen = (index, type) => {
    let komponenKey;

    if (type === "anggota_ke_anggota") {
      komponenKey = "komponen_anggota_ke_anggota";
    } else if (type === "anggota_ke_ketua") {
      komponenKey = "komponen_anggota_ke_ketua";
    } else if (type === "ketua_ke_anggota") {
      komponenKey = "komponen_ketua_ke_anggota";
    }

    if (formData[komponenKey].length > 1) {
      const updatedKomponen = [...formData[komponenKey]];
      updatedKomponen.splice(index, 1);

      setFormData((prev) => ({
        ...prev,
        [komponenKey]: updatedKomponen,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nama_form.trim()) {
      newErrors.nama_form = "Nama form harus diisi";
    }

    // Validasi komponen_anggota_ke_anggota untuk jenis 1 & 2
    if (formData.jenis_form === "1" || formData.jenis_form === "2") {
      let totalBobotAnggota = 0;
      formData.komponen_anggota_ke_anggota.forEach((item, index) => {
        if (!item.nama_komponen.trim()) {
          newErrors[`anggota_ke_anggota_${index}_nama`] =
            "Nama komponen harus diisi";
        }
        if (!item.bobot) {
          newErrors[`anggota_ke_anggota_${index}_bobot`] = "Bobot harus diisi";
        } else {
          const bobot = parseInt(item.bobot);
          if (isNaN(bobot) || bobot <= 0) {
            newErrors[`anggota_ke_anggota_${index}_bobot`] =
              "Bobot harus berupa angka positif";
          } else {
            totalBobotAnggota += bobot;
          }
        }
        if (!item.deskripsi || !item.deskripsi.trim()) {
          newErrors[`anggota_ke_anggota_${index}_deskripsi`] =
            "Deskripsi komponen harus diisi";
        }
      });
      if (totalBobotAnggota !== 100) {
        newErrors.total_bobot_anggota = "Total bobot harus 100%";
      }
    }

    // Validasi komponen_anggota_ke_ketua khusus jenis 1
    if (formData.jenis_form === "1") {
      let totalBobotKetua = 0;
      formData.komponen_anggota_ke_ketua.forEach((item, index) => {
        if (!item.nama_komponen.trim()) {
          newErrors[`anggota_ke_ketua_${index}_nama`] =
            "Nama komponen harus diisi";
        }
        if (!item.bobot) {
          newErrors[`anggota_ke_ketua_${index}_bobot`] = "Bobot harus diisi";
        } else {
          const bobot = parseInt(item.bobot);
          if (isNaN(bobot) || bobot <= 0) {
            newErrors[`anggota_ke_ketua_${index}_bobot`] =
              "Bobot harus berupa angka positif";
          } else {
            totalBobotKetua += bobot;
          }
        }
        if (!item.deskripsi || !item.deskripsi.trim()) {
          newErrors[`anggota_ke_ketua_${index}_deskripsi`] =
            "Deskripsi komponen harus diisi";
        }
      });
      if (totalBobotKetua !== 100) {
        newErrors.total_bobot_ketua = "Total bobot harus 100%";
      }
    }

    // Validasi komponen_ketua_ke_anggota khusus jenis 3
    if (formData.jenis_form === "3") {
      let totalBobotKetuaAnggota = 0;
      formData.komponen_ketua_ke_anggota.forEach((item, index) => {
        if (!item.nama_komponen.trim()) {
          newErrors[`ketua_ke_anggota_${index}_nama`] =
            "Nama komponen harus diisi";
        }
        if (!item.bobot) {
          newErrors[`ketua_ke_anggota_${index}_bobot`] = "Bobot harus diisi";
        } else {
          const bobot = parseInt(item.bobot);
          if (isNaN(bobot) || bobot <= 0) {
            newErrors[`ketua_ke_anggota_${index}_bobot`] =
              "Bobot harus berupa angka positif";
          } else {
            totalBobotKetuaAnggota += bobot;
          }
        }
        if (!item.deskripsi || !item.deskripsi.trim()) {
          newErrors[`ketua_ke_anggota_${index}_deskripsi`] =
            "Deskripsi komponen harus diisi";
        }
      });
      if (totalBobotKetuaAnggota !== 100) {
        newErrors.total_bobot_ketua_anggota = "Total bobot harus 100%";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderKomponenTable = (type) => {
    let komponenKey, title, errorKey;

    if (type === "anggota_ke_anggota") {
      komponenKey = "komponen_anggota_ke_anggota";
      title = "KOMPONEN PENILAIAN ANGGOTA KE ANGGOTA";
      errorKey = "total_bobot_anggota";
    } else if (type === "anggota_ke_ketua") {
      komponenKey = "komponen_anggota_ke_ketua";
      title = "KOMPONEN PENILAIAN ANGGOTA KE KETUA";
      errorKey = "total_bobot_ketua";
    } else if (type === "ketua_ke_anggota") {
      komponenKey = "komponen_ketua_ke_anggota";
      title = "KOMPONEN PENILAIAN KETUA KE ANGGOTA";
      errorKey = "total_bobot_ketua_anggota";
    }

    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        <div className="overflow-x-auto mt-2">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700">
                  Nama Komponen
                </th>
                <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700">
                  Bobot
                </th>
                <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700">
                  Deskripsi Komponen
                </th>
                <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {formData[komponenKey].map((komponen, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border-b border-gray-200">
                    <input
                      type="text"
                      className={`w-full p-2 border ${
                        errors[`${type}_${index}_nama`]
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded`}
                      value={komponen.nama_komponen}
                      onChange={(e) =>
                        handleKomponenChange(
                          index,
                          "nama_komponen",
                          e.target.value,
                          type
                        )
                      }
                      placeholder="Nama Komponen"
                    />
                    {errors[`${type}_${index}_nama`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`${type}_${index}_nama`]}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <input
                        type="number"
                        className={`w-16 p-2 border ${
                          errors[`${type}_${index}_bobot`]
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded`}
                        value={komponen.bobot}
                        onKeyDown={(e) => {
                          if (
                            e.key === "-" ||
                            e.key === "e" ||
                            e.key === "+" ||
                            e.key === "." ||
                            e.key === ","
                          ) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) =>
                          handleKomponenChange(
                            index,
                            "bobot",
                            e.target.value,
                            type
                          )
                        }
                        placeholder="0"
                      />
                      <span className="ml-1">%</span>
                    </div>
                    {errors[`${type}_${index}_bobot`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`${type}_${index}_bobot`]}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200">
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded"
                      value={komponen.deskripsi}
                      onChange={(e) =>
                        handleKomponenChange(
                          index,
                          "deskripsi",
                          e.target.value,
                          type
                        )
                      }
                      placeholder="Deskripsi"
                    />
                    {errors[`${type}_${index}_deskripsi`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`${type}_${index}_deskripsi`]}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => removeKomponen(index, type)}
                      className="text-red-600 hover:text-red-800"
                      disabled={formData[komponenKey].length <= 1}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {errors[errorKey] && (
            <p className="text-red-500 text-sm mt-1">{errors[errorKey]}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => addKomponen(type)}
          className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
          Tambah Komponen
        </button>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          FORM PENILAIAN SEJAWAT
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
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

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Nama Form
          </label>
          <input
            type="text"
            name="nama_form"
            value={formData.nama_form}
            onChange={handleFormChange}
            className={`w-full p-2 border ${
              errors.nama_form ? "border-red-500" : "border-gray-300"
            } rounded`}
            placeholder="Masukkan nama form"
          />
          {errors.nama_form && (
            <p className="text-red-500 text-sm mt-1">{errors.nama_form}</p>
          )}
        </div>

        <div className="mb-6 relative">
          <label className="block text-gray-700 font-medium mb-2">
            Jenis Form
          </label>
          <div className="relative">
            <select
              name="jenis_form"
              value={formData.jenis_form}
              onChange={handleFormChange}
              className="appearance-none w-full p-2 border border-gray-300 rounded bg-white pr-10"
            >
              <option value="1">
                Jenis 1 - Anggota ke Anggota & Anggota ke Ketua
              </option>
              <option value="2">Jenis 2 - Hanya Anggota ke Anggota</option>
              <option value="3">Jenis 3 - Hanya Ketua ke Anggota</option>
            </select>
            {/* Custom arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center px-2 text-gray-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Render komponen anggota ke anggota untuk jenis 1 dan 2 */}
        {(formData.jenis_form === "1" || formData.jenis_form === "2") &&
          renderKomponenTable("anggota_ke_anggota")}

        {/* Render komponen anggota ke ketua untuk jenis 1 */}
        {formData.jenis_form === "1" && renderKomponenTable("anggota_ke_ketua")}

        {/* Render komponen ketua ke anggota untuk jenis 3 */}
        {formData.jenis_form === "3" &&
          isKetua &&
          renderKomponenTable("ketua_ke_anggota")}

        <div className="mt-8 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
};

// Modal Komponen Utama
export const PeerEvaluationModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
}) => {
  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <PeerEvaluationForm
        onSubmit={(formData) => {
          onSubmit(formData);
          onClose();
        }}
        onCancel={onClose}
        initialData={initialData}
      />
    </ModalBackdrop>
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
                  ? "z-10 bg-blue-500 text-white border-blue-500"
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

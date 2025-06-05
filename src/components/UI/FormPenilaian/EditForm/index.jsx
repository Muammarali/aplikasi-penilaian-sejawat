import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiCopy } from "react-icons/fi";
import { FiLoader } from "react-icons/fi";

const EditPeerEvaluationModal = ({
  isOpen,
  onSubmit,
  onClose,
  initialData = null,
  isEditMode = false,
  reFetch,
}) => {
  const [formData, setFormData] = useState({
    nama_form: initialData?.nama_form || "",
    jenis_form: initialData?.jenis_form || "1",
    id_form: initialData?.id_form || null,
    komponen_anggota_ke_anggota: initialData?.komponen_anggota_ke_anggota || [
      { nama_komponen: "", bobot: "", deskripsi: "" },
    ],
    komponen_anggota_ke_ketua: initialData?.komponen_anggota_ke_ketua || [
      { nama_komponen: "", bobot: "", deskripsi: "" },
    ],
    komponen_dosen_ke_ketua: initialData?.komponen_dosen_ke_ketua || [
      { nama_komponen: "", bobot: "", deskripsi: "" },
    ],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form berdasarkan jenis yang dipilih (disabled untuk edit mode)
  useEffect(() => {
    if (!isEditMode) {
      if (formData.jenis_form === "2") {
        setFormData((prev) => ({
          ...prev,
          komponen_anggota_ke_ketua: [],
          komponen_dosen_ke_ketua: [],
        }));
      } else if (formData.jenis_form === "1") {
        if (formData.komponen_anggota_ke_ketua.length === 0) {
          setFormData((prev) => ({
            ...prev,
            komponen_anggota_ke_ketua: [
              { nama_komponen: "", bobot: "", deskripsi: "" },
            ],
            komponen_dosen_ke_ketua: [],
          }));
        }
      } else if (formData.jenis_form === "3") {
        if (formData.komponen_dosen_ke_ketua.length === 0) {
          setFormData((prev) => ({
            ...prev,
            komponen_anggota_ke_ketua: [],
            komponen_dosen_ke_ketua: [
              { nama_komponen: "", bobot: "", deskripsi: "" },
            ],
          }));
        }
      }
    }
  }, [formData.jenis_form, isEditMode]);

  // Reset form saat initialData berubah
  useEffect(() => {
    if (initialData) {
      setFormData({
        nama_form: initialData.nama_form || "",
        jenis_form: initialData.jenis_form || "1",
        id_form: initialData.id_form || null,
        komponen_anggota_ke_anggota:
          initialData.komponen_anggota_ke_anggota || [
            { nama_komponen: "", bobot: "", deskripsi: "" },
          ],
        komponen_anggota_ke_ketua: initialData.komponen_anggota_ke_ketua || [
          { nama_komponen: "", bobot: "", deskripsi: "" },
        ],
        komponen_dosen_ke_ketua: initialData.komponen_dosen_ke_ketua || [
          { nama_komponen: "", bobot: "", deskripsi: "" },
        ],
      });
    }
  }, [initialData]);

  // Early return AFTER all hooks
  if (!isOpen) return null;

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
    } else if (type === "dosen_ke_ketua") {
      komponenKey = "komponen_dosen_ke_ketua";
    }

    // Jika field adalah bobot, pastikan hanya bilangan bulat dan maksimal 3 digit
    if (field === "bobot") {
      value = value.replace(/[^\d]/g, "");
      if (value.length > 3) {
        value = value.slice(0, 3);
      }
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
    } else if (type === "dosen_ke_ketua") {
      komponenKey = "komponen_dosen_ke_ketua";
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
    } else if (type === "dosen_ke_ketua") {
      komponenKey = "komponen_dosen_ke_ketua";
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

    // Validasi nama form
    if (!formData.nama_form.trim()) {
      newErrors.nama_form = "Nama form harus diisi";
    }

    // Untuk jenis 3, hanya validasi nama form
    if (formData.jenis_form === "3") {
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error("Submit error:", error);
      } finally {
        setIsSubmitting(false);
        onClose();
      }
    }
  };

  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);
    onClose();
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
    } else if (type === "dosen_ke_ketua") {
      komponenKey = "komponen_dosen_ke_ketua";
      title = "KOMPONEN PENILAIAN DOSEN KE KETUA";
      errorKey = "total_bobot_dosen_ketua";
    }

    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        <div className="overflow-x-auto mt-2">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700">
                  Nama Komponen
                </th>
                <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700">
                  Bobot
                </th>
                <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700">
                  Deskripsi Komponen
                </th>
                <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {formData[komponenKey].map((komponen, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="py-3 px-4 border-b border-gray-200">
                    <input
                      type="text"
                      className={`w-full p-2 border ${
                        errors[`${type}_${index}_nama`]
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
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
                  <td className="py-3 px-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <input
                        type="number"
                        className={`w-16 p-2 border ${
                          errors[`${type}_${index}_bobot`]
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
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
                      <span className="ml-1 text-gray-600">%</span>
                    </div>
                    {errors[`${type}_${index}_bobot`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`${type}_${index}_bobot`]}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 border-b border-gray-200">
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                  <td className="py-3 px-4 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => removeKomponen(index, type)}
                      className="text-red-600 hover:text-red-800 transition-colors focus:outline-none"
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
            <p className="text-red-500 text-sm mt-2">{errors[errorKey]}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => addKomponen(type)}
          className="mt-3 flex items-center text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
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

  const handleCopyForm = async (form) => {
    try {
      const response = await axios.post("/api/formpenilaian/salin", {
        id_form: form.id_form,
      });

      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(
          response.data.message || "Terjadi kesalahan saat menyalin form"
        );
      }
    } catch (error) {
      console.error("Error copying form:", error);
      toast.error("Terjadi kesalahan saat menyalin form");
    }
  };

  const CopyButton = ({ form, isDisabled = false }) => {
    const [isCopying, setIsCopying] = useState(false);

    const handleCopy = async () => {
      setIsCopying(true);
      await handleCopyForm(form);
      setIsCopying(false);
      onClose();
      reFetch();
    };

    return (
      <button
        onClick={handleCopy}
        disabled={isDisabled || isCopying}
        className="inline-flex items-center px-4 py-2 text-md font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Buat salinan form ini"
      >
        {isCopying ? (
          <>
            <FiLoader className="animate-spin -ml-1 mr-1.5 h-4 w-4" />
            Menyalin...
          </>
        ) : (
          <>
            <FiCopy className="w-4 h-4 mr-1.5" />
            Salin form
          </>
        )}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(75, 85, 99, 0.4)" }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-6 relative overflow-y-auto max-h-[90vh] mx-4">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Tutup"
          disabled={isSubmitting}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          UBAH FORM PENILAIAN SEJAWAT
        </h2>

        {/* Information Section */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg
              className="w-5 h-5 text-blue-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-lg font-semibold text-blue-800">
              Informasi Jenis Form
            </h3>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start">
              <span className="font-medium text-blue-700 mr-2">Jenis 1:</span>
              <span>Referensi dari Mata Kuliah Proyek Sistem Informasi</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-blue-700 mr-2">Jenis 2:</span>
              <span>Referensi dari Mata Kuliah Proyek Informatika</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-blue-700 mr-2">Jenis 3:</span>
              <span>Referensi dari Mata Kuliah Proyek Data Science</span>
            </div>
          </div>
          {isEditMode && formData.jenis_form === "3" && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Catatan:</strong> Untuk form jenis 3, Anda hanya dapat
                mengubah nama form. Komponen penilaian akan diisi oleh ketua
                kelompok secara terpisah.
              </p>
            </div>
          )}
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
              className={`w-full p-3 border ${
                errors.nama_form ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Masukkan nama form"
              disabled={isSubmitting}
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
                disabled={isEditMode || isSubmitting}
                className={`appearance-none w-full p-3 border border-gray-300 rounded-lg bg-white pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              >
                <option value="1">
                  Jenis 1 - Anggota ke Anggota & Anggota ke Ketua
                </option>
                <option value="2">Jenis 2 - Hanya Anggota ke Anggota</option>
                <option value="3">Jenis 3 - Hanya Ketua ke Anggota</option>
              </select>
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

          {/* Render komponen sesuai jenis form, kecuali jenis 3 */}

          {/* Render komponen anggota ke anggota untuk jenis 1 dan 2 */}
          {(formData.jenis_form === "1" || formData.jenis_form === "2") &&
            renderKomponenTable("anggota_ke_anggota")}

          {/* Render komponen anggota ke ketua untuk jenis 1 */}
          {formData.jenis_form === "1" &&
            renderKomponenTable("anggota_ke_ketua")}
          {formData.jenis_form === "3" && renderKomponenTable("dosen_ke_ketua")}

          <div className="mt-8 flex justify-between items-center">
            <CopyButton form={formData} />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {isEditMode ? "Mengubah..." : "Menyimpan..."}
                  </>
                ) : isEditMode ? (
                  "Ubah"
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPeerEvaluationModal;

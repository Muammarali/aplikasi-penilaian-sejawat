"use client";
import { useState, useEffect } from "react";
import axios from "axios";

const ModalFormPenilaian = ({
  isOpen,
  onClose,
  dataAnggota = [],
  dataPM = [],
  dataForm = {},
  formData = {},
  session,
}) => {
  const [nilaiAnggotaAnggota, setNilaiAnggotaAnggota] = useState([]);
  const [nilaiAnggotaPM, setNilaiAnggotaPM] = useState([]);
  const [nilaiKetuaAnggota, setNilaiKetuaAnggota] = useState([]);
  const [validasiError, setValidasiError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Mendapatkan tipe penilaian berdasarkan id_jenis
  const id_jenis = formData?.form_details?.id_jenis || 1;

  // Komponen penilaian berdasarkan tipe
  const komponenAnggotaAnggota = formData?.komponen?.anggota_anggota || [];
  const komponenAnggotaPM = formData?.komponen?.anggota_pm || [];
  const komponenKetuaAnggota = formData?.komponen?.ketua_anggota || [];

  // Inisialisasi nilai
  useEffect(() => {
    // Cek dulu kalau state-nya belum di-set
    if (
      dataAnggota.length > 0 &&
      komponenAnggotaAnggota.length > 0 &&
      nilaiAnggotaAnggota.length === 0
    ) {
      const initialValues = dataAnggota.map(() => {
        const values = {};
        komponenAnggotaAnggota.forEach((komp) => {
          values[komp.id_komponen] = "";
        });
        return values;
      });

      setNilaiAnggotaAnggota(initialValues);
    }

    if (
      dataPM.length > 0 &&
      komponenAnggotaPM.length > 0 &&
      nilaiAnggotaPM.length === 0
    ) {
      const initialValues = dataPM.map(() => {
        const values = {};
        komponenAnggotaPM.forEach((komp) => {
          values[komp.id_komponen] = "";
        });
        return values;
      });
      setNilaiAnggotaPM(initialValues);
    }

    if (
      dataAnggota.length > 0 &&
      komponenKetuaAnggota.length > 0 &&
      nilaiKetuaAnggota.length === 0
    ) {
      const initialValues = dataAnggota.map(() => {
        const values = {};
        komponenKetuaAnggota.forEach((komp) => {
          values[komp.id_komponen] = "";
        });
        return values;
      });
      setNilaiKetuaAnggota(initialValues);
    }
  }, [
    dataAnggota,
    dataPM,
    komponenAnggotaAnggota,
    komponenAnggotaPM,
    komponenKetuaAnggota,
    nilaiAnggotaAnggota.length,
    nilaiAnggotaPM.length,
    nilaiKetuaAnggota.length,
  ]);

  if (!isOpen) return null;

  // Fungsi untuk mengubah nilai input
  const handleAnggotaAnggotaChange = (index, field, value) => {
    // Validasi input tidak lebih dari 100
    if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 100)) {
      const newNilai = [...nilaiAnggotaAnggota];
      newNilai[index] = { ...newNilai[index], [field]: value };
      setNilaiAnggotaAnggota(newNilai);
      // Reset error saat ada perubahan
      setValidasiError(false);
    }
  };

  const handleAnggotaPMChange = (index, field, value) => {
    // Validasi input tidak lebih dari 100
    if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 100)) {
      const newNilai = [...nilaiAnggotaPM];
      newNilai[index] = { ...newNilai[index], [field]: value };
      setNilaiAnggotaPM(newNilai);
      // Reset error saat ada perubahan
      setValidasiError(false);
    }
  };

  const handleKetuaAnggotaChange = (index, field, value) => {
    // Validasi input tidak lebih dari 100
    if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 100)) {
      const newNilai = [...nilaiKetuaAnggota];
      newNilai[index] = { ...newNilai[index], [field]: value };
      setNilaiKetuaAnggota(newNilai);
      // Reset error saat ada perubahan
      setValidasiError(false);
    }
  };

  // Fungsi untuk menghitung total nilai (berdasarkan bobot)
  const hitungTotal = (nilai, komponenList) => {
    if (!nilai) return 0;

    // Cek apakah semua komponen telah diisi
    let totalNilai = 0;
    let adaKosong = false;

    komponenList.forEach((komp) => {
      if (nilai[komp.id_komponen] === "") {
        adaKosong = true;
      } else {
        // Menghitung nilai berdasarkan bobot
        const nilaiKomponen = isNaN(parseInt(nilai[komp.id_komponen]))
          ? 0
          : parseInt(nilai[komp.id_komponen]);
        const bobot = komp.bobot || 1; // Default bobot 1 jika tidak ada
        totalNilai += nilaiKomponen;
      }
    });

    // Hanya tampilkan total jika semua komponen memiliki nilai
    if (adaKosong) {
      return 0;
    }

    return totalNilai;
  };

  // Fungsi untuk cek apakah semua nilai telah diisi
  const cekNilaiLengkap = () => {
    let semuaLengkap = true;

    // Cek nilai anggota-anggota jika diperlukan
    if (id_jenis === 1 || id_jenis === 2) {
      for (let i = 0; i < dataAnggota.length; i++) {
        for (let komp of komponenAnggotaAnggota) {
          if (
            !nilaiAnggotaAnggota[i] ||
            nilaiAnggotaAnggota[i][komp.id_komponen] === ""
          ) {
            semuaLengkap = false;
            break;
          }
        }
        if (!semuaLengkap) break;
      }
    }

    // Cek nilai anggota-PM jika diperlukan
    if (semuaLengkap && id_jenis === 1) {
      for (let i = 0; i < dataPM.length; i++) {
        for (let komp of komponenAnggotaPM) {
          if (
            !nilaiAnggotaPM[i] ||
            nilaiAnggotaPM[i][komp.id_komponen] === ""
          ) {
            semuaLengkap = false;
            break;
          }
        }
        if (!semuaLengkap) break;
      }
    }

    // Cek nilai ketua-anggota jika diperlukan
    if (semuaLengkap && id_jenis === 3) {
      for (let i = 0; i < dataAnggota.length; i++) {
        for (let komp of komponenKetuaAnggota) {
          if (
            !nilaiKetuaAnggota[i] ||
            nilaiKetuaAnggota[i][komp.id_komponen] === ""
          ) {
            semuaLengkap = false;
            break;
          }
        }
        if (!semuaLengkap) break;
      }
    }

    return semuaLengkap;
  };

  const handleSubmit = async () => {
    // Cek apakah semua nilai telah diisi
    if (!cekNilaiLengkap()) {
      setValidasiError(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Data untuk tabel hasil_penilaian
      const hasilPenilaian = [];
      const id_penilai = session?.user?.id;
      const id_form = formData?.form_details?.id_form;

      // Proses nilai anggota-anggota
      if (id_jenis === 1 || id_jenis === 2) {
        dataAnggota.forEach((anggota, idx) => {
          komponenAnggotaAnggota.forEach((komp) => {
            if (
              nilaiAnggotaAnggota[idx] &&
              nilaiAnggotaAnggota[idx][komp.id_komponen] !== ""
            ) {
              hasilPenilaian.push({
                id_penilai,
                id_dinilai: anggota.id_user,
                nilai: parseInt(nilaiAnggotaAnggota[idx][komp.id_komponen]),
                id_form,
                id_komponen: komp.id_komponen,
              });
            }
          });
        });
      }

      // Proses nilai anggota-PM
      if (id_jenis === 1) {
        dataPM.forEach((pm, idx) => {
          komponenAnggotaPM.forEach((komp) => {
            if (
              nilaiAnggotaPM[idx] &&
              nilaiAnggotaPM[idx][komp.id_komponen] !== ""
            ) {
              hasilPenilaian.push({
                id_penilai,
                id_dinilai: pm.id_user,
                nilai: parseInt(nilaiAnggotaPM[idx][komp.id_komponen]),
                id_form,
                id_komponen: komp.id_komponen,
              });
            }
          });
        });
      }

      // Proses nilai ketua-anggota
      if (id_jenis === 3) {
        dataAnggota.forEach((anggota, idx) => {
          komponenKetuaAnggota.forEach((komp) => {
            if (
              nilaiKetuaAnggota[idx] &&
              nilaiKetuaAnggota[idx][komp.id_komponen] !== ""
            ) {
              hasilPenilaian.push({
                id_penilai,
                id_dinilai: anggota.id_user,
                nilai: parseInt(nilaiKetuaAnggota[idx][komp.id_komponen]),
                id_form,
                id_komponen: komp.id_komponen,
              });
            }
          });
        });
      }

      console.log("Data to submit:", hasilPenilaian);

      // Kirim data ke API
      const response = await axios.post("/api/formpenilaian/nilai", {
        hasilPenilaian: hasilPenilaian,
        id_form: id_form,
      });

      console.log("Response:", response.data);

      setNilaiAnggotaAnggota([]);
      setNilaiAnggotaPM([]);
      setNilaiKetuaAnggota([]);
      setValidasiError(false);
      onClose();
    } catch (error) {
      console.error("Error submitting data:", error);
      setSubmitError(
        "Terjadi kesalahan saat menyimpan data. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    setNilaiAnggotaAnggota([]);
    setNilaiAnggotaPM([]);
    setNilaiKetuaAnggota([]);
    setValidasiError(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(75, 85, 99, 0.4)" }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={() => handleClose()}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Tutup"
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
          {dataForm?.nama || "Form Penilaian"}
        </h2>

        {validasiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            Mohon isi semua nilai sebelum menyimpan form penilaian.
          </div>
        )}

        {/* Penilaian Anggota-Anggota */}
        {(id_jenis === 1 || id_jenis === 2) &&
          komponenAnggotaAnggota.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center mb-3">
                <div className="w-1 h-6 bg-blue-500 rounded mr-2"></div>
                <h4 className="font-medium text-lg">
                  Penilaian Anggota-Anggota
                </h4>
              </div>

              <div className="flex flex-col gap-2 mb-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {komponenAnggotaAnggota.map((komp, idx) => (
                  <div key={idx}>
                    {komp.nama_komponen}: {komp.deskripsi} (Bobot: {komp.bobot}
                    %)
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-600 font-medium border-b">
                        NPM
                      </th>
                      <th className="px-3 py-2 text-left text-gray-600 font-medium border-b">
                        Nama
                      </th>
                      {komponenAnggotaAnggota.map((komp, idx) => (
                        <th
                          key={idx}
                          className="px-3 py-2 text-center text-gray-600 font-medium border-b"
                        >
                          {komp.nama_komponen}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center text-gray-600 font-medium border-b">
                        Hasil
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataAnggota.map((mhs, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-3 py-2 border-b border-gray-100">
                          {mhs.npm}
                        </td>
                        <td className="px-3 py-2 border-b border-gray-100">
                          {mhs.nama}
                        </td>
                        {komponenAnggotaAnggota.map((komp, kompIdx) => (
                          <td
                            key={kompIdx}
                            className="px-3 py-2 text-center border-b border-gray-100"
                          >
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={
                                nilaiAnggotaAnggota[idx]?.[komp.id_komponen] ||
                                ""
                              }
                              onChange={(e) =>
                                handleAnggotaAnggotaChange(
                                  idx,
                                  komp.id_komponen,
                                  e.target.value
                                )
                              }
                              className={`w-14 border rounded py-1 px-2 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                validasiError &&
                                (!nilaiAnggotaAnggota[idx] ||
                                  nilaiAnggotaAnggota[idx][komp.id_komponen] ===
                                    "")
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center border-b border-gray-100 font-medium">
                          {hitungTotal(
                            nilaiAnggotaAnggota[idx],
                            komponenAnggotaAnggota
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* Penilaian Anggota-PM */}
        {id_jenis === 1 && komponenAnggotaPM.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-3">
              <div className="w-1 h-6 bg-green-500 rounded mr-2"></div>
              <h4 className="font-medium text-lg">Penilaian Anggota-PM</h4>
            </div>

            <div className="flex flex-col gap-2 mb-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {komponenAnggotaPM.map((komp, idx) => (
                <div key={idx}>
                  {komp.nama_komponen}: {komp.deskripsi} (Bobot: {komp.bobot}%)
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-600 font-medium border-b">
                      NPM
                    </th>
                    <th className="px-3 py-2 text-left text-gray-600 font-medium border-b">
                      Nama
                    </th>
                    {komponenAnggotaPM.map((komp, idx) => (
                      <th
                        key={idx}
                        className="px-3 py-2 text-center text-gray-600 font-medium border-b"
                      >
                        {komp.nama_komponen}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center text-gray-600 font-medium border-b">
                      Hasil
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dataPM.map((mhs, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-3 py-2 border-b border-gray-100">
                        {mhs.npm}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        {mhs.nama}
                      </td>
                      {komponenAnggotaPM.map((komp, kompIdx) => (
                        <td
                          key={kompIdx}
                          className="px-3 py-2 text-center border-b border-gray-100"
                        >
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              nilaiAnggotaPM[idx]?.[komp.id_komponen] || ""
                            }
                            onChange={(e) =>
                              handleAnggotaPMChange(
                                idx,
                                komp.id_komponen,
                                e.target.value
                              )
                            }
                            className={`w-14 border rounded py-1 px-2 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                              validasiError &&
                              (!nilaiAnggotaPM[idx] ||
                                nilaiAnggotaPM[idx][komp.id_komponen] === "")
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300"
                            }`}
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center border-b border-gray-100 font-medium">
                        {hitungTotal(nilaiAnggotaPM[idx], komponenAnggotaPM)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Penilaian Ketua-Anggota */}
        {id_jenis === 3 && komponenKetuaAnggota.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-3">
              <div className="w-1 h-6 bg-purple-500 rounded mr-2"></div>
              <h4 className="font-medium text-lg">Penilaian Ketua-Anggota</h4>
            </div>

            <div className="flex flex-col gap-2 mb-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {komponenKetuaAnggota.map((komp, idx) => (
                <div key={idx}>
                  {komp.nama_komponen}: {komp.deskripsi} (Bobot: {komp.bobot}%)
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-600 font-medium border-b">
                      NPM
                    </th>
                    <th className="px-3 py-2 text-left text-gray-600 font-medium border-b">
                      Nama
                    </th>
                    {komponenKetuaAnggota.map((komp, idx) => (
                      <th
                        key={idx}
                        className="px-3 py-2 text-center text-gray-600 font-medium border-b"
                      >
                        {komp.nama_komponen}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center text-gray-600 font-medium border-b">
                      Hasil
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dataAnggota.map((mhs, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-3 py-2 border-b border-gray-100">
                        {mhs.npm}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        {mhs.nama}
                      </td>
                      {komponenKetuaAnggota.map((komp, kompIdx) => (
                        <td
                          key={kompIdx}
                          className="px-3 py-2 text-center border-b border-gray-100"
                        >
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              nilaiKetuaAnggota[idx]?.[komp.id_komponen] || ""
                            }
                            onChange={(e) =>
                              handleKetuaAnggotaChange(
                                idx,
                                komp.id_komponen,
                                e.target.value
                              )
                            }
                            className={`w-14 border rounded py-1 px-2 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                              validasiError &&
                              (!nilaiKetuaAnggota[idx] ||
                                nilaiKetuaAnggota[idx][komp.id_komponen] === "")
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300"
                            }`}
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center border-b border-gray-100 font-medium">
                        {hitungTotal(
                          nilaiKetuaAnggota[idx],
                          komponenKetuaAnggota
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => handleClose()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
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
                Menyimpan...
              </>
            ) : (
              "Simpan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalFormPenilaian;

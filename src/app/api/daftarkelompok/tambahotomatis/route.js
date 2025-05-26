import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const { id_mk, kelas, nama_matkul, anggota_per_kelompok } = await req.json();

  try {
    // Validasi mata kuliah
    const validateMatkulQuery = `
      SELECT id_mk FROM mata_kuliah
      WHERE id_mk = $1 AND nama = $2 AND kelas = $3
      LIMIT 1;
    `;

    const matkulResult = await handlerQuery(validateMatkulQuery, [
      id_mk,
      nama_matkul,
      kelas,
    ]);

    if (!matkulResult || matkulResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Data mata kuliah tidak valid",
      });
    }

    // Hitung jumlah mahasiswa di kelas ini
    const getMahasiswaCountQuery = `
      SELECT COUNT(DISTINCT id_user) AS total_mahasiswa
      FROM daftar_kelas
      WHERE id_mk = $1;
    `;

    const countResult = await handlerQuery(getMahasiswaCountQuery, [id_mk]);
    const totalMahasiswa = parseInt(countResult.rows[0].total_mahasiswa);

    if (totalMahasiswa === 0) {
      return NextResponse.json({
        success: false,
        message: "Tidak ada mahasiswa yang terdaftar pada mata kuliah ini",
      });
    }

    console.log("Total mahasiswa:", totalMahasiswa);

    // Hitung jumlah kelompok yang diperlukan
    const jumlahKelompok = Math.ceil(totalMahasiswa / anggota_per_kelompok);
    console.log("Jumlah kelompok yang akan dibuat:", jumlahKelompok);

    const createdGroups = [];

    // Buat kelompok dalam database
    for (let i = 1; i <= jumlahKelompok; i++) {
      const namaKelompok = `Kelompok ${i}`;

      const insertQuery = `
        INSERT INTO kelompok (
          nama_kelompok,
          id_mk,
          kapasitas)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;

      const result = await handlerQuery(insertQuery, [
        namaKelompok,
        id_mk,
        anggota_per_kelompok,
      ]);

      createdGroups.push(result.rows[0]);
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil membuat ${jumlahKelompok} kelompok secara otomatis`,
      data: createdGroups,
    });
  } catch (error) {
    console.error("Error saat membuat kelompok otomatis:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
}

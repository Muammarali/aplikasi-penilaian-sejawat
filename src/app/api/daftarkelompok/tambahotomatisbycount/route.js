import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const { id_mk, kelas, nama_matkul, jumlah_kelompok } = await req.json();

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

    // Validasi jumlah kelompok
    if (!jumlah_kelompok || jumlah_kelompok < 1) {
      return NextResponse.json({
        success: false,
        message: "Jumlah kelompok harus minimal 1",
      });
    }

    // Hitung jumlah mahasiswa di kelas ini (role = 'Mahasiswa')
    const getMahasiswaCountQuery = `
      SELECT COUNT(DISTINCT dk.id_user) AS total_mahasiswa
      FROM daftar_kelas dk
      JOIN users u ON dk.id_user = u.id_user
      WHERE dk.id_mk = $1 AND u.role = 'Mahasiswa';
    `;

    const countResult = await handlerQuery(getMahasiswaCountQuery, [id_mk]);
    const totalMahasiswa = parseInt(countResult.rows[0].total_mahasiswa);

    if (totalMahasiswa === 0) {
      return NextResponse.json({
        success: false,
        message: "Tidak ada mahasiswa yang terdaftar pada mata kuliah ini",
      });
    }

    // Validasi jumlah kelompok tidak boleh melebihi jumlah mahasiswa
    if (jumlah_kelompok > totalMahasiswa) {
      return NextResponse.json({
        success: false,
        message: `Jumlah kelompok (${jumlah_kelompok}) tidak boleh melebihi jumlah mahasiswa (${totalMahasiswa})`,
      });
    }

    // Hitung kapasitas untuk setiap kelompok
    const baseCapacity = Math.floor(totalMahasiswa / jumlah_kelompok);
    const remainder = totalMahasiswa % jumlah_kelompok;
    const createdGroups = [];

    for (let i = 1; i <= jumlah_kelompok; i++) {
      const namaKelompok = `Kelompok ${i}`;

      // Kelompok pertama (sebanyak remainder) akan mendapat +1 anggota
      const kapasitasKelompok =
        i <= remainder ? baseCapacity + 1 : baseCapacity;

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
        kapasitasKelompok,
      ]);

      createdGroups.push({
        ...result.rows[0],
        kapasitas_calculated: kapasitasKelompok,
      });
    }

    // Buat pesan detail tentang pembagian
    const groupDetails = createdGroups
      .map(
        (group) =>
          `${group.nama_kelompok}: ${group.kapasitas_calculated} anggota`
      )
      .join(", ");

    return NextResponse.json({
      success: true,
      message: `Berhasil membuat ${jumlah_kelompok} kelompok secara otomatis. Pembagian: ${groupDetails}`,
      data: createdGroups,
      summary: {
        total_mahasiswa: totalMahasiswa,
        jumlah_kelompok: jumlah_kelompok,
        base_capacity: baseCapacity,
        groups_with_extra: remainder,
      },
    });
  } catch (error) {
    console.error(
      "Error saat membuat kelompok otomatis berdasarkan jumlah:",
      error
    );
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
}

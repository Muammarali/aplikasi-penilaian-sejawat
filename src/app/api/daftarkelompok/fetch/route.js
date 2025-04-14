import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const { nama_matkul, kelas, id_mk, id_user } = await req.json();

  try {
    // Cari apakah matkul dengan id_mk, nama dan kelas benar-benar milik user tsb
    const getMatkulQuery = `
      SELECT id_mk FROM mata_kuliah 
      WHERE id_mk = $1 AND nama = $2 AND kelas = $3
      LIMIT 1
    `;

    const result = await handlerQuery(getMatkulQuery, [
      id_mk,
      nama_matkul,
      kelas,
    ]);

    if (!result || result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Mata kuliah tidak ditemukan atau tidak valid untuk user ini",
        rows: [],
      });
    }

    // Lanjut ambil data kelompok
    const query = `
      SELECT 
        k.id_kelompok,
        k.nama_kelompok,
        k.kapasitas,
        COUNT(mk.id_user) AS jumlah_anggota
      FROM 
        kelompok k
      LEFT JOIN 
        mahasiswa_kelompok mk ON k.id_kelompok = mk.id_kelompok
      WHERE 
        k.id_mk = $1
      GROUP BY 
        k.id_kelompok, k.nama_kelompok, k.kapasitas;
    `;

    const data = await handlerQuery(query, [id_mk]);

    return NextResponse.json({
      success: true,
      rows: data.rows || [],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
      rows: [],
    });
  }
}

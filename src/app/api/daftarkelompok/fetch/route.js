import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const request = await req.json();
  const matkul = request.matkul;

  try {
    // Ambil id_mk berdasarkan nama matkul
    const getIdMkQuery = `SELECT id_mk FROM mata_kuliah WHERE nama = $1 LIMIT 1`;
    const result = await handlerQuery(getIdMkQuery, [matkul]);

    if (!result || result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Mata kuliah tidak ditemukan",
        rows: [], // kembalikan array kosong
      });
    }

    const id_mk = result.rows[0].id_mk;

    // Query jumlah anggota per kelompok berdasarkan id_mk
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

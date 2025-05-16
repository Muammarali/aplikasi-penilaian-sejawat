import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const { nama_kelompok, kapasitas, id_mk, kelas, nama_matkul } =
    await req.json();

  try {
    // Validasi dulu apakah id_mk + nama + kelas itu valid
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

    // Lanjut insert kelompok
    const insertQuery = `
      INSERT INTO kelompok (
        nama_kelompok,
        id_mk,
        kapasitas)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const result = await handlerQuery(insertQuery, [
      nama_kelompok,
      id_mk,
      kapasitas,
    ]);

    return NextResponse.json({
      success: true,
      message: "Kelompok berhasil dibuat",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error saat membuat kelompok:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
}

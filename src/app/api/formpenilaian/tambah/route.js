import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const { id_mk, id_jenis, formData } = await req.json();

  console.log(id_mk);
  console.log(id_jenis);
  console.log(formData);

  try {
    const insertQuery = `
      INSERT INTO form_penilaian (
        nama,
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

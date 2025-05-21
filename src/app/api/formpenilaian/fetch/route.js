import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const { nama_matkul, kelas, id_mk, id_user } = await req.json();

  try {
    // Validasi apakah mata kuliah benar milik user tersebut
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
        data: { rows: [] },
      });
    }

    // Ambil form penilaian jika valid
    const query = `
      SELECT DISTINCT
        fp.id_form, fp.nama, jf.nama as jenis, fp.status
      FROM 
        form_penilaian fp
      JOIN
        jenis_form jf ON fp.id_jenis = jf.id_jenis
      WHERE
        fp.id_mk = $1
    `;

    const data = await handlerQuery(query, [id_mk]);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error route", details: error },
      { status: 500 }
    );
  }
}

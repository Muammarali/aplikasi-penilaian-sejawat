import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const { id_kelompok, id_user } = await req.json();

  try {
    // Cek apakah user memang ketua
    const checkQuery = `
      SELECT * FROM mahasiswa_kelompok
      WHERE id_kelompok = $1 AND id_user = $2 AND peran = 'Ketua'
      LIMIT 1
    `;
    const isKetua = await handlerQuery(checkQuery, [id_kelompok, id_user]);

    if (isKetua.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Anda bukan ketua kelompok saat ini",
      });
    }

    // Update peran menjadi anggota biasa
    const updateQuery = `
      UPDATE mahasiswa_kelompok
      SET peran = 'Anggota'
      WHERE id_kelompok = $1 AND id_user = $2
    `;
    await handlerQuery(updateQuery, [id_kelompok, id_user]);

    return NextResponse.json({
      success: true,
      message: "Anda berhasil mengundurkan diri sebagai ketua",
    });
  } catch (error) {
    console.error("Error undur ketua:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan saat mengundurkan diri dari ketua",
    });
  }
}

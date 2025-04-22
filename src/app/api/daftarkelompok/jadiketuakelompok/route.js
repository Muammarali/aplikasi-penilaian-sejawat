import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const { id_kelompok, id_user } = await req.json();

  try {
    // ✅ Cek apakah user tergabung dalam kelompok ini
    const checkAnggotaQuery = `
      SELECT * FROM mahasiswa_kelompok
      WHERE id_kelompok = $1 AND id_user = $2
      LIMIT 1
    `;
    const isAnggota = await handlerQuery(checkAnggotaQuery, [
      id_kelompok,
      id_user,
    ]);

    if (isAnggota.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Anda belum tergabung dalam kelompok ini",
      });
    }

    // ✅ Cek apakah sudah ada ketua di kelompok ini
    const checkKetuaQuery = `
      SELECT * FROM mahasiswa_kelompok 
      WHERE id_kelompok = $1 AND peran = 'ketua'
      LIMIT 1
    `;
    const existingKetua = await handlerQuery(checkKetuaQuery, [id_kelompok]);

    if (existingKetua.rows.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Kelompok ini sudah memiliki ketua",
      });
    }

    // ✅ Update user menjadi ketua
    const updateQuery = `
      UPDATE mahasiswa_kelompok
      SET peran = 'Ketua'
      WHERE id_kelompok = $1 AND id_user = $2
    `;
    await handlerQuery(updateQuery, [id_kelompok, id_user]);

    return NextResponse.json({
      success: true,
      message: "Berhasil menjadi ketua kelompok",
    });
  } catch (error) {
    console.error("Error jadi ketua:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan saat menetapkan ketua",
    });
  }
}

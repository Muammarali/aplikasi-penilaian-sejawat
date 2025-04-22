import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function PUT(req) {
  const { nama_kelompok, kapasitas, id_mk, id_user, id_kelompok } =
    await req.json();

  try {
    // 1. Hitung jumlah anggota saat ini
    const countQuery = `
      SELECT COUNT(*) AS jumlah_anggota
      FROM mahasiswa_kelompok
      WHERE id_kelompok = $1
    `;
    const { rows } = await handlerQuery(countQuery, [id_kelompok]);
    const jumlahAnggota = parseInt(rows[0].jumlah_anggota, 10);

    // 2. Validasi kapasitas baru
    if (kapasitas < jumlahAnggota) {
      return NextResponse.json({
        success: false,
        message: `Kapasitas tidak boleh lebih kecil dari jumlah anggota saat ini (${jumlahAnggota})`,
      });
    }

    // 3. Update kelompok
    const updateQuery = `
      UPDATE kelompok
      SET nama_kelompok = $1,
          kapasitas = $2,
          id_mk = $3
      WHERE id_kelompok = $4
    `;
    await handlerQuery(updateQuery, [
      nama_kelompok,
      kapasitas,
      id_mk,
      id_kelompok,
    ]);

    return NextResponse.json({
      success: true,
      message: "Data kelompok berhasil diperbarui",
    });
  } catch (error) {
    console.error("Gagal update kelompok:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan saat memperbarui kelompok",
    });
  }
}

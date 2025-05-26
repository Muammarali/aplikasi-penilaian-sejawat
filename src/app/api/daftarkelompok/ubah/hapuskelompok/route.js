import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function POST(req) {
  const { id_kelompok } = await req.json();

  try {
    // 1. Cek jumlah anggota
    const countQuery = `
      SELECT COUNT(*) AS jumlah_anggota
      FROM mahasiswa_kelompok
      WHERE id_kelompok = $1
    `;
    const { rows } = await handlerQuery(countQuery, [id_kelompok]);
    const jumlahAnggota = parseInt(rows[0].jumlah_anggota, 10);

    // 2. Kalau masih ada anggota, tolak penghapusan
    if (jumlahAnggota > 0) {
      return NextResponse.json({
        success: false,
        message: `Tidak bisa hapus kelompok, masih ada ${jumlahAnggota} anggota di dalamnya.`,
      });
    }

    // 3. Hapus kelompok
    const deleteQuery = `
      DELETE FROM kelompok
      WHERE id_kelompok = $1
    `;
    await handlerQuery(deleteQuery, [id_kelompok]);

    return NextResponse.json({
      success: true,
      message: "Kelompok berhasil dihapus.",
    });
  } catch (error) {
    console.error("Gagal hapus kelompok:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan saat menghapus kelompok.",
    });
  }
}

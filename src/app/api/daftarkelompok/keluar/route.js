import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const { id_kelompok, id_user } = await req.json();

  try {
    // ✅ Cek apakah user yang keluar adalah ketua
    const checkKetuaQuery = `
      SELECT * FROM mahasiswa_kelompok
      WHERE id_kelompok = $1 AND id_user = $2 AND peran = 'Ketua'
      LIMIT 1
    `;
    const isKetua = await handlerQuery(checkKetuaQuery, [id_kelompok, id_user]);

    if (isKetua.rows.length > 0) {
      // Jika user adalah ketua, ubah peran menjadi anggota sebelum keluar
      const updatePeranQuery = `
        UPDATE mahasiswa_kelompok
        SET peran = 'Anggota'
        WHERE id_kelompok = $1 AND id_user = $2
      `;
      await handlerQuery(updatePeranQuery, [id_kelompok, id_user]);
    }

    // ✅ Hapus user dari kelompok
    const deleteQuery = `
      DELETE FROM mahasiswa_kelompok
      WHERE id_kelompok = $1 AND id_user = $2;
    `;
    await handlerQuery(deleteQuery, [id_kelompok, id_user]);

    return NextResponse.json({
      success: true,
      message: "Berhasil keluar dari kelompok",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Gagal keluar dari kelompok",
    });
  }
}

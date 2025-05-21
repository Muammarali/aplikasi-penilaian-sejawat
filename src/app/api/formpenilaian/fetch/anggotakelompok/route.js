import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function POST(req) {
  const { id_mk, id_user } = await req.json();

  try {
    if (!id_mk || !id_user) {
      return NextResponse.json(
        { success: false, message: "id_mk dan id_user wajib diisi" },
        { status: 400 }
      );
    }

    // 1. Cari dulu user ini ada di kelompok mana di matkul tersebut
    const getKelompokQuery = `
      SELECT mk.id_kelompok, k.nama_kelompok
      FROM mahasiswa_kelompok mk
      JOIN kelompok k ON mk.id_kelompok = k.id_kelompok
      WHERE mk.id_user = $1 AND k.id_mk = $2
      LIMIT 1
    `;

    const kelompokData = await handlerQuery(getKelompokQuery, [id_user, id_mk]);

    if (kelompokData.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User tidak terdaftar di kelompok manapun untuk matkul ini.",
        },
        { status: 404 }
      );
    }

    const id_kelompok = kelompokData.rows[0].id_kelompok;

    // 2. Ambil semua anggota di kelompok tersebut
    const getAnggotaKelompokQuery = `
      SELECT u.id_user, u.npm, u.nama, mk.peran, k.nama_kelompok
      FROM mahasiswa_kelompok mk
      JOIN users u ON mk.id_user = u.id_user
      JOIN kelompok k ON mk.id_kelompok = k.id_kelompok
      WHERE mk.id_kelompok = $1
    `;

    const anggotaData = await handlerQuery(getAnggotaKelompokQuery, [
      id_kelompok,
    ]);

    return NextResponse.json({
      success: true,
      data: anggotaData.rows,
    });
  } catch (error) {
    console.error("Error fetching anggota kelompok:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error processing request",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

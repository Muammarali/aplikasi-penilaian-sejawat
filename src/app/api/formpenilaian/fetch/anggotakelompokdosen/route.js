import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function POST(req) {
  const { id_mk } = await req.json();

  try {
    if (!id_mk) {
      return NextResponse.json(
        { success: false, message: "id_mk wajib diisi" },
        { status: 400 }
      );
    }

    // Ambil semua user yang terdaftar di matkul tertentu lewat relasi kelompok
    const getMahasiswaQuery = `
      SELECT u.id_user, u.npm, u.nama, mk.peran, k.nama_kelompok
      FROM mahasiswa_kelompok mk
      JOIN users u ON mk.id_user = u.id_user
      JOIN kelompok k ON mk.id_kelompok = k.id_kelompok
      WHERE k.id_mk = $1
      ORDER BY k.nama_kelompok, u.nama
    `;

    const mahasiswaData = await handlerQuery(getMahasiswaQuery, [id_mk]);

    if (mahasiswaData.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Belum ada mahasiswa terdaftar di mata kuliah ini.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mahasiswaData.rows,
    });
  } catch (error) {
    console.error("Error fetching mahasiswa:", error);
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

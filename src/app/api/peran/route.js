import { NextResponse } from "next/server";
import handlerQuery from "../../utils/db";

export async function POST(req) {
  try {
    const { id_user, id_mk } = await req.json();

    if (!id_user || !id_mk) {
      return NextResponse.json(
        { success: false, message: "id_user dan id_mk wajib diisi" },
        { status: 400 }
      );
    }

    // Cek role user
    const getUserRoleQuery = `SELECT role FROM users WHERE id_user = $1 LIMIT 1`;
    const roleResult = await handlerQuery(getUserRoleQuery, [id_user]);

    if (roleResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    const userRole = roleResult.rows[0].role;

    if (userRole === "Dosen") {
      // Langsung return 403 tanpa jalankan query peran
      return NextResponse.json(
        { success: true, message: "Dosen tidak memiliki kelompok." },
        { status: 200 }
      );
    }

    // Hanya jalankan query ini jika bukan dosen
    const getUserPeranQuery = `
      SELECT mk.peran, k.nama_kelompok
      FROM mahasiswa_kelompok mk
      JOIN kelompok k ON mk.id_kelompok = k.id_kelompok
      WHERE mk.id_user = $1 AND k.id_mk = $2
      LIMIT 1
    `;

    const result = await handlerQuery(getUserPeranQuery, [id_user, id_mk]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User tidak terdaftar di kelompok untuk matkul ini.",
        },
        { status: 404 }
      );
    }

    const { peran, nama_kelompok } = result.rows[0];

    return NextResponse.json({
      success: true,
      data: { peran, nama_kelompok },
    });
  } catch (error) {
    console.error("Error fetching peran user:", error);
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

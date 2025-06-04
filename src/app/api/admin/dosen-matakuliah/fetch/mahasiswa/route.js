import { NextResponse } from "next/server";
import handlerQuery from "../../../../../utils/db";

export async function POST(req) {
  const { id_mk } = await req.json();

  try {
    // Mahasiswa yang sudah terdaftar
    const enrolledQuery = `
      SELECT 
        u.id_user AS id,
        u.nama,
        u.npm,
        u.email
      FROM users u
      JOIN daftar_kelas dk ON u.id_user = dk.id_user
      WHERE dk.id_mk = $1
        AND u.role = 'Mahasiswa'
      ORDER BY u.nama;
    `;
    const enrolled = await handlerQuery(enrolledQuery, [id_mk]);

    // Mahasiswa yang belum terdaftar
    const notEnrolledQuery = `
      SELECT 
        u.id_user AS id,
        u.nama,
        u.npm,
        u.email
      FROM users u
      WHERE u.role = 'Mahasiswa'
        AND u.id_user NOT IN (
          SELECT dk.id_user
          FROM daftar_kelas dk
          WHERE dk.id_mk = $1
        )
      ORDER BY u.nama;
    `;
    const notEnrolled = await handlerQuery(notEnrolledQuery, [id_mk]);

    return NextResponse.json({
      success: true,
      enrolled: enrolled.rows,
      notEnrolled: notEnrolled.rows,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Gagal mengambil data mahasiswa",
      enrolled: [],
      notEnrolled: [],
    });
  }
}

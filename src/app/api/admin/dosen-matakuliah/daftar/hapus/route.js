import { NextResponse } from "next/server";
import handlerQuery from "../../../../../utils/db";

export async function POST(req) {
  const { id_mk, id_user } = await req.json();

  try {
    if (!id_mk || !id_user) {
      return NextResponse.json({
        success: false,
        message: "ID mata kuliah dan ID mahasiswa diperlukan.",
      });
    }

    // Check if the student is enrolled in the course
    const checkQuery = `
      SELECT * FROM daftar_kelas 
      WHERE id_mk = $1 AND id_user = $2
    `;
    const checkResult = await handlerQuery(checkQuery, [id_mk, id_user]);

    if (checkResult.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Mahasiswa tidak terdaftar di mata kuliah ini.",
      });
    }

    // Remove the student from the course
    const deleteQuery = `
      DELETE FROM daftar_kelas 
      WHERE id_mk = $1 AND id_user = $2
    `;

    await handlerQuery(deleteQuery, [id_mk, id_user]);

    return NextResponse.json({
      success: true,
      message: "Mahasiswa berhasil dikeluarkan dari mata kuliah ini.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Gagal mengeluarkan mahasiswa dari mata kuliah ini.",
    });
  }
}

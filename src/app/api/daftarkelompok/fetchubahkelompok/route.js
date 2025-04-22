import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const { id_kelompok } = await req.json();

  try {
    const query = `
      SELECT * FROM kelompok
      WHERE id_kelompok = $1
    `;
    const result = await handlerQuery(query, [id_kelompok]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Kelompok tidak ditemukan",
      });
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Gagal mengambil data kelompok:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data kelompok",
    });
  }
}

import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const { id_kelompok } = await req.json();

  try {
    const query = `
      SELECT 
        mk.id,
        mk.id_user,
        mk.peran,
        u.nama AS nama_user,
        u.npm
      FROM 
        mahasiswa_kelompok mk
      JOIN 
        users u ON mk.id_user = u.id_user
      WHERE 
        mk.id_kelompok = $1;
    `;

    const result = await handlerQuery(query, [id_kelompok]);

    return NextResponse.json({
      success: true,
      rows: result.rows || [],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data user kelompok",
      rows: [],
    });
  }
}

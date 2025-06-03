import { NextResponse } from "next/server";
import handlerQuery from "../../../../../utils/db";

export async function GET() {
  try {
    const query = `
      SELECT 
        id_user AS id,
        nama,
        npm,
        email
      FROM 
        users
      WHERE 
        role = 'Dosen'
      ORDER BY 
        nama;
    `;

    const data = await handlerQuery(query);

    return NextResponse.json({
      success: true,
      rows: data.rows || [],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Gagal mengambil data dosen",
      rows: [],
    });
  }
}

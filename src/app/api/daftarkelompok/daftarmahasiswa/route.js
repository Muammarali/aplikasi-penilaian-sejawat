import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const { id_mk } = await req.json();

  try {
    const query = `
        SELECT 
            dk.id_user, u.nama
        FROM 
            daftar_kelas dk
        JOIN 
            users u ON dk.id_user = u.id_user
        WHERE 
            dk.id_mk = $1
        AND dk.id_user NOT IN (
            SELECT mk.id_user
            FROM mahasiswa_kelompok mk
            JOIN kelompok k ON mk.id_kelompok = k.id_kelompok
            WHERE k.id_mk = $1
        );
    `;

    const result = await handlerQuery(query, [id_mk]);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error mengambil data mahasiswa:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data mahasiswa",
    });
  }
}

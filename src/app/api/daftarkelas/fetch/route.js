import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function GET() {
  try {
    const query = `
        SELECT 
            dk.id_daftar_kelas,
            dk.id_user,
            mk.kode_mk,
            mk.nama,
            mk.kelas,
            COALESCE(jp.jumlah_peserta, 0) AS jumlah_peserta,
            COALESCE(jk.jumlah_kelompok, 0) AS jumlah_kelompok
        FROM 
            daftar_kelas dk
        JOIN 
            mata_kuliah mk ON dk.id_mk = mk.id_mk
        LEFT JOIN (
            SELECT 
                id_mk,
                COUNT(DISTINCT id_user) AS jumlah_peserta
            FROM 
                daftar_kelas
            GROUP BY 
                id_mk
        ) jp ON mk.id_mk = jp.id_mk
        LEFT JOIN (
            SELECT 
                id_mk,
                COUNT(*) AS jumlah_kelompok
            FROM 
                kelompok
            GROUP BY 
                id_mk
        ) jk ON mk.id_mk = jk.id_mk;
      `;

    const values = [];

    const data = await handlerQuery(query, values);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: "Error route", details: error },
      { status: 500 }
    );
  }
}

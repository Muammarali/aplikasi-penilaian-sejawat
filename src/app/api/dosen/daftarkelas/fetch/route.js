import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function POST(req) {
  const request = await req.json();
  const id_user = request.id_user;

  try {
    const query = `
      SELECT 
          mk.id_mk,
          mk.kode_mk,
          mk.nama,
          mk.kelas,
          COALESCE(jp.jumlah_peserta, 0) AS jumlah_peserta,
          COALESCE(jk.jumlah_kelompok, 0) AS jumlah_kelompok
      FROM 
          dosen_mata_kuliah dmt
      JOIN 
          mata_kuliah mk ON dmt.id_mk = mk.id_mk
      LEFT JOIN (
          SELECT 
              dk.id_mk,
              COUNT(DISTINCT dk.id_user) AS jumlah_peserta
          FROM 
              daftar_kelas dk
          JOIN users u ON dk.id_user = u.id_user
          WHERE u.role = 'Mahasiswa'
          GROUP BY 
              dk.id_mk
      ) jp ON mk.id_mk = jp.id_mk
      LEFT JOIN (
          SELECT 
              id_mk,
              COUNT(*) AS jumlah_kelompok
          FROM 
              kelompok
          GROUP BY 
              id_mk
      ) jk ON mk.id_mk = jk.id_mk
      WHERE
        dmt.id_user = $1
        AND mk.status = true
        AND (dmt.status = true OR dmt.status IS NULL)
      ORDER BY 
        mk.nama, mk.kelas;
    `;

    const data = await handlerQuery(query, [id_user]);
    return NextResponse.json({
      success: true,
      data: data.rows,
    });
  } catch (error) {
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Error route", details: error.message },
      { status: 500 }
    );
  }
}

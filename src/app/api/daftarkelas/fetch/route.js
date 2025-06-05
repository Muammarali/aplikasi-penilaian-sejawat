import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const request = await req.json();
  const id_user = request.id_user;

  try {
    const query = `
      SELECT 
          dk.id_daftar_kelas,
          dk.id_user,
          dk.id_mk,
          mk.kode_mk,
          mk.nama,
          mk.kelas,
          mk.status,
          CONCAT(ta.nama, ' - ', ta.tipe) AS tahun_ajaran,
          COALESCE(jp.jumlah_peserta, 0) AS jumlah_peserta,
          COALESCE(jk.jumlah_kelompok, 0) AS jumlah_kelompok
      FROM 
          daftar_kelas dk
      JOIN 
          mata_kuliah mk ON dk.id_mk = mk.id_mk
      LEFT JOIN 
          tahun_ajaran ta ON mk.id_tahun_ajaran = ta.id_tahun_ajaran
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
        dk.id_user = $1
        AND mk.status = true
      ORDER BY 
        ta.nama DESC, ta.tipe, mk.nama, mk.kelas;
    `;

    const values = [id_user];

    const data = await handlerQuery(query, values);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: "Error route", details: error },
      { status: 500 }
    );
  }
}

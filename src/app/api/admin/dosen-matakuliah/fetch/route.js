import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function GET() {
  try {
    const query = `
      SELECT 
        mk.id_mk,
        mk.kode_mk,
        mk.nama AS nama_mata_kuliah,
        mk.kelas,
        mk.sks,
        CONCAT(ta.nama, ' ', ta.tipe) AS tahun_ajaran,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', u.id_user,
              'npm', u.npm,
              'nama', u.nama,
              'email', u.email
            )
          ) FILTER (WHERE u.id_user IS NOT NULL),
          '[]'
        ) AS dosen_pengampu
      FROM 
        mata_kuliah mk
      INNER JOIN 
        tahun_mata_kuliah tm ON mk.id_mk = tm.id_mk
      INNER JOIN 
        tahun_ajaran ta ON tm.id_tahun_ajaran = ta.id_tahun_ajaran
      LEFT JOIN 
        dosen_mata_kuliah dm ON mk.id_mk = dm.id_mk
      LEFT JOIN 
        users u ON dm.id_user = u.id_user
      GROUP BY 
        mk.id_mk, mk.kode_mk, mk.nama, mk.kelas, mk.sks, ta.nama, ta.tipe
      ORDER BY 
        mk.nama ASC, mk.kelas;
    `;

    const data = await handlerQuery(query);

    const result = data.rows.map((item) => ({
      id: item.id_mk,
      kodeMatkul: item.kode_mk,
      namaMatkul: item.nama_mata_kuliah,
      kelas: item.kelas,
      sks: item.sks,
      tahunAjaran: item.tahun_ajaran,
      dosenPengampu: item.dosen_pengampu,
    }));

    return NextResponse.json({
      success: true,
      rows: result,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data mata kuliah",
      rows: [],
    });
  }
}

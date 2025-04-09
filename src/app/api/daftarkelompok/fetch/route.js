import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const request = await req.json();
  const matkul = request.matkul;

  try {
    // Ambil id_mk berdasarkan nama matkul
    let getIdMkQuery = `SELECT id_mk FROM mata_kuliah WHERE nama = $1 LIMIT 1`;
    let result = await handlerQuery(getIdMkQuery, [matkul]);

    if (result.length === 0) {
      return NextResponse.json({ error: "Mata kuliah tidak ditemukan" });
    }

    let id_mk = result.rows[0].id_mk;

    // Query jumlah anggota per kelompok berdasarkan id_mk
    let query = `
      SELECT 
        k.id_kelompok,
          k.nama_kelompok,
          k.kapasitas,
          COUNT(mk.id_user) AS jumlah_anggota
      FROM 
          kelompok k
      LEFT JOIN 
          mahasiswa_kelompok mk ON k.id_kelompok = mk.id_kelompok
      WHERE 
          k.id_mk = $1
      GROUP BY 
          k.id_kelompok, k.nama_kelompok, k.kapasitas;
    `;

    let data = await handlerQuery(query, [id_mk]);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error on route" });
  }
}

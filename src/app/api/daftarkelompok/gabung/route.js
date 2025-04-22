import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const { id_user, id_kelompok, peran } = await req.json();

  try {
    // 1. Ambil id_mk dari kelompok
    const mkQuery = `SELECT id_mk FROM kelompok WHERE id_kelompok = $1`;
    const mkResult = await handlerQuery(mkQuery, [id_kelompok]);

    if (mkResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Kelompok tidak ditemukan",
      });
    }

    const id_mk = mkResult.rows[0].id_mk;

    // 2. Cek apakah user sudah bergabung ke kelompok lain di matkul yang sama
    const checkQuery = `
      SELECT mk.id_kelompok
      FROM mahasiswa_kelompok mk
      JOIN kelompok k ON mk.id_kelompok = k.id_kelompok
      WHERE mk.id_user = $1 AND k.id_mk = $2
      LIMIT 1;
    `;
    const check = await handlerQuery(checkQuery, [id_user, id_mk]);

    if (check.rows.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Anda sudah tergabung dalam kelompok lain di mata kuliah ini",
      });
    }

    // 3. Cek apakah kelompok sudah penuh
    const kapasitasQuery = `
      SELECT 
        k.kapasitas,
        COUNT(mk.id_user) AS jumlah_anggota
      FROM 
        kelompok k
      LEFT JOIN 
        mahasiswa_kelompok mk ON k.id_kelompok = mk.id_kelompok
      WHERE 
        k.id_kelompok = $1
      GROUP BY 
        k.kapasitas;
    `;
    const kapasitasResult = await handlerQuery(kapasitasQuery, [id_kelompok]);

    const { kapasitas, jumlah_anggota } = kapasitasResult.rows[0];

    if (jumlah_anggota >= kapasitas) {
      return NextResponse.json({
        success: false,
        message: "Kelompok sudah mencapai kapasitas maksimal",
      });
    }

    // 4. Insert data
    const insertQuery = `
      INSERT INTO mahasiswa_kelompok (id_user, id_kelompok, peran)
      VALUES ($1, $2, $3);
    `;
    await handlerQuery(insertQuery, [id_user, id_kelompok, peran]);

    return NextResponse.json({
      success: true,
      message: "Berhasil bergabung ke kelompok",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan saat bergabung ke kelompok",
    });
  }
}

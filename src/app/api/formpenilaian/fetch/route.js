import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const request = await req.json();
  const matkul = request.matkul;

  try {
    let getIdMkQuery = `SELECT id_mk FROM mata_kuliah WHERE nama = $1 LIMIT 1`;
    let result = await handlerQuery(getIdMkQuery, [matkul]);

    if (result.length === 0) {
      return NextResponse.json({ error: "Mata kuliah tidak ditemukan" });
    }

    let id_mk = result.rows[0].id_mk;

    const query = `
        SELECT 
            fp.id_form, fp.nama, jf.nama as jenis
        FROM 
            form_penilaian fp
        JOIN
            jenis_form jf ON fp.id_jenis = jf.id_jenis
        WHERE
            fp.id_mk = $1
      `;

    const values = [id_mk];
    const data = await handlerQuery(query, values);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: "Error route", details: error },
      { status: 500 }
    );
  }
}

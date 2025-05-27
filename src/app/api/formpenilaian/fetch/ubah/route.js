// /api/form-penilaian/[id]/route.js
import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function POST(req) {
  const { id_form } = await req.json();

  try {
    // Get form data
    const formQuery = `
      SELECT 
        fp.id_form,
        fp.nama,
        fp.id_mk,
        fp.id_jenis,
        fp.status,
        jf.nama as jenis_nama
      FROM form_penilaian fp
      LEFT JOIN jenis_form jf ON fp.id_jenis = jf.id_jenis
      WHERE fp.id_form = $1
    `;

    const formResult = await handlerQuery(formQuery, [id_form]);

    if (formResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Form tidak ditemukan",
      });
    }

    const formData = formResult.rows[0];

    // Get komponen penilaian
    const komponenQuery = `
      SELECT 
        id_komponen,
        nama_komponen,
        bobot,
        deskripsi,
        tipe_penilaian
      FROM komponen_penilaian
      WHERE id_form = $1
      ORDER BY tipe_penilaian, id_komponen
    `;

    const komponenResult = await handlerQuery(komponenQuery, [id_form]);

    return NextResponse.json({
      success: true,
      data: {
        id_form: formData.id_form,
        nama: formData.nama,
        id_mk: formData.id_mk,
        id_jenis: formData.id_jenis,
        jenis_nama: formData.jenis_nama,
        status: formData.status,
        komponen: komponenResult.rows,
      },
    });
  } catch (error) {
    console.error("Error saat mengambil data form:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
}

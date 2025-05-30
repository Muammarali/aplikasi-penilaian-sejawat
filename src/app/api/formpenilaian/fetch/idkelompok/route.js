import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function POST(req) {
  const { id_user, id_form } = await req.json();

  try {
    // 1. Dapatkan id_mk dari form_penilaian berdasarkan id_form
    const formQuery = `
      SELECT id_mk 
      FROM form_penilaian 
      WHERE id_form = $1
    `;

    const formResult = await handlerQuery(formQuery, [id_form]);

    if (formResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Form tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const id_mk = formResult.rows[0].id_mk;

    // 2. Dapatkan id_kelompok user berdasarkan id_user dan id_mk
    const kelompokQuery = `
      SELECT 
        k.id_kelompok,
        k.nama_kelompok,
        mk.peran,
        k.id_mk
      FROM kelompok k
      JOIN mahasiswa_kelompok mk ON k.id_kelompok = mk.id_kelompok
      WHERE mk.id_user = $1 AND k.id_mk = $2
    `;

    const kelompokResult = await handlerQuery(kelompokQuery, [id_user, id_mk]);

    if (kelompokResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User tidak terdaftar dalam kelompok untuk mata kuliah ini",
        },
        { status: 404 }
      );
    }

    const result = {
      id_kelompok: kelompokResult.rows[0].id_kelompok,
      nama_kelompok: kelompokResult.rows[0].nama_kelompok,
      peran: kelompokResult.rows[0].peran,
      id_mk: kelompokResult.rows[0].id_mk,
      id_user: id_user,
      id_form: id_form,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in form component query:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error processing request",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

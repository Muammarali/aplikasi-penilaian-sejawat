import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

// GET method untuk ambil hasil penilaian berdasarkan id_penilai dan id_dinilai
export async function POST(req) {
  try {
    const { id_mk } = await req.json();

    // Validasi parameter
    if (!id_penilai || !id_dinilai) {
      return NextResponse.json(
        {
          success: false,
          message: "Both id_penilai and id_dinilai are required.",
        },
        { status: 400 }
      );
    }

    // Query hasil penilaian
    const query = `
      SELECT 
        u_penilai.nama AS nama_penilai,
        u_dinilai.nama AS nama_dinilai,
        fp.nama,
        fp.id_form,
        k.nama_komponen,
        hp.nilai,
        hp.id_dinilai,
        hp.id_penilai
      FROM 
        hasil_penilaian hp
      JOIN users u_penilai ON hp.id_penilai = u_penilai.id_user
      JOIN users u_dinilai ON hp.id_dinilai = u_dinilai.id_user
      JOIN form_penilaian fp ON hp.id_form = fp.id_form
      JOIN komponen_penilaian k ON hp.id_komponen = k.id_komponen
      WHERE hp.id_penilai = $1 AND hp.id_dinilai = $2
      ORDER BY u_penilai.nama, k.nama_komponen
    `;

    // Eksekusi query
    const result = await handlerQuery(query, [id_penilai, id_dinilai]);

    // Jika tidak ada data
    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No assessment data found for the given IDs.",
        },
        { status: 404 }
      );
    }

    // Kirim data hasil penilaian
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching assessment data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error processing request",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function POST(req) {
  const { id_form } = await req.json();

  try {
    if (!id_form) {
      return NextResponse.json(
        { success: false, message: "id_form wajib diisi" },
        { status: 400 }
      );
    }

    const query = `
        SELECT kp.id_komponen, fp.id_form
        FROM komponen_penilaian kp
        JOIN form_penilaian fp ON kp.id_form = fp.id_form
        WHERE fp.id_jenis = 3 AND fp.id_form = $1
    `;

    const result = await handlerQuery(query, [id_form]);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error checking komponen:", error);
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

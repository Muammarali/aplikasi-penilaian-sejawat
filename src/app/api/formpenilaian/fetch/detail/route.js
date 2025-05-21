import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function POST(req) {
  const { id_form, id_mk, id_user } = await req.json();

  try {
    const getDetailFormQuery = `
      SELECT id_form, nama, id_jenis FROM form_penilaian
      WHERE id_form = $1 AND id_mk = $2
      LIMIT 1
    `;

    const data = await handlerQuery(getDetailFormQuery, [id_form, id_mk]);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error route", details: error },
      { status: 500 }
    );
  }
}

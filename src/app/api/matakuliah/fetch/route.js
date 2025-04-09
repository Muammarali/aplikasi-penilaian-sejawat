import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function GET() {
  try {
    const query = `
        SELECT id_mk, kode_mk, nama, kelas FROM mata_kuliah
      `;

    const values = [];

    const data = await handlerQuery(query, values);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: "Error route", details: error },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function GET() {
  try {
    const query = `
        SELECT * FROM kelompok
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

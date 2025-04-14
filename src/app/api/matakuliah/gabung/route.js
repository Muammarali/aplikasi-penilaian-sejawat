import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const request = await req.json();
  const id_mk = request.id_mk;
  const id_user = request.id_user;

  console.log(id_mk);
  console.log(id_user);

  try {
    const query = `
      INSERT INTO daftar_kelas(id_mk, id_user)
      VALUES ($1, $2);
    `;

    const values = [id_mk, id_user];
    const data = await handlerQuery(query, values);

    return NextResponse.json({
      success: true,
      rows: data.rows || [],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
      rows: [],
    });
  }
}

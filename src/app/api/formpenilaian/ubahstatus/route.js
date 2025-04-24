import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function PUT(req) {
  const { id_form, status } = await req.json();

  try {
    const updateQuery = `
      UPDATE form_penilaian
      SET status = $1
      WHERE id_form = $2
    `;
    await handlerQuery(updateQuery, [status, id_form]);

    return NextResponse.json({
      success: true,
      message: "Status form berhasil diubah",
    });
  } catch (error) {
    console.error("Gagal update status form:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan saat memperbarui status form",
    });
  }
}

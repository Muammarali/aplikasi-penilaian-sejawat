import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function POST(req) {
  const { id_mk, mahasiswaIds } = await req.json();

  try {
    if (!mahasiswaIds || mahasiswaIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Tidak ada mahasiswa yang dipilih.",
      });
    }

    const values = mahasiswaIds
      .map((_, index) => `($1, $${index + 2})`)
      .join(", ");

    const params = [id_mk, ...mahasiswaIds];

    const query = `
      INSERT INTO daftar_kelas (id_mk, id_user)
      VALUES ${values};
    `;

    await handlerQuery(query, params);

    return NextResponse.json({
      success: true,
      message: `${mahasiswaIds.length} mahasiswa berhasil ditambahkan ke mata kuliah ini.`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Gagal menambahkan mahasiswa ke mata kuliah ini.",
    });
  }
}

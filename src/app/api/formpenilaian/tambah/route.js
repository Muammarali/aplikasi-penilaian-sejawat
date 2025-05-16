import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  const { nama_form, id_mk, id_jenis, formData } = await req.json();

  try {
    // Insert ke form_penilaian
    const insertQuery = `
      INSERT INTO form_penilaian (nama, id_mk, id_jenis, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const buatForm = await handlerQuery(insertQuery, [
      nama_form,
      id_mk,
      id_jenis,
      false,
    ]);

    const id_form = buatForm.rows[0].id_form;
    console.log(id_form);

    // Insert komponen_penilaian sesuai id_jenis
    if (id_jenis == 1) {
      for (const item of formData.anggota_ke_anggota) {
        await handlerQuery(
          `INSERT INTO komponen_penilaian (nama_komponen, bobot, deskripsi, tipe_penilaian, id_form)
          VALUES ($1, $2, $3, $4, $5)`,
          [
            item.nama_komponen,
            item.bobot,
            item.deskripsi,
            "Anggota ke Anggota",
            id_form,
          ]
        );
      }

      for (const item of formData.anggota_ke_ketua) {
        await handlerQuery(
          `INSERT INTO komponen_penilaian (nama_komponen, bobot, deskripsi, tipe_penilaian, id_form)
          VALUES ($1, $2, $3, $4, $5)`,
          [
            item.nama_komponen,
            item.bobot,
            item.deskripsi,
            "Anggota ke Ketua",
            id_form,
          ]
        );
      }
    } else if (id_jenis == 2) {
      for (const item of formData.anggota_ke_anggota) {
        await handlerQuery(
          `INSERT INTO komponen_penilaian (nama_komponen, bobot, deskripsi, tipe_penilaian, id_form)
          VALUES ($1, $2, $3, $4, $5)`,
          [
            item.nama_komponen,
            item.bobot,
            item.deskripsi,
            "Anggota ke Anggota",
            id_form,
          ]
        );
      }
    } else if (id_jenis == 3) {
      for (const item of formData.ketua_ke_anggota) {
        await handlerQuery(
          `INSERT INTO komponen_penilaian (nama_komponen, bobot, deskripsi, tipe_penilaian, id_form)
          VALUES ($1, $2, $3, $4, $5)`,
          [
            item.nama_komponen,
            item.bobot,
            item.deskripsi,
            "Ketua ke Anggota",
            id_form,
          ]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Form & Komponen berhasil dibuat",
      data: buatForm.rows[0],
    });
  } catch (error) {
    console.error("Error saat membuat form & komponen:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
}

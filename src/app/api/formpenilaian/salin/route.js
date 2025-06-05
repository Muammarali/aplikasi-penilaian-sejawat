import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

// POST - Menyalin form penilaian
export async function POST(req) {
  try {
    const { id_form } = await req.json();

    if (!id_form) {
      return NextResponse.json({
        success: false,
        message: "ID form harus diisi",
      });
    }

    // 1. Ambil data form yang akan disalin (plus id_mk)
    const getFormQuery = `
      SELECT id_form, nama, id_jenis, id_mk, status
      FROM form_penilaian 
      WHERE id_form = $1
    `;

    const formResult = await handlerQuery(getFormQuery, [id_form]);

    if (formResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Form tidak ditemukan",
      });
    }

    const originalForm = formResult.rows[0];

    // 2. Buat nama form baru dengan suffix "- Salinan"
    const newFormName = `${originalForm.nama} - Salinan`;

    // 3. Insert form baru (dengan id_mk)
    const insertFormQuery = `
      INSERT INTO form_penilaian (nama, id_jenis, id_mk, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id_form, nama, status
    `;

    const newFormResult = await handlerQuery(insertFormQuery, [
      newFormName,
      originalForm.id_jenis,
      originalForm.id_mk, // salin id_mk ke form baru
      true,
    ]);

    const newFormId = newFormResult.rows[0].id_form;

    // 4. Ambil semua komponen dari form asli
    const getKomponenQuery = `
      SELECT nama_komponen, bobot, deskripsi, tipe_penilaian
      FROM komponen_penilaian 
      WHERE id_form = $1
      ORDER BY id_komponen
    `;

    const komponenResult = await handlerQuery(getKomponenQuery, [id_form]);

    // 5. Insert komponen ke form baru
    let insertedKomponenCount = 0;

    if (komponenResult.rows.length > 0) {
      for (const komponen of komponenResult.rows) {
        const insertKomponenQuery = `
          INSERT INTO komponen_penilaian (nama_komponen, bobot, deskripsi, tipe_penilaian, id_form)
          VALUES ($1, $2, $3, $4, $5)
        `;

        await handlerQuery(insertKomponenQuery, [
          komponen.nama_komponen,
          komponen.bobot,
          komponen.deskripsi,
          komponen.tipe_penilaian,
          newFormId,
        ]);

        insertedKomponenCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Form berhasil disalin! ${insertedKomponenCount} komponen berhasil disalin.`,
      data: {
        original_form_id: id_form,
        new_form_id: newFormId,
        new_form_name: newFormName,
        copied_components: insertedKomponenCount,
        id_mk: originalForm.id_mk, // kirim juga kalau mau
      },
    });
  } catch (error) {
    console.error("Error saat menyalin form:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
}

// GET - Ambil detail form beserta komponennya
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id_form = searchParams.get("id_form");

    if (!id_form) {
      return NextResponse.json({
        success: false,
        message: "ID form harus diisi",
      });
    }

    // Ambil detail form beserta komponennya (plus id_mk)
    const getFormDetailQuery = `
      SELECT 
        fp.id_form,
        fp.nama,
        fp.id_jenis,
        fp.id_mk,
        fp.created_at,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id_komponen', kp.id_komponen,
              'nama_komponen', kp.nama_komponen,
              'bobot', kp.bobot,
              'deskripsi', kp.deskripsi,
              'tipe_penilaian', kp.tipe_penilaian
            ) ORDER BY kp.id_komponen
          ) FILTER (WHERE kp.id_komponen IS NOT NULL), 
          '[]'::json
        ) AS komponen
      FROM form_penilaian fp
      LEFT JOIN komponen_penilaian kp ON fp.id_form = kp.id_form
      WHERE fp.id_form = $1
      GROUP BY fp.id_form, fp.nama, fp.id_jenis, fp.id_mk, fp.created_at
    `;

    const result = await handlerQuery(getFormDetailQuery, [id_form]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Form tidak ditemukan",
      });
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error saat mengambil detail form:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
}

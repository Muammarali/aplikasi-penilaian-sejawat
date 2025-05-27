import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function PUT(req) {
  const requestBody = await req.json();
  const { id_form, nama_form, id_jenis } = requestBody;
  const formData = requestBody.formData?.formData || requestBody.formData;

  try {
    // Update nama form dan jenis
    const updateFormQuery = `
      UPDATE form_penilaian 
      SET nama = $1, id_jenis = $2
      WHERE id_form = $3
      RETURNING *;
    `;

    const updatedForm = await handlerQuery(updateFormQuery, [
      nama_form,
      id_jenis,
      id_form,
    ]);

    if (updatedForm.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Form tidak ditemukan",
      });
    }

    // Jika jenis 3, hapus semua komponen existing
    if (id_jenis == 3) {
      await handlerQuery(`DELETE FROM komponen_penilaian WHERE id_form = $1`, [
        id_form,
      ]);
      return NextResponse.json({
        success: true,
        message: "Form berhasil diubah ke jenis 3. Semua komponen dihapus.",
        data: { id_form },
      });
    }

    // Hapus komponen yang tidak sesuai dengan jenis form baru
    let deletedCount = 0;

    if (id_jenis == 1) {
      const deleteResult = await handlerQuery(
        `DELETE FROM komponen_penilaian 
         WHERE id_form = $1 AND tipe_penilaian = $2`,
        [id_form, "Ketua ke Anggota"]
      );
      deletedCount += deleteResult.rowCount;
    } else if (id_jenis == 2) {
      const deleteResult = await handlerQuery(
        `DELETE FROM komponen_penilaian 
         WHERE id_form = $1 AND tipe_penilaian IN ($2, $3)`,
        [id_form, "Anggota ke Ketua", "Ketua ke Anggota"]
      );
      deletedCount += deleteResult.rowCount;
    }

    // Update existing komponen & insert baru
    let updatedCount = 0;
    let insertedCount = 0;

    const updateOrInsertKomponen = async (komponenList, tipe_penilaian) => {
      if (!komponenList || !Array.isArray(komponenList)) return;

      for (const komponen of komponenList) {
        if (!komponen.nama_komponen || !komponen.bobot || !komponen.deskripsi) {
          continue;
        }

        if (komponen.id_komponen) {
          const updateResult = await handlerQuery(
            `UPDATE komponen_penilaian 
             SET nama_komponen = $1, bobot = $2, deskripsi = $3
             WHERE id_komponen = $4 AND id_form = $5`,
            [
              komponen.nama_komponen.trim(),
              parseInt(komponen.bobot),
              komponen.deskripsi.trim(),
              komponen.id_komponen,
              id_form,
            ]
          );
          if (updateResult.rowCount > 0) updatedCount++;
        } else {
          const insertResult = await handlerQuery(
            `INSERT INTO komponen_penilaian (nama_komponen, bobot, deskripsi, tipe_penilaian, id_form)
             VALUES ($1, $2, $3, $4, $5) RETURNING id_komponen`,
            [
              komponen.nama_komponen.trim(),
              parseInt(komponen.bobot),
              komponen.deskripsi.trim(),
              tipe_penilaian,
              id_form,
            ]
          );
          if (insertResult.rows.length > 0) insertedCount++;
        }
      }
    };

    await updateOrInsertKomponen(
      formData.anggota_ke_anggota,
      "Anggota ke Anggota"
    );
    if (id_jenis == 1) {
      await updateOrInsertKomponen(
        formData.anggota_ke_ketua,
        "Anggota ke Ketua"
      );
    }

    return NextResponse.json({
      success: true,
      message: `Form berhasil diubah. ${updatedCount} komponen diperbarui, ${insertedCount} komponen baru ditambahkan, ${deletedCount} komponen tidak relevan dihapus.`,
      data: {
        id_form,
        updated_komponen: updatedCount,
        inserted_komponen: insertedCount,
        deleted_komponen: deletedCount,
      },
    });
  } catch (error) {
    console.error("Error saat mengubah form & komponen:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
}

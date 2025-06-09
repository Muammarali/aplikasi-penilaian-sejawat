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

    // Jika jenis 3, hapus semua komponen existing dan return
    if (id_jenis == 3) {
      await handlerQuery(`DELETE FROM komponen_penilaian WHERE id_form = $1`, [
        id_form,
      ]);

      // Insert komponen "Dosen ke Ketua" jika ada
      if (formData.dosen_ke_ketua && Array.isArray(formData.dosen_ke_ketua)) {
        for (const komponen of formData.dosen_ke_ketua) {
          if (komponen.nama_komponen && komponen.bobot && komponen.deskripsi) {
            await handlerQuery(
              `INSERT INTO komponen_penilaian (nama_komponen, bobot, deskripsi, tipe_penilaian, id_form)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                komponen.nama_komponen.trim(),
                parseInt(komponen.bobot),
                komponen.deskripsi.trim(),
                "Dosen ke Ketua",
                id_form,
              ]
            );
          }
        }
      }

      return NextResponse.json({
        success: true,
        message:
          "Form berhasil diubah ke jenis 3. Komponen dosen ke ketua ditambahkan.",
        data: { id_form },
      });
    }

    // Hapus komponen yang tidak sesuai dengan jenis form baru
    let deletedCount = 0;

    if (id_jenis == 1) {
      // Untuk jenis 1, hapus komponen "Ketua ke Anggota" dan "Dosen ke Ketua"
      const deleteResult = await handlerQuery(
        `DELETE FROM komponen_penilaian 
         WHERE id_form = $1 AND tipe_penilaian IN ($2, $3)`,
        [id_form, "Ketua ke Anggota", "Dosen ke Ketua"]
      );
      deletedCount += deleteResult.rowCount;
    } else if (id_jenis == 2) {
      // Untuk jenis 2, hapus komponen "Anggota ke Ketua", "Ketua ke Anggota", dan "Dosen ke Ketua"
      const deleteResult = await handlerQuery(
        `DELETE FROM komponen_penilaian 
         WHERE id_form = $1 AND tipe_penilaian IN ($2, $3, $4)`,
        [id_form, "Anggota ke Ketua", "Ketua ke Anggota", "Dosen ke Ketua"]
      );
      deletedCount += deleteResult.rowCount;
    }

    const existingKomponenIds = new Set();

    // Kumpulkan semua ID komponen yang masih ada
    const collectExistingIds = (komponenList) => {
      if (komponenList && Array.isArray(komponenList)) {
        komponenList.forEach((komponen) => {
          if (komponen.id_komponen) {
            existingKomponenIds.add(komponen.id_komponen);
          }
        });
      }
    };

    // Collect IDs from all relevant component types
    collectExistingIds(formData.anggota_ke_anggota);
    if (id_jenis == 1) {
      collectExistingIds(formData.anggota_ke_ketua);
    }

    if (existingKomponenIds.size > 0) {
      const idsArray = Array.from(existingKomponenIds);
      const placeholders = idsArray
        .map((_, index) => `$${index + 2}`)
        .join(",");

      const deleteOrphanedQuery = `
        DELETE FROM komponen_penilaian 
        WHERE id_form = $1 
        AND id_komponen NOT IN (${placeholders})
        AND tipe_penilaian IN ($${idsArray.length + 2}, $${idsArray.length + 3})
      `;

      const deleteParams = [id_form, ...idsArray, "Anggota ke Anggota"];
      if (id_jenis == 1) {
        deleteParams.push("Anggota ke Ketua");
      } else {
        // Untuk jenis 2, hanya Anggota ke Anggota
        deleteParams[deleteParams.length - 1] = "Anggota ke Anggota";
        const deleteOrphanedQueryJenis2 = `
          DELETE FROM komponen_penilaian 
          WHERE id_form = $1 
          AND id_komponen NOT IN (${placeholders})
          AND tipe_penilaian = $${idsArray.length + 2}
        `;
        const deleteOrphanedResult = await handlerQuery(
          deleteOrphanedQueryJenis2,
          [id_form, ...idsArray, "Anggota ke Anggota"]
        );
        deletedCount += deleteOrphanedResult.rowCount;
      }

      if (id_jenis == 1) {
        const deleteOrphanedResult = await handlerQuery(
          deleteOrphanedQuery,
          deleteParams
        );
        deletedCount += deleteOrphanedResult.rowCount;
      }
    } else {
      const deleteAllQuery =
        id_jenis == 1
          ? `DELETE FROM komponen_penilaian WHERE id_form = $1 AND tipe_penilaian IN ($2, $3)`
          : `DELETE FROM komponen_penilaian WHERE id_form = $1 AND tipe_penilaian = $2`;

      const deleteAllParams =
        id_jenis == 1
          ? [id_form, "Anggota ke Anggota", "Anggota ke Ketua"]
          : [id_form, "Anggota ke Anggota"];

      const deleteAllResult = await handlerQuery(
        deleteAllQuery,
        deleteAllParams
      );
      deletedCount += deleteAllResult.rowCount;
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

    // Handle komponen berdasarkan jenis form
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

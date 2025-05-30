import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  // Tambahkan id_user ke dalam destructuring
  const { nama_form, id_mk, id_jenis, formData, id_form, id_user } =
    await req.json();

  try {
    let form_id;
    let responseMessage;

    // Cek apakah ini untuk form yang sudah ada (ketua mengisi form jenis 3)
    if (id_form && !nama_form) {
      // Gunakan id_form yang sudah ada
      form_id = id_form;
      responseMessage = "Komponen berhasil ditambahkan ke form";
    } else {
      // Buat form baru
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

      form_id = buatForm.rows[0].id_form;
      responseMessage = "Form & Komponen berhasil dibuat";
    }

    // Helper function to filter out empty components
    const filterValidComponents = (components) => {
      return components.filter(
        (item) =>
          item.nama_komponen &&
          item.nama_komponen.trim() !== "" &&
          item.bobot &&
          item.bobot !== "" &&
          item.deskripsi &&
          item.deskripsi.trim() !== ""
      );
    };

    // Query untuk mengambil id_kelompok berdasarkan id_user dan id_mk
    let id_kelompok = null;
    if (id_jenis == 3 && id_user && id_mk) {
      const kelompokQuery = `
        SELECT k.id_kelompok 
        FROM kelompok k
        JOIN mahasiswa_kelompok mk ON k.id_kelompok = mk.id_kelompok
        WHERE mk.id_user = $1 AND k.id_mk = $2 AND mk.peran = 'Ketua'
      `;

      const kelompokResult = await handlerQuery(kelompokQuery, [
        id_user,
        id_mk,
      ]);

      if (kelompokResult.rows.length > 0) {
        id_kelompok = kelompokResult.rows[0].id_kelompok;
      }
    }

    // Insert komponen_penilaian sesuai id_jenis
    if (id_jenis == 1) {
      const validAnggotaKeAnggota = filterValidComponents(
        formData.anggota_ke_anggota || []
      );
      for (const item of validAnggotaKeAnggota) {
        await handlerQuery(
          `INSERT INTO komponen_penilaian (nama_komponen, bobot, deskripsi, tipe_penilaian, id_form)
          VALUES ($1, $2, $3, $4, $5)`,
          [
            item.nama_komponen,
            parseInt(item.bobot),
            item.deskripsi,
            "Anggota ke Anggota",
            form_id,
          ]
        );
      }

      const validAnggotaKeKetua = filterValidComponents(
        formData.anggota_ke_ketua || []
      );
      for (const item of validAnggotaKeKetua) {
        await handlerQuery(
          `INSERT INTO komponen_penilaian (nama_komponen, bobot, deskripsi, tipe_penilaian, id_form)
          VALUES ($1, $2, $3, $4, $5)`,
          [
            item.nama_komponen,
            parseInt(item.bobot),
            item.deskripsi,
            "Anggota ke Ketua",
            form_id,
          ]
        );
      }
    } else if (id_jenis == 2) {
      const validAnggotaKeAnggota = filterValidComponents(
        formData.anggota_ke_anggota || []
      );
      for (const item of validAnggotaKeAnggota) {
        await handlerQuery(
          `INSERT INTO komponen_penilaian (nama_komponen, bobot, deskripsi, tipe_penilaian, id_form)
          VALUES ($1, $2, $3, $4, $5)`,
          [
            item.nama_komponen,
            parseInt(item.bobot),
            item.deskripsi,
            "Anggota ke Anggota",
            form_id,
          ]
        );
      }
    } else if (id_jenis == 3) {
      // Handle untuk jenis form 3

      // Insert komponen dosen ke ketua (untuk dosen yang membuat form)
      if (formData.dosen_ke_ketua) {
        const validDosenKeKetua = filterValidComponents(
          formData.dosen_ke_ketua
        );
        for (const item of validDosenKeKetua) {
          await handlerQuery(
            `INSERT INTO komponen_penilaian (nama_komponen, bobot, deskripsi, tipe_penilaian, id_form)
            VALUES ($1, $2, $3, $4, $5)`,
            [
              item.nama_komponen,
              parseInt(item.bobot),
              item.deskripsi,
              "Dosen ke Ketua",
              form_id,
            ]
          );
        }
      }

      // Insert komponen ketua ke anggota (untuk ketua yang mengisi form)
      if (formData.ketua_ke_anggota) {
        const validKetuaKeAnggota = filterValidComponents(
          formData.ketua_ke_anggota
        );
        for (const item of validKetuaKeAnggota) {
          await handlerQuery(
            `INSERT INTO komponen_penilaian (nama_komponen, bobot, deskripsi, tipe_penilaian, id_form, id_kelompok)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              item.nama_komponen,
              parseInt(item.bobot),
              item.deskripsi,
              "Ketua ke Anggota",
              form_id,
              id_kelompok,
            ]
          );
        }
      }

      // Insert komponen anggota ke anggota (jika ada)
      if (formData.anggota_ke_anggota) {
        const validAnggotaKeAnggota = filterValidComponents(
          formData.anggota_ke_anggota
        );
        for (const item of validAnggotaKeAnggota) {
          await handlerQuery(
            `INSERT INTO komponen_penilaian (nama_komponen, bobot, deskripsi, tipe_penilaian, id_form)
            VALUES ($1, $2, $3, $4, $5)`,
            [
              item.nama_komponen,
              parseInt(item.bobot),
              item.deskripsi,
              "Anggota ke Anggota",
              form_id,
            ]
          );
        }
      }

      // Insert komponen anggota ke ketua (jika ada)
      if (formData.anggota_ke_ketua) {
        const validAnggotaKeKetua = filterValidComponents(
          formData.anggota_ke_ketua
        );
        for (const item of validAnggotaKeKetua) {
          await handlerQuery(
            `INSERT INTO komponen_penilaian (nama_komponen, bobot, deskripsi, tipe_penilaian, id_form)
            VALUES ($1, $2, $3, $4, $5)`,
            [
              item.nama_komponen,
              parseInt(item.bobot),
              item.deskripsi,
              "Anggota ke Ketua",
              form_id,
            ]
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      data: { id_form: form_id },
    });
  } catch (error) {
    console.error("Error saat membuat form & komponen:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
}

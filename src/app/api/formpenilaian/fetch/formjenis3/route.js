import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function POST(req) {
  const { id_form, tipe_pengecekan, id_user } = await req.json();

  try {
    if (!id_form) {
      return NextResponse.json(
        { success: false, message: "id_form wajib diisi" },
        { status: 400 }
      );
    }

    if (!tipe_pengecekan) {
      return NextResponse.json(
        { success: false, message: "tipe_pengecekan wajib diisi" },
        { status: 400 }
      );
    }

    let id_kelompok_user = null;
    let id_mk = null;

    // Jika id_user disediakan, ambil id_kelompok user tersebut
    if (id_user) {
      // 1. Dapatkan id_mk dari form_penilaian berdasarkan id_form
      const formQuery = `
        SELECT id_mk 
        FROM form_penilaian 
        WHERE id_form = $1
      `;

      const formResult = await handlerQuery(formQuery, [id_form]);

      if (formResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Form tidak ditemukan",
          },
          { status: 404 }
        );
      }

      id_mk = formResult.rows[0].id_mk;

      // 2. Dapatkan id_kelompok user berdasarkan id_user dan id_mk
      const kelompokQuery = `
        SELECT 
          k.id_kelompok,
          k.nama_kelompok,
          mk.peran,
          k.id_mk
        FROM kelompok k
        JOIN mahasiswa_kelompok mk ON k.id_kelompok = mk.id_kelompok
        WHERE mk.id_user = $1 AND k.id_mk = $2
      `;

      const kelompokResult = await handlerQuery(kelompokQuery, [
        id_user,
        id_mk,
      ]);

      if (kelompokResult.rows.length > 0) {
        id_kelompok_user = kelompokResult.rows[0].id_kelompok;
      }
    }

    let query;
    let queryParams;
    let tipe_penilaian;

    // Tentukan tipe penilaian berdasarkan tipe pengecekan
    if (tipe_pengecekan === "ketua_ke_anggota") {
      tipe_penilaian = "Ketua ke Anggota";
      if (id_kelompok_user) {
        query = `
          SELECT kp.id_komponen, fp.id_form, kp.tipe_penilaian, kp.id_kelompok
          FROM komponen_penilaian kp
          JOIN form_penilaian fp ON kp.id_form = fp.id_form
          WHERE fp.id_jenis = 3 AND fp.id_form = $1 AND kp.tipe_penilaian = $2 AND kp.id_kelompok = $3
        `;
        queryParams = [id_form, tipe_penilaian, id_kelompok_user];
      } else {
        query = `
          SELECT kp.id_komponen, fp.id_form, kp.tipe_penilaian, kp.id_kelompok
          FROM komponen_penilaian kp
          JOIN form_penilaian fp ON kp.id_form = fp.id_form
          WHERE fp.id_jenis = 3 AND fp.id_form = $1 AND kp.tipe_penilaian = $2
        `;
        queryParams = [id_form, tipe_penilaian];
      }
    } else if (tipe_pengecekan === "dosen_ke_ketua") {
      tipe_penilaian = "Dosen ke Ketua";
      if (id_kelompok_user) {
        query = `
          SELECT kp.id_komponen, fp.id_form, kp.tipe_penilaian, kp.id_kelompok
          FROM komponen_penilaian kp
          JOIN form_penilaian fp ON kp.id_form = fp.id_form
          WHERE fp.id_jenis = 3 AND fp.id_form = $1 AND kp.tipe_penilaian = $2 AND kp.id_kelompok = $3
        `;
        queryParams = [id_form, tipe_penilaian, id_kelompok_user];
      } else {
        query = `
          SELECT kp.id_komponen, fp.id_form, kp.tipe_penilaian, kp.id_kelompok
          FROM komponen_penilaian kp
          JOIN form_penilaian fp ON kp.id_form = fp.id_form
          WHERE fp.id_jenis = 3 AND fp.id_form = $1 AND kp.tipe_penilaian = $2
        `;
        queryParams = [id_form, tipe_penilaian];
      }
    } else if (tipe_pengecekan === "all") {
      // Untuk mengecek semua komponen form jenis 3
      if (id_kelompok_user) {
        query = `
          SELECT kp.id_komponen, fp.id_form, kp.tipe_penilaian, kp.id_kelompok
          FROM komponen_penilaian kp
          JOIN form_penilaian fp ON kp.id_form = fp.id_form
          WHERE fp.id_jenis = 3 AND fp.id_form = $1 AND kp.id_kelompok = $2
        `;
        queryParams = [id_form, id_kelompok_user];
      } else {
        query = `
          SELECT kp.id_komponen, fp.id_form, kp.tipe_penilaian, kp.id_kelompok
          FROM komponen_penilaian kp
          JOIN form_penilaian fp ON kp.id_form = fp.id_form
          WHERE fp.id_jenis = 3 AND fp.id_form = $1
        `;
        queryParams = [id_form];
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message:
            "tipe_pengecekan tidak valid. Gunakan: ketua_ke_anggota, dosen_ke_ketua, atau all",
        },
        { status: 400 }
      );
    }

    const result = await handlerQuery(query, queryParams);

    // Analisis hasil berdasarkan tipe pengecekan
    let response_data = {
      total_komponen: result.rows.length,
      komponen: result.rows,
      id_kelompok_user: id_kelompok_user,
      id_mk: id_mk,
    };

    if (tipe_pengecekan === "all") {
      // Pisahkan komponen berdasarkan tipe
      const komponen_dosen_ke_ketua = result.rows.filter(
        (row) => row.tipe_penilaian === "Dosen ke Ketua"
      );
      const komponen_ketua_ke_anggota = result.rows.filter(
        (row) => row.tipe_penilaian === "Ketua ke Anggota"
      );

      response_data = {
        ...response_data,
        ada_komponen_dosen_ke_ketua: komponen_dosen_ke_ketua.length > 0,
        ada_komponen_ketua_ke_anggota: komponen_ketua_ke_anggota.length > 0,
        jumlah_komponen_dosen_ke_ketua: komponen_dosen_ke_ketua.length,
        jumlah_komponen_ketua_ke_anggota: komponen_ketua_ke_anggota.length,
        komponen_dosen_ke_ketua: komponen_dosen_ke_ketua,
        komponen_ketua_ke_anggota: komponen_ketua_ke_anggota,
      };
    } else {
      response_data = {
        ...response_data,
        sudah_ada_komponen: result.rows.length > 0,
        tipe_penilaian: tipe_penilaian,
      };
    }

    return NextResponse.json({
      success: true,
      data: response_data,
    });
  } catch (error) {
    console.error("Error checking komponen:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error processing request",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

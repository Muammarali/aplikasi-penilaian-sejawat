import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

// POST method untuk ambil hasil penilaian berdasarkan id_dinilai dan id_form
export async function POST(req) {
  try {
    const { id_dinilai, id_form } = await req.json();

    // Validasi parameter
    if (!id_dinilai || !id_form) {
      return NextResponse.json(
        {
          success: false,
          message: "Both id_dinilai and id_form are required.",
        },
        { status: 400 }
      );
    }

    // Query hasil penilaian (TAMBAHKAN BOBOT)
    const query = `
      SELECT 
        hp.id_penilai,
        u_penilai.nama AS nama_penilai,
        u_dinilai.nama AS nama_dinilai,
        u_penilai.npm,
        fp.id_form,
        fp.nama,
        kp.id_komponen,
        kp.nama_komponen,
        kp.bobot,  -- 🆕 TAMBAHKAN INI
        hp.id_dinilai,
        hp.nilai,
        MIN(mk_dinilai.id_kelompok) AS id_kelompok,
        MIN(k.nama_kelompok) AS nama_kelompok
      FROM 
        hasil_penilaian hp
      JOIN users u_penilai ON hp.id_penilai = u_penilai.id_user
      JOIN users u_dinilai ON hp.id_dinilai = u_dinilai.id_user
      JOIN form_penilaian fp ON hp.id_form = fp.id_form
      JOIN komponen_penilaian kp ON hp.id_komponen = kp.id_komponen
      LEFT JOIN mahasiswa_kelompok mk_dinilai 
        ON hp.id_dinilai = mk_dinilai.id_user
      LEFT JOIN kelompok k 
        ON mk_dinilai.id_kelompok = k.id_kelompok 
        AND k.id_mk = fp.id_mk 
      WHERE hp.id_dinilai = $1 AND fp.id_form = $2
      GROUP BY 
        hp.id_penilai, u_penilai.nama, u_dinilai.nama, u_penilai.npm,
        fp.id_form, fp.nama, kp.id_komponen, kp.nama_komponen, kp.bobot,
        hp.id_dinilai, hp.nilai
      ORDER BY u_penilai.nama, kp.nama_komponen;
    `;

    // Eksekusi query
    const result = await handlerQuery(query, [id_dinilai, id_form]);

    // Jika tidak ada data
    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No assessment data found for the given IDs.",
        },
        { status: 404 }
      );
    }

    // Group data berdasarkan nama penilai dan kumpulkan semua komponen unik
    const groupedData = {};
    const allKomponen = new Map(); // Gunakan Map untuk menyimpan nama dan bobot
    let formName = "";
    let namaDinilai = "";

    result?.rows?.forEach((row) => {
      const penilaiKey = `${row.nama_penilai}_${row.id_penilai}`;

      // Set form name dan nama dinilai (sama untuk semua row)
      if (!formName) formName = row.nama;
      if (!namaDinilai) namaDinilai = row.nama_dinilai;

      // Kumpulkan semua nama komponen unik dengan bobotnya
      allKomponen.set(row.nama_komponen, parseFloat(row.bobot));

      if (!groupedData[penilaiKey]) {
        groupedData[penilaiKey] = {
          id_penilai: row.id_penilai,
          nama_penilai: row.nama_penilai,
          npm: row.npm,
          komponen: {},
          total_nilai_weighted: 0, // 🆕 Ganti dengan weighted total
          total_bobot: 0, // 🆕 Total bobot untuk validasi
        };
      }

      // Tambahkan nilai komponen dan hitung weighted value
      const nilai = parseFloat(row.nilai || 0);
      const bobot = parseFloat(row.bobot || 0);

      groupedData[penilaiKey].komponen[row.nama_komponen] = nilai;
      groupedData[penilaiKey].total_nilai_weighted += nilai * (bobot / 100); // 🆕 Weighted calculation
      groupedData[penilaiKey].total_bobot += bobot; // 🆕 Track total bobot
    });

    // Convert Map ke Array dan sort
    const komponenList = Array.from(allKomponen.keys()).sort();
    const komponenBobot = Object.fromEntries(allKomponen);

    // Convert grouped data ke format array dan hitung weighted average
    const penilaiArray = Object.values(groupedData).map((penilai) => {
      // 🆕 Gunakan weighted total sebagai hasil (sudah dalam skala 0-100)
      const hasil_weighted = penilai.total_nilai_weighted;

      // Buat objek dengan komponen dinamis
      const penilaiData = {
        id_penilai: penilai.id_penilai,
        nama: penilai.nama_penilai,
        npm: penilai.npm,
        hasil: parseFloat(hasil_weighted.toFixed(2)), // 🆕 Hasil weighted
        komponenDetail: penilai.komponen,
        total_bobot: penilai.total_bobot, // 🆕 Untuk debugging/validasi
      };

      // Tambahkan setiap komponen sebagai properti terpisah
      komponenList.forEach((namaKomponen, index) => {
        penilaiData[`komponen${index + 1}`] =
          penilai.komponen[namaKomponen] || 0;
      });

      return penilaiData;
    });

    // 🆕 Hitung hasil akhir (rata-rata weighted dari semua penilai)
    const totalHasil = penilaiArray.reduce(
      (sum, penilai) => sum + penilai.hasil,
      0
    );
    const hasilAkhir =
      penilaiArray.length > 0
        ? (totalHasil / penilaiArray.length).toFixed(2)
        : 0;

    // Ambil nama_kelompok dari row pertama
    const namaKelompok = result?.rows[0]?.nama_kelompok || null;

    // Format response sesuai dengan struktur yang dibutuhkan modal
    const responseData = {
      nama: namaDinilai,
      form_name: formName,
      penilai: penilaiArray,
      hasil_akhir: parseFloat(hasilAkhir), // 🆕 Ini sekarang hasil weighted yang benar
      total_penilai: penilaiArray.length,
      komponen_list: komponenList, // Daftar nama komponen untuk header tabel
      komponen_bobot: komponenBobot, // 🆕 Bobot setiap komponen untuk ditampilkan
      jumlah_komponen: komponenList.length,
      nama_kelompok: namaKelompok,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching assessment data:", error);
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

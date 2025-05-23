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

    // Query hasil penilaian
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
        hp.id_dinilai,
        hp.nilai
      FROM 
        hasil_penilaian hp
      JOIN users u_penilai ON hp.id_penilai = u_penilai.id_user
      JOIN users u_dinilai ON hp.id_dinilai = u_dinilai.id_user
      JOIN form_penilaian fp ON hp.id_form = fp.id_form
      JOIN komponen_penilaian kp ON hp.id_komponen = kp.id_komponen
      WHERE hp.id_dinilai = $1 AND fp.id_form = $2
      ORDER BY u_penilai.nama, kp.nama_komponen
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
    const allKomponen = new Set();
    let formName = "";
    let namaDinilai = "";

    result?.rows?.forEach((row) => {
      const penilaiKey = `${row.nama_penilai}_${row.id_penilai}`;

      // Set form name dan nama dinilai (sama untuk semua row)
      if (!formName) formName = row.nama;
      if (!namaDinilai) namaDinilai = row.nama_dinilai;

      // Kumpulkan semua nama komponen unik
      allKomponen.add(row.nama_komponen);

      if (!groupedData[penilaiKey]) {
        groupedData[penilaiKey] = {
          id_penilai: row.id_penilai,
          nama_penilai: row.nama_penilai,
          npm: row.npm,
          komponen: {},
          total_nilai: 0,
          jumlah_komponen: 0,
        };
      }

      // Tambahkan nilai komponen
      groupedData[penilaiKey].komponen[row.nama_komponen] = row.nilai;
      groupedData[penilaiKey].total_nilai += parseFloat(row.nilai || 0);
      groupedData[penilaiKey].jumlah_komponen += 1;
    });

    // Convert Set ke Array dan sort
    const komponenList = Array.from(allKomponen).sort();

    // Convert grouped data ke format array dan hitung rata-rata
    const penilaiArray = Object.values(groupedData).map((penilai) => {
      const rata_rata =
        penilai.jumlah_komponen > 0
          ? (penilai.total_nilai / penilai.jumlah_komponen).toFixed(2)
          : 0;

      // Buat objek dengan komponen dinamis
      const penilaiData = {
        id_penilai: penilai.id_penilai,
        nama: penilai.nama_penilai,
        npm: penilai.npm,
        hasil: parseFloat(rata_rata),
        komponenDetail: penilai.komponen,
      };

      // Tambahkan setiap komponen sebagai properti terpisah
      komponenList.forEach((namaKomponen, index) => {
        penilaiData[`komponen${index + 1}`] =
          penilai.komponen[namaKomponen] || 0;
      });

      return penilaiData;
    });

    // Hitung hasil akhir (rata-rata dari semua penilai)
    const totalHasil = penilaiArray.reduce(
      (sum, penilai) => sum + penilai.hasil,
      0
    );
    const hasilAkhir =
      penilaiArray.length > 0
        ? (totalHasil / penilaiArray.length).toFixed(2)
        : 0;

    // Format response sesuai dengan struktur yang dibutuhkan modal
    const responseData = {
      nama: namaDinilai,
      form_name: formName,
      penilai: penilaiArray,
      hasil_akhir: parseFloat(hasilAkhir),
      total_penilai: penilaiArray.length,
      komponen_list: komponenList, // Daftar nama komponen untuk header tabel
      jumlah_komponen: komponenList.length, // Jumlah komponen untuk membuat kolom dinamis
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

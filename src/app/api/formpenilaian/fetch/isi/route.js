import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function POST(req) {
  const { id_form } = await req.json();

  try {
    // Get form details first to know what type it is
    const getFormDetailsQuery = `
      SELECT 
        id_form,
        id_jenis
      FROM 
        form_penilaian
      WHERE 
        id_form = $1
    `;

    const formDetails = await handlerQuery(getFormDetailsQuery, [id_form]);

    if (!formDetails || formDetails.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Form not found",
        },
        { status: 404 }
      );
    }

    const id_jenis = formDetails?.rows[0]?.id_jenis;

    // Get all components for the form
    const getFormKomponenQuery = `
      SELECT 
        kp.id_komponen, 
        kp.nama_komponen, 
        kp.bobot, 
        kp.deskripsi,
        kp.id_form,
        kp.tipe_penilaian,
        kp.id_kelompok
      FROM 
        komponen_penilaian kp
      WHERE 
        kp.id_form = $1
    `;

    const responseData = await handlerQuery(getFormKomponenQuery, [id_form]);

    const komponenData = responseData?.rows;

    // Organize data based on id_jenis
    let result = {
      form_details: formDetails?.rows[0],
      komponen: {},
    };

    // Separate components by tipe_penilaian
    if (id_jenis === 1) {
      // Both Anggota-Anggota and Anggota-PM/Ketua
      result.komponen.anggota_anggota = komponenData.filter(
        (k) => k.tipe_penilaian === "Anggota ke Anggota"
      );
      result.komponen.anggota_pm = komponenData.filter(
        (k) => k.tipe_penilaian === "Anggota ke Ketua"
      );
    } else if (id_jenis === 2) {
      // Only Anggota-Anggota
      result.komponen.anggota_anggota = komponenData.filter(
        (k) => k.tipe_penilaian === "Anggota ke Anggota"
      );
    } else if (id_jenis === 3) {
      // Only Ketua-Anggota
      result.komponen.ketua_anggota = komponenData.filter(
        (k) => k.tipe_penilaian === "Ketua ke Anggota"
      );
      result.komponen.dosen_ketua = komponenData.filter(
        (k) => k.tipe_penilaian === "Dosen ke Ketua"
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in form component query:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error processing request",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

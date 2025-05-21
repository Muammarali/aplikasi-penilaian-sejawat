import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function POST(req) {
  try {
    const { hasilPenilaian } = await req.json();

    // Validate the request data
    if (
      !hasilPenilaian ||
      !Array.isArray(hasilPenilaian) ||
      hasilPenilaian.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid data format. Expected array of assessment results.",
        },
        { status: 400 }
      );
    }

    // Verify that all required fields are present in each entry
    for (const nilai of hasilPenilaian) {
      if (
        !nilai.id_penilai ||
        !nilai.id_dinilai ||
        nilai.nilai === undefined ||
        nilai.nilai === null ||
        !nilai.id_form ||
        !nilai.id_komponen
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Missing required fields in assessment data",
          },
          { status: 400 }
        );
      }

      // Validate that nilai is a number between 0 and 100
      if (
        typeof nilai.nilai !== "number" ||
        nilai.nilai < 0 ||
        nilai.nilai > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Assessment value must be a number between 0 and 100",
          },
          { status: 400 }
        );
      }
    }

    try {
      // Batch insert values using a single prepared statement
      const insertQuery = `
        INSERT INTO hasil_penilaian
        (id_penilai, id_dinilai, nilai, id_form, id_komponen)
        VALUES
        ($1, $2, $3, $4, $5);
      `;

      // Execute the query for each assessment result
      for (const nilai of hasilPenilaian) {
        await handlerQuery(insertQuery, [
          nilai.id_penilai,
          nilai.id_dinilai,
          nilai.nilai,
          nilai.id_form,
          nilai.id_komponen,
        ]);
      }

      //   // Check if we need to update the form status
      //   const formId = hasilPenilaian[0].id_form;
      //   const updateStatusQuery = `
      //     UPDATE form_penilaian
      //     SET status = 'Selesai'
      //     WHERE id_form = $1
      //   `;

      //   await handlerQuery(updateStatusQuery, [formId]);

      return NextResponse.json({
        success: true,
        message: "Assessment data submitted successfully",
        count: hasilPenilaian.length,
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error submitting assessment data:", error);
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

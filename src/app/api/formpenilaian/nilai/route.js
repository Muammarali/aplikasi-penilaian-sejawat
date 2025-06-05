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

    let insertedCount = 0;
    let updatedCount = 0;

    try {
      // Process each assessment result
      for (const nilai of hasilPenilaian) {
        // Check if record already exists
        const checkQuery = `
          SELECT COUNT(*) as count
          FROM hasil_penilaian 
          WHERE id_penilai = $1 
            AND id_dinilai = $2 
            AND id_form = $3 
            AND id_komponen = $4
        `;

        const existingRecord = await handlerQuery(checkQuery, [
          nilai.id_penilai,
          nilai.id_dinilai,
          nilai.id_form,
          nilai.id_komponen,
        ]);

        const recordExists = parseInt(existingRecord.rows[0].count) > 0;

        if (recordExists) {
          // Update existing record
          const updateQuery = `
            UPDATE hasil_penilaian 
            SET nilai = $1
            WHERE id_penilai = $2 
              AND id_dinilai = $3 
              AND id_form = $4 
              AND id_komponen = $5
          `;

          const updateResult = await handlerQuery(updateQuery, [
            nilai.nilai,
            nilai.id_penilai,
            nilai.id_dinilai,
            nilai.id_form,
            nilai.id_komponen,
          ]);

          if (updateResult.rowCount > 0) {
            updatedCount++;
            console.log(
              `Updated: penilai=${nilai.id_penilai}, dinilai=${nilai.id_dinilai}, komponen=${nilai.id_komponen}, nilai=${nilai.nilai}`
            );
          }
        } else {
          // Insert new record
          const insertQuery = `
            INSERT INTO hasil_penilaian
            (id_penilai, id_dinilai, nilai, id_form, id_komponen)
            VALUES ($1, $2, $3, $4, $5)
          `;

          const insertResult = await handlerQuery(insertQuery, [
            nilai.id_penilai,
            nilai.id_dinilai,
            nilai.nilai,
            nilai.id_form,
            nilai.id_komponen,
          ]);

          if (insertResult.rowCount > 0) {
            insertedCount++;
            console.log(
              `Inserted: penilai=${nilai.id_penilai}, dinilai=${nilai.id_dinilai}, komponen=${nilai.id_komponen}, nilai=${nilai.nilai}`
            );
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Assessment data processed successfully. ${insertedCount} new entries added, ${updatedCount} entries updated.`,
        stats: {
          total: hasilPenilaian.length,
          inserted: insertedCount,
          updated: updatedCount,
        },
      });
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      throw dbError;
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

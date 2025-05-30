import { NextResponse } from "next/server";
import handlerQuery from "../../../../../utils/db";

export async function POST(req) {
  try {
    const { id_mk } = await req.json();

    if (!id_mk) {
      return NextResponse.json(
        { success: false, message: "id_mk is required" },
        { status: 400 }
      );
    }

    // Query untuk ambil daftar mahasiswa
    const studentsQuery = `
      SELECT 
        dk.id_daftar_kelas,
        dk.id_mk,
        u.id_user,
        u.nama,
        u.npm
      FROM 
        daftar_kelas dk
      JOIN 
        users u ON dk.id_user = u.id_user
      WHERE 
        dk.id_mk = $1
      ORDER BY 
        u.nama
    `;

    // Query yang dimodifikasi untuk mengambil informasi penilai
    const detailedGradesWithAssessorQuery = `
      SELECT 
        dk.id_user as id_dinilai,
        u_dinilai.nama as nama_dinilai,
        u_dinilai.npm as npm_dinilai,
        hp.id_form,
        hp.id_komponen,
        kp.nama_komponen,
        kp.bobot,
        hp.id_penilai,
        CASE 
          WHEN k.id_kelompok IS NOT NULL THEN k.nama_kelompok
          WHEN u_penilai.id_user IS NOT NULL THEN u_penilai.nama
          ELSE 'Unknown'
        END as nama_penilai,
        CASE 
          WHEN k.id_kelompok IS NOT NULL THEN 'Kelompok'
          WHEN u_penilai.id_user IS NOT NULL THEN u_penilai.npm
          ELSE 'Unknown'
        END as npm_penilai,
        hp.nilai,
        AVG(hp.nilai) OVER (
          PARTITION BY dk.id_user, hp.id_form, hp.id_komponen
        ) as nilai_rata_komponen,
        ROUND(AVG(hp.nilai) OVER (
          PARTITION BY dk.id_user, hp.id_form, hp.id_komponen
        ) * (kp.bobot::numeric / 100.0), 2) as nilai_weighted_komponen
      FROM 
        hasil_penilaian hp
      JOIN 
        daftar_kelas dk ON hp.id_dinilai = dk.id_user
      JOIN 
        users u_dinilai ON dk.id_user = u_dinilai.id_user
      JOIN 
        komponen_penilaian kp ON hp.id_komponen = kp.id_komponen
      LEFT JOIN 
        kelompok k ON hp.id_penilai = k.id_kelompok
      LEFT JOIN 
        users u_penilai ON hp.id_penilai = u_penilai.id_user
      WHERE 
        dk.id_mk = $1
      ORDER BY 
        u_dinilai.nama, hp.id_form, hp.id_komponen, hp.id_penilai
    `;

    // Query untuk nilai total (tetap sama)
    const totalGradesQuery = `
      WITH weighted_scores_per_assessor AS (
          SELECT 
              hp.id_dinilai,
              hp.id_form,
              hp.id_penilai,
              SUM(hp.nilai * (k.bobot::numeric / 100.0)) AS nilai_weighted_per_penilai
          FROM 
              hasil_penilaian hp
          JOIN 
              komponen_penilaian k ON hp.id_komponen = k.id_komponen
          JOIN 
              daftar_kelas dk ON hp.id_dinilai = dk.id_user
          WHERE 
              dk.id_mk = $1
          GROUP BY 
              hp.id_dinilai, hp.id_form, hp.id_penilai
      )
      SELECT 
          id_dinilai,
          id_form,
          ROUND(AVG(nilai_weighted_per_penilai), 2) AS nilai_akhir
      FROM 
          weighted_scores_per_assessor
      GROUP BY 
          id_dinilai, id_form
      ORDER BY 
          id_dinilai, id_form
    `;

    const [studentsResult, detailedGradesResult, totalGradesResult] =
      await Promise.all([
        handlerQuery(studentsQuery, [id_mk]),
        handlerQuery(detailedGradesWithAssessorQuery, [id_mk]),
        handlerQuery(totalGradesQuery, [id_mk]),
      ]);

    const students = studentsResult?.rows || [];
    const detailedGrades = detailedGradesResult?.rows || [];
    const totalGrades = totalGradesResult?.rows || [];

    if (students.length === 0) {
      return NextResponse.json(
        { success: false, message: "No students found for this course" },
        { status: 404 }
      );
    }

    // Strukturkan data dengan informasi penilai
    const detailedGradesMap = {};
    detailedGrades.forEach((grade) => {
      const userKey = String(grade.id_dinilai);
      const formKey = String(grade.id_form);
      const komponenKey = String(grade.id_komponen);
      const penilaiKey = String(grade.id_penilai);

      if (!detailedGradesMap[userKey]) {
        detailedGradesMap[userKey] = {};
      }
      if (!detailedGradesMap[userKey][formKey]) {
        detailedGradesMap[userKey][formKey] = {
          komponen: {},
          assessors: {}, // Informasi per penilai
          total: 0,
        };
      }
      if (!detailedGradesMap[userKey][formKey].komponen[komponenKey]) {
        detailedGradesMap[userKey][formKey].komponen[komponenKey] = {
          nama_komponen: grade.nama_komponen,
          bobot: parseFloat(grade.bobot),
          nilai_rata: parseFloat(grade.nilai_rata_komponen),
          nilai_weighted: parseFloat(grade.nilai_weighted_komponen),
          assessors: {},
        };
      }

      // Simpan nilai individual dari setiap penilai
      detailedGradesMap[userKey][formKey].komponen[komponenKey].assessors[
        penilaiKey
      ] = {
        nama_penilai: grade.nama_penilai,
        npm_penilai: grade.npm_penilai,
        nilai: parseFloat(grade.nilai),
      };

      // Simpan informasi penilai di level form
      if (!detailedGradesMap[userKey][formKey].assessors[penilaiKey]) {
        detailedGradesMap[userKey][formKey].assessors[penilaiKey] = {
          nama_penilai: grade.nama_penilai,
          npm_penilai: grade.npm_penilai,
        };
      }
    });

    // Tambahkan total grades
    const totalGradesMap = {};
    totalGrades.forEach((grade) => {
      const userKey = String(grade.id_dinilai);
      const formKey = String(grade.id_form);

      if (!totalGradesMap[userKey]) {
        totalGradesMap[userKey] = {};
      }
      totalGradesMap[userKey][formKey] = parseFloat(grade.nilai_akhir);
    });

    // Gabungkan data
    const result = students.map((student) => {
      const userKey = String(student.id_user);
      const studentDetailedGrades = detailedGradesMap[userKey] || {};
      const studentTotalGrades = totalGradesMap[userKey] || {};

      const combinedGrades = {};
      Object.keys(studentDetailedGrades).forEach((formId) => {
        combinedGrades[formId] = {
          ...studentDetailedGrades[formId],
          total: studentTotalGrades[formId] || 0,
        };
      });

      Object.keys(studentTotalGrades).forEach((formId) => {
        if (!combinedGrades[formId]) {
          combinedGrades[formId] = {
            komponen: {},
            assessors: {},
            total: studentTotalGrades[formId],
          };
        }
      });

      return {
        id_mk: student.id_mk,
        id_user: student.id_user,
        nama: student.nama,
        npm: student.npm,
        nilai_per_form: combinedGrades,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching detailed students data:", error);
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

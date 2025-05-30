// File ini adalah: /api/rekapnilai/fetch/mahasiswa/detailed/route.js

import { NextResponse } from "next/server";
import handlerQuery from "../../../../../utils/db";

// POST method untuk ambil daftar mahasiswa beserta nilai detail per komponen
export async function POST(req) {
  try {
    const { id_mk } = await req.json();

    // Validasi input
    if (!id_mk) {
      return NextResponse.json(
        {
          success: false,
          message: "id_mk is required",
        },
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

    // Query untuk ambil nilai per komponen untuk setiap form dengan info kelompok
    const detailedGradesQuery = `
      SELECT 
        dk.id_user as id_dinilai,
        hp.id_form,
        hp.id_komponen,
        kp.nama_komponen,
        kp.bobot,
        k.nama_kelompok,
        k.id_kelompok,
        AVG(hp.nilai) as nilai_rata_komponen,
        ROUND(AVG(hp.nilai) * (kp.bobot::numeric / 100.0), 2) as nilai_weighted_komponen
      FROM 
        hasil_penilaian hp
      JOIN 
        daftar_kelas dk ON hp.id_dinilai = dk.id_user
      JOIN 
        komponen_penilaian kp ON hp.id_komponen = kp.id_komponen
      LEFT JOIN 
        kelompok k ON hp.id_penilai = k.id_kelompok
      WHERE 
        dk.id_mk = $1
      GROUP BY 
        dk.id_user, hp.id_form, hp.id_komponen, kp.nama_komponen, kp.bobot, k.nama_kelompok, k.id_kelompok
      ORDER BY 
        dk.id_user, hp.id_form, hp.id_komponen
    `;

    // Query untuk ambil nilai akhir per form (total) - sama seperti API yang sudah ada
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

    // Eksekusi semua query
    const [studentsResult, detailedGradesResult, totalGradesResult] =
      await Promise.all([
        handlerQuery(studentsQuery, [id_mk]),
        handlerQuery(detailedGradesQuery, [id_mk]),
        handlerQuery(totalGradesQuery, [id_mk]),
      ]);

    // Ekstrak rows dari hasil query
    const students = studentsResult?.rows || [];
    const detailedGrades = detailedGradesResult?.rows || [];
    const totalGrades = totalGradesResult?.rows || [];

    // Jika data mahasiswa tidak ditemukan
    if (students.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No students found for this course",
        },
        { status: 404 }
      );
    }

    // Buat map untuk nilai detail berdasarkan id_user, id_form, dan id_komponen
    const detailedGradesMap = {};
    detailedGrades.forEach((grade) => {
      const userKey = String(grade.id_dinilai);
      const formKey = String(grade.id_form);
      const komponenKey = String(grade.id_komponen);

      if (!detailedGradesMap[userKey]) {
        detailedGradesMap[userKey] = {};
      }
      if (!detailedGradesMap[userKey][formKey]) {
        detailedGradesMap[userKey][formKey] = {
          komponen: {},
          total: 0,
          kelompok_info: {},
        };
      }

      detailedGradesMap[userKey][formKey].komponen[komponenKey] = {
        nama_komponen: grade.nama_komponen,
        bobot: parseFloat(grade.bobot),
        nilai_rata: parseFloat(grade.nilai_rata_komponen),
        nilai_weighted: parseFloat(grade.nilai_weighted_komponen),
        nama_kelompok: grade.nama_kelompok,
        id_kelompok: grade.id_kelompok,
      };

      // Simpan info kelompok untuk komponen ini
      if (grade.nama_kelompok) {
        detailedGradesMap[userKey][formKey].kelompok_info[komponenKey] = {
          nama_kelompok: grade.nama_kelompok,
          id_kelompok: grade.id_kelompok,
        };
      }
    });

    // Buat map untuk nilai total berdasarkan id_user dan id_form
    const totalGradesMap = {};
    totalGrades.forEach((grade) => {
      const userKey = String(grade.id_dinilai);
      const formKey = String(grade.id_form);

      if (!totalGradesMap[userKey]) {
        totalGradesMap[userKey] = {};
      }
      totalGradesMap[userKey][formKey] = parseFloat(grade.nilai_akhir);
    });

    // Gabungkan semua data
    const result = students.map((student) => {
      const userKey = String(student.id_user);
      const studentDetailedGrades = detailedGradesMap[userKey] || {};
      const studentTotalGrades = totalGradesMap[userKey] || {};

      // Gabungkan detail komponen dengan total untuk setiap form
      const combinedGrades = {};

      // Tambahkan total scores ke detailed grades
      Object.keys(studentDetailedGrades).forEach((formId) => {
        combinedGrades[formId] = {
          ...studentDetailedGrades[formId],
          total: studentTotalGrades[formId] || 0,
        };
      });

      // Tambahkan form yang hanya memiliki total tanpa detail komponen
      Object.keys(studentTotalGrades).forEach((formId) => {
        if (!combinedGrades[formId]) {
          combinedGrades[formId] = {
            komponen: {},
            total: studentTotalGrades[formId],
            kelompok_info: {},
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

    // Berhasil ambil data
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

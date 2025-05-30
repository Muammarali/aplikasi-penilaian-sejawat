import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

// POST method untuk ambil daftar mahasiswa beserta nilai akhir berdasarkan id_mk
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

    // Query untuk ambil daftar mahasiswa dan semua form yang tersedia
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

    // Query untuk ambil nilai akhir per form untuk mata kuliah tertentu
    const gradesQuery = `
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
        ROUND(
            AVG(nilai_weighted_per_penilai), 2
        ) AS nilai_akhir
    FROM 
        weighted_scores_per_assessor
    GROUP BY 
        id_dinilai, id_form
    ORDER BY 
        id_dinilai, id_form
`;

    // Eksekusi kedua query
    const [studentsResult, gradesResult] = await Promise.all([
      handlerQuery(studentsQuery, [id_mk]),
      handlerQuery(gradesQuery, [id_mk]),
    ]);

    // Ekstrak rows dari hasil query
    const students = studentsResult?.rows || [];
    const grades = gradesResult?.rows || [];

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

    // Buat map untuk nilai berdasarkan id_daftar_kelas dan id_form
    const gradesMap = {};
    grades.forEach((grade) => {
      const key = String(grade.id_dinilai);
      if (!gradesMap[key]) {
        gradesMap[key] = {};
      }
      gradesMap[key][grade.id_form] = parseFloat(grade.nilai_akhir);
    });

    // Gabungkan data mahasiswa dengan nilai per form
    const result = students.map((student) => {
      const studentGrades = gradesMap[String(student.id_user)] || {};

      return {
        id_mk: student.id_mk,
        id_user: student.id_user,
        nama: student.nama,
        npm: student.npm,
        nilai_per_form: studentGrades,
      };
    });

    // Berhasil ambil data
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching students for course:", error);
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

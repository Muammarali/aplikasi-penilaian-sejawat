import { NextResponse } from "next/server";
import handlerQuery from "../../../../../utils/db";

export async function POST(req) {
  const { id_mk, npmList } = await req.json();

  try {
    if (!id_mk || !npmList || npmList.length === 0) {
      return NextResponse.json({
        success: false,
        message: "ID mata kuliah dan daftar NPM diperlukan.",
      });
    }

    // Clean and validate NPM list as string
    const cleanNpmList = npmList
      .map((npm) => `${npm}`.trim()) // convert ke string
      .filter((npm) => npm.length > 0);

    if (cleanNpmList.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Tidak ada NPM yang valid ditemukan.",
      });
    }

    // Prepare placeholders untuk query
    const placeholders = cleanNpmList
      .map((_, index) => `$${index + 1}`)
      .join(", ");
    const findMahasiswaQuery = `
      SELECT id_user, npm, nama FROM users 
      WHERE npm IN (${placeholders}) AND role = 'Mahasiswa'
    `;

    const foundMahasiswa =
      (await handlerQuery(findMahasiswaQuery, cleanNpmList)) || [];

    if (foundMahasiswa.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Tidak ada mahasiswa yang ditemukan dengan NPM tersebut.",
        details: {
          imported: 0,
          alreadyEnrolled: 0,
          notFound: cleanNpmList.length,
          notFoundNpm: cleanNpmList,
        },
      });
    }

    const foundIds = foundMahasiswa?.rows?.map((m) => m.id_user);

    const enrolledPlaceholders = foundIds
      .map((_, index) => `$${index + 2}`)
      .join(", ");
    const checkEnrolledQuery = `
      SELECT id_user FROM daftar_kelas 
      WHERE id_mk = $1 AND id_user IN (${enrolledPlaceholders})
    `;

    const enrolledResult =
      (await handlerQuery(checkEnrolledQuery, [id_mk, ...foundIds])) || [];
    const enrolledIds = enrolledResult?.rows?.map((row) => row.id_user);

    // Mahasiswa yang belum terdaftar
    const toEnrollMahasiswa = foundMahasiswa?.rows?.filter(
      (m) => !enrolledIds.includes(m.id_user)
    );

    // Mahasiswa yang sudah terdaftar
    const alreadyEnrolledMahasiswa = foundMahasiswa?.rows?.filter((m) =>
      enrolledIds.includes(m.id_user)
    );

    // NPM yang tidak ditemukan
    const notFoundNpm = cleanNpmList.filter(
      (npm) => !foundMahasiswa?.rows?.some((m) => m.npm === npm)
    );

    if (toEnrollMahasiswa.length === 0) {
      let message = "";
      if (alreadyEnrolledMahasiswa.length > 0) {
        message += `${alreadyEnrolledMahasiswa.length} mahasiswa sudah terdaftar di mata kuliah ini.`;
      }
      if (notFoundNpm.length > 0) {
        if (message) message += " ";
        message += `${
          notFoundNpm.length
        } NPM tidak ditemukan: ${notFoundNpm.join(", ")}.`;
      }

      return NextResponse.json({
        success: false,
        message: message || "Tidak ada mahasiswa baru untuk ditambahkan.",
        details: {
          imported: 0,
          alreadyEnrolled: alreadyEnrolledMahasiswa.length,
          notFound: notFoundNpm.length,
          notFoundNpm,
          alreadyEnrolledStudents: alreadyEnrolledMahasiswa.map(
            ({ npm, nama }) => ({ npm, nama })
          ),
        },
      });
    }

    // Insert mahasiswa ke daftar_kelas
    const insertValues = toEnrollMahasiswa
      .map((_, index) => `($1, $${index + 2})`)
      .join(", ");
    const insertParams = [id_mk, ...toEnrollMahasiswa.map((m) => m.id_user)];

    const insertQuery = `
      INSERT INTO daftar_kelas (id_mk, id_user)
      VALUES ${insertValues}
    `;

    await handlerQuery(insertQuery, insertParams);

    const successCount = toEnrollMahasiswa.length;
    const alreadyEnrolledCount = alreadyEnrolledMahasiswa.length;

    let message = `${successCount} mahasiswa berhasil ditambahkan ke mata kuliah.`;
    if (alreadyEnrolledCount > 0) {
      message += ` ${alreadyEnrolledCount} mahasiswa sudah terdaftar sebelumnya.`;
    }
    if (notFoundNpm.length > 0) {
      message += ` ${notFoundNpm.length} NPM tidak ditemukan.`;
    }

    return NextResponse.json({
      success: true,
      message,
      details: {
        imported: successCount,
        alreadyEnrolled: alreadyEnrolledCount,
        notFound: notFoundNpm.length,
        importedStudents: toEnrollMahasiswa.map(({ npm, nama }) => ({
          npm,
          nama,
        })),
        alreadyEnrolledStudents: alreadyEnrolledMahasiswa.map(
          ({ npm, nama }) => ({ npm, nama })
        ),
        notFoundNpm,
      },
    });
  } catch (error) {
    console.error("Error importing mahasiswa:", error);

    if (error.message && error.message.includes("duplicate key")) {
      return NextResponse.json({
        success: false,
        message: "Beberapa mahasiswa sudah terdaftar di mata kuliah ini.",
      });
    }

    return NextResponse.json({
      success: false,
      message: "Gagal mengimport mahasiswa ke mata kuliah. Silakan coba lagi.",
    });
  }
}

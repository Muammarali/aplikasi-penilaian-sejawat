// API Route: /api/admin/dosen-matakuliah/kelolamk/status/route.js
import { NextResponse } from "next/server";
import handlerQuery from "../../../../../utils/db";

// PATCH - Toggle status mata kuliah
export async function PATCH(req) {
  const body = await req.json();

  try {
    const { id } = body;

    // Validasi ID mata kuliah
    if (!id) {
      return NextResponse.json({
        success: false,
        message: "ID mata kuliah diperlukan",
      });
    }

    // Ambil status mata kuliah saat ini
    const getCurrentStatusQuery = `
      SELECT 
        mk.id_mk,
        mk.kode_mk,
        mk.nama,
        mk.kelas,
        mk.status,
        CONCAT(ta.nama, ' ', ta.tipe) as tahun_ajaran
      FROM mata_kuliah mk
      INNER JOIN tahun_ajaran ta ON mk.id_tahun_ajaran = ta.id_tahun_ajaran
      WHERE mk.id_mk = $1;
    `;

    const currentResult = await handlerQuery(getCurrentStatusQuery, [id]);

    if (!currentResult || currentResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Mata kuliah tidak ditemukan",
      });
    }

    const currentMatkul = currentResult.rows[0];
    const newStatus = !currentMatkul.status; // Toggle status

    // Update status mata kuliah
    const updateStatusQuery = `
      UPDATE mata_kuliah 
      SET status = $1
      WHERE id_mk = $2
      RETURNING id_mk, kode_mk, nama, kelas, sks, status;
    `;

    const updateResult = await handlerQuery(updateStatusQuery, [newStatus, id]);

    if (!updateResult || updateResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Gagal mengubah status mata kuliah",
      });
    }

    // Ambil data lengkap setelah update
    const getFullDataQuery = `
      SELECT 
        mk.id_mk,
        mk.kode_mk,
        mk.nama,
        mk.kelas,
        mk.sks,
        mk.status,
        CONCAT(ta.nama, ' ', ta.tipe) as tahun_ajaran,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', u.id_user,
              'npm', u.npm,
              'nama', u.nama,
              'email', u.email
            )
          ) FILTER (WHERE u.id_user IS NOT NULL),
          '[]'
        ) AS dosen_pengampu
      FROM mata_kuliah mk
      INNER JOIN tahun_ajaran ta ON mk.id_tahun_ajaran = ta.id_tahun_ajaran
      LEFT JOIN dosen_mata_kuliah dmk ON mk.id_mk = dmk.id_mk
      LEFT JOIN users u ON dmk.id_user = u.id_user
      WHERE mk.id_mk = $1
      GROUP BY mk.id_mk, mk.kode_mk, mk.nama, mk.kelas, mk.sks, mk.status, ta.nama, ta.tipe;
    `;

    const fullDataResult = await handlerQuery(getFullDataQuery, [id]);

    const statusText = newStatus ? "aktif" : "tidak aktif";
    const previousStatusText = currentMatkul.status ? "aktif" : "tidak aktif";

    return NextResponse.json({
      success: true,
      message: `Status mata kuliah ${currentMatkul.nama} (${currentMatkul.kode_mk}) berhasil diubah dari ${previousStatusText} menjadi ${statusText}`,
      data: fullDataResult.rows[0],
      changes: {
        previous_status: currentMatkul.status,
        new_status: newStatus,
        status_text: statusText,
      },
    });
  } catch (error) {
    console.error("Error saat mengubah status mata kuliah:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
}

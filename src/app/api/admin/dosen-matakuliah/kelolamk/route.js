import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function PUT(req) {
  const body = await req.json();

  try {
    const {
      id,
      kodeMatkul,
      namaMatkul,
      kelas,
      sks,
      tahunAjaran,
      dosenPengampu,
    } = body;

    // Validasi data wajib
    if (!id || !kodeMatkul || !namaMatkul || !kelas || !sks || !tahunAjaran) {
      return NextResponse.json({
        success: false,
        message: "Data tidak lengkap. Semua field wajib diisi",
      });
    }

    // Validasi dosen pengampu
    if (
      !dosenPengampu ||
      !Array.isArray(dosenPengampu) ||
      dosenPengampu.length === 0
    ) {
      return NextResponse.json({
        success: false,
        message: "Minimal harus ada satu dosen pengampu",
      });
    }

    // Parse tahun ajaran (format: "2024/2025 Genap")
    const tahunParts = tahunAjaran.split(" ");
    const namaTahun = tahunParts[0]; // "2024/2025"
    const tipeTahun = tahunParts[1]; // "Genap"

    if (!namaTahun || !tipeTahun) {
      return NextResponse.json({
        success: false,
        message:
          "Format tahun ajaran tidak valid. Gunakan format: YYYY/YYYY Ganjil/Genap",
      });
    }

    // Cek apakah mata kuliah exist
    const checkExistQuery = `
      SELECT id_mk FROM mata_kuliah WHERE id_mk = $1;
    `;

    const existResult = await handlerQuery(checkExistQuery, [id]);

    if (!existResult || existResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Mata kuliah tidak ditemukan",
      });
    }

    // PERBAIKAN: Cek duplikasi berdasarkan kombinasi kode_mk + kelas + tahun ajaran
    // Kode yang sama boleh untuk kelas berbeda, tapi tidak boleh duplikat di kelas & tahun yang sama
    const checkDuplicateQuery = `
      SELECT mk.id_mk, mk.kode_mk, mk.kelas, ta.nama as tahun_nama, ta.tipe as tahun_tipe
      FROM mata_kuliah mk
      LEFT JOIN tahun_mata_kuliah tmk ON mk.id_mk = tmk.id_mk
      LEFT JOIN tahun_ajaran ta ON tmk.id_tahun_ajaran = ta.id_tahun_ajaran
      WHERE mk.kode_mk = $1 
        AND mk.kelas = $2 
        AND ta.nama = $3 
        AND ta.tipe = $4 
        AND mk.id_mk != $5;
    `;

    const duplicateResult = await handlerQuery(checkDuplicateQuery, [
      kodeMatkul,
      kelas,
      namaTahun,
      tipeTahun,
      id,
    ]);

    if (duplicateResult && duplicateResult.rows.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Mata kuliah ${kodeMatkul} kelas ${kelas} untuk tahun ajaran ${tahunAjaran} sudah ada`,
      });
    }

    // Cek atau insert tahun ajaran
    let tahunAjaranId;
    const checkTahunQuery = `
      SELECT id_tahun_ajaran FROM tahun_ajaran WHERE nama = $1 AND tipe = $2;
    `;

    const tahunResult = await handlerQuery(checkTahunQuery, [
      namaTahun,
      tipeTahun,
    ]);

    if (tahunResult && tahunResult.rows.length > 0) {
      // Tahun ajaran sudah ada
      tahunAjaranId = tahunResult.rows[0].id_tahun_ajaran;
    } else {
      // Insert tahun ajaran baru
      const insertTahunQuery = `
        INSERT INTO tahun_ajaran (nama, tipe)
        VALUES ($1, $2)
        RETURNING id_tahun_ajaran;
      `;

      const newTahunResult = await handlerQuery(insertTahunQuery, [
        namaTahun,
        tipeTahun,
      ]);
      tahunAjaranId = newTahunResult.rows[0].id_tahun_ajaran;
    }

    // Update mata kuliah
    const updateMatkulQuery = `
      UPDATE mata_kuliah 
      SET kode_mk = $1, nama = $2, kelas = $3, sks = $4
      WHERE id_mk = $5
      RETURNING id_mk, kode_mk, nama, kelas, sks;
    `;

    const updateResult = await handlerQuery(updateMatkulQuery, [
      kodeMatkul,
      namaMatkul,
      kelas,
      parseInt(sks),
      id,
    ]);

    // Update relasi tahun ajaran (hapus yang lama, insert yang baru)
    const deleteTahunMatkulQuery = `
      DELETE FROM tahun_mata_kuliah WHERE id_mk = $1;
    `;

    await handlerQuery(deleteTahunMatkulQuery, [id]);

    const insertTahunMatkulQuery = `
      INSERT INTO tahun_mata_kuliah (id_mk, id_tahun_ajaran)
      VALUES ($1, $2)
      RETURNING id;
    `;

    await handlerQuery(insertTahunMatkulQuery, [id, tahunAjaranId]);

    // Hapus semua dosen pengampu lama
    const deleteOldDosenQuery = `
      DELETE FROM dosen_mata_kuliah WHERE id_mk = $1;
    `;

    await handlerQuery(deleteOldDosenQuery, [id]);

    // Insert dosen pengampu baru
    const dosenInsertPromises = dosenPengampu.map(async (dosen) => {
      const insertDosenQuery = `
        INSERT INTO dosen_mata_kuliah (id_mk, id_user)
        VALUES ($1, $2)
        RETURNING id_dosen_mk;
      `;
      return handlerQuery(insertDosenQuery, [id, dosen.id]);
    });

    await Promise.all(dosenInsertPromises);

    // Ambil data lengkap mata kuliah dengan dosen pengampu dan tahun ajaran yang sudah diupdate
    const getFullDataQuery = `
      SELECT 
        mk.id_mk,
        mk.kode_mk,
        mk.nama,
        mk.kelas,
        mk.sks,
        CONCAT(ta.nama, ' ', ta.tipe) as tahun_ajaran,
        json_agg(
          json_build_object(
            'id', u.id_user,
            'nama', u.nama,
            'npm', u.npm,
            'email', u.email
          )
        ) as dosen_pengampu
      FROM mata_kuliah mk
      LEFT JOIN tahun_mata_kuliah tmk ON mk.id_mk = tmk.id_mk
      LEFT JOIN tahun_ajaran ta ON tmk.id_tahun_ajaran = ta.id_tahun_ajaran
      LEFT JOIN dosen_mata_kuliah dmk ON mk.id_mk = dmk.id_mk
      LEFT JOIN users u ON dmk.id_user = u.id_user
      WHERE mk.id_mk = $1
      GROUP BY mk.id_mk, mk.kode_mk, mk.nama, mk.kelas, mk.sks, ta.nama, ta.tipe;
    `;

    const fullDataResult = await handlerQuery(getFullDataQuery, [id]);

    return NextResponse.json({
      success: true,
      message: "Mata kuliah berhasil diperbarui",
      data: fullDataResult.rows[0],
    });
  } catch (error) {
    console.error("Error saat mengupdate mata kuliah:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
}

export async function POST(req) {
  const body = await req.json();

  try {
    const { kodeMatkul, namaMatkul, kelas, sks, tahunAjaran, dosenPengampu } =
      body;

    // Validasi data wajib
    if (!kodeMatkul || !namaMatkul || !kelas || !sks || !tahunAjaran) {
      return NextResponse.json({
        success: false,
        message: "Data tidak lengkap. Semua field wajib diisi",
      });
    }

    // Validasi dosen pengampu
    if (
      !dosenPengampu ||
      !Array.isArray(dosenPengampu) ||
      dosenPengampu.length === 0
    ) {
      return NextResponse.json({
        success: false,
        message: "Minimal harus ada satu dosen pengampu",
      });
    }

    // Parse tahun ajaran (format: "2024/2025 Genap")
    const tahunParts = tahunAjaran.split(" ");
    const namaTahun = tahunParts[0]; // "2024/2025"
    const tipeTahun = tahunParts[1]; // "Genap"

    if (!namaTahun || !tipeTahun) {
      return NextResponse.json({
        success: false,
        message:
          "Format tahun ajaran tidak valid. Gunakan format: YYYY/YYYY Ganjil/Genap",
      });
    }

    // PERBAIKAN: Cek duplikasi berdasarkan kombinasi kode_mk + kelas + tahun ajaran
    // Kode yang sama boleh untuk kelas berbeda, tapi tidak boleh duplikat di kelas & tahun yang sama
    const checkDuplicateQuery = `
      SELECT mk.id_mk, mk.kode_mk, mk.kelas, ta.nama as tahun_nama, ta.tipe as tahun_tipe
      FROM mata_kuliah mk
      LEFT JOIN tahun_mata_kuliah tmk ON mk.id_mk = tmk.id_mk
      LEFT JOIN tahun_ajaran ta ON tmk.id_tahun_ajaran = ta.id_tahun_ajaran
      WHERE mk.kode_mk = $1 
        AND mk.kelas = $2 
        AND ta.nama = $3 
        AND ta.tipe = $4;
    `;

    const duplicateResult = await handlerQuery(checkDuplicateQuery, [
      kodeMatkul,
      kelas,
      namaTahun,
      tipeTahun,
    ]);

    if (duplicateResult && duplicateResult.rows.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Mata kuliah ${kodeMatkul} kelas ${kelas} untuk tahun ajaran ${tahunAjaran} sudah ada`,
      });
    }

    // Cek atau insert tahun ajaran
    let tahunAjaranId;
    const checkTahunQuery = `
      SELECT id_tahun_ajaran FROM tahun_ajaran WHERE nama = $1 AND tipe = $2;
    `;

    const tahunResult = await handlerQuery(checkTahunQuery, [
      namaTahun,
      tipeTahun,
    ]);

    if (tahunResult && tahunResult.rows.length > 0) {
      // Tahun ajaran sudah ada
      tahunAjaranId = tahunResult.rows[0].id_tahun_ajaran;
    } else {
      // Insert tahun ajaran baru
      const insertTahunQuery = `
        INSERT INTO tahun_ajaran (nama, tipe)
        VALUES ($1, $2)
        RETURNING id_tahun_ajaran;
      `;

      const newTahunResult = await handlerQuery(insertTahunQuery, [
        namaTahun,
        tipeTahun,
      ]);
      tahunAjaranId = newTahunResult.rows[0].id_tahun_ajaran;
    }

    // Insert mata kuliah
    const insertMatkulQuery = `
      INSERT INTO mata_kuliah (kode_mk, nama, kelas, sks)
      VALUES ($1, $2, $3, $4)
      RETURNING id_mk, kode_mk, nama, kelas, sks;
    `;

    const matkulResult = await handlerQuery(insertMatkulQuery, [
      kodeMatkul,
      namaMatkul,
      kelas,
      parseInt(sks),
    ]);

    const newMatkul = matkulResult.rows[0];

    // Insert relasi mata kuliah dengan tahun ajaran
    const insertTahunMatkulQuery = `
      INSERT INTO tahun_mata_kuliah (id_mk, id_tahun_ajaran)
      VALUES ($1, $2)
      RETURNING id;
    `;

    await handlerQuery(insertTahunMatkulQuery, [
      newMatkul.id_mk,
      tahunAjaranId,
    ]);

    // Insert dosen pengampu ke tabel dosen_mata_kuliah
    const dosenInsertPromises = dosenPengampu.map(async (dosen) => {
      const insertDosenQuery = `
        INSERT INTO dosen_mata_kuliah (id_mk, id_user)
        VALUES ($1, $2)
        RETURNING id_dosen_mk;
      `;
      return handlerQuery(insertDosenQuery, [newMatkul.id_mk, dosen.id]);
    });

    await Promise.all(dosenInsertPromises);

    // Ambil data lengkap mata kuliah dengan dosen pengampu dan tahun ajaran
    const getFullDataQuery = `
      SELECT 
        mk.id_mk,
        mk.kode_mk,
        mk.nama,
        mk.kelas,
        mk.sks,
        CONCAT(ta.nama, ' ', ta.tipe) as tahun_ajaran,
        json_agg(
          json_build_object(
            'id', u.id_user,
            'nama', u.nama,
            'npm', u.npm,
            'email', u.email
          )
        ) as dosen_pengampu
      FROM mata_kuliah mk
      LEFT JOIN tahun_mata_kuliah tmk ON mk.id_mk = tmk.id_mk
      LEFT JOIN tahun_ajaran ta ON tmk.id_tahun_ajaran = ta.id_tahun_ajaran
      LEFT JOIN dosen_mata_kuliah dmk ON mk.id_mk = dmk.id_mk
      LEFT JOIN users u ON dmk.id_user = u.id_user
      WHERE mk.id_mk = $1
      GROUP BY mk.id_mk, mk.kode_mk, mk.nama, mk.kelas, mk.sks, ta.nama, ta.tipe;
    `;

    const fullDataResult = await handlerQuery(getFullDataQuery, [
      newMatkul.id_mk,
    ]);

    return NextResponse.json({
      success: true,
      message: "Mata kuliah berhasil ditambahkan",
      data: fullDataResult.rows[0],
    });
  } catch (error) {
    console.error("Error saat menambah mata kuliah:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
}

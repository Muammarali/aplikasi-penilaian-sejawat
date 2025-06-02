import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function POST(req) {
  const body = await req.json();

  // Check apakah bulk import atau single user
  const isBulkImport = Array.isArray(body);
  const users = isBulkImport ? body : [body];

  try {
    // Validasi semua users
    for (let i = 0; i < users.length; i++) {
      const { npm, nama, email, password, role } = users[i];
      if (!npm || !nama || !email || !password || !role) {
        return NextResponse.json({
          success: false,
          message: `Data user ${i + 1} tidak lengkap. Semua field harus diisi`,
        });
      }
    }

    // Kumpulkan semua NPM dan email untuk validasi duplikasi
    const allNpm = users.map((user) => user.npm);
    const allEmails = users.map((user) => user.email);

    // Cek duplikasi dalam data yang diimport
    const duplicateNpm = allNpm.filter(
      (npm, index) => allNpm.indexOf(npm) !== index
    );
    const duplicateEmails = allEmails.filter(
      (email, index) => allEmails.indexOf(email) !== index
    );

    if (duplicateNpm.length > 0) {
      return NextResponse.json({
        success: false,
        message: `NPM duplikat ditemukan dalam data import: ${duplicateNpm.join(
          ", "
        )}`,
      });
    }

    if (duplicateEmails.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Email duplikat ditemukan dalam data import: ${duplicateEmails.join(
          ", "
        )}`,
      });
    }

    // Cek duplikasi dengan data yang sudah ada di database
    const checkDuplicateQuery = `
        SELECT npm, email FROM users 
        WHERE npm = ANY($1) OR email = ANY($2);
      `;

    const duplicateResult = await handlerQuery(checkDuplicateQuery, [
      allNpm,
      allEmails,
    ]);

    if (duplicateResult && duplicateResult.rows.length > 0) {
      const existingNpm = duplicateResult.rows
        .filter((row) => allNpm.includes(row.npm))
        .map((row) => row.npm);
      const existingEmails = duplicateResult.rows
        .filter((row) => allEmails.includes(row.email))
        .map((row) => row.email);

      let errorMessage = "Data sudah ada di database: ";
      if (existingNpm.length > 0) {
        errorMessage += `NPM: ${existingNpm.join(", ")}`;
      }
      if (existingEmails.length > 0) {
        errorMessage +=
          existingNpm.length > 0
            ? `, Email: ${existingEmails.join(", ")}`
            : `Email: ${existingEmails.join(", ")}`;
      }

      return NextResponse.json({
        success: false,
        message: errorMessage,
      });
    }

    // Begin transaction untuk bulk insert
    const insertedUsers = [];

    if (isBulkImport) {
      // Bulk insert using VALUES clause
      const valuesClauses = users
        .map((_, index) => {
          const baseIndex = index * 5;
          return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${
            baseIndex + 4
          }, $${baseIndex + 5})`;
        })
        .join(", ");

      const bulkInsertQuery = `
          INSERT INTO users (npm, nama, email, password, role)
          VALUES ${valuesClauses}
          RETURNING id_user, npm, nama, email, role;
        `;

      const bulkParams = users.flatMap((user) => [
        user.npm,
        user.nama,
        user.email,
        user.password,
        user.role,
      ]);

      const result = await handlerQuery(bulkInsertQuery, bulkParams);
      insertedUsers.push(...result.rows);
    } else {
      // Single insert
      const { npm, nama, email, password, role } = users[0];

      const insertQuery = `
          INSERT INTO users (npm, nama, email, password, role)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id_user, npm, nama, email, role;
        `;

      const result = await handlerQuery(insertQuery, [
        npm,
        nama,
        email,
        password,
        role,
      ]);
      insertedUsers.push(...result.rows);
    }

    return NextResponse.json({
      success: true,
      message: isBulkImport
        ? `${insertedUsers.length} user berhasil diimport`
        : "User berhasil ditambahkan",
      data: isBulkImport ? insertedUsers : insertedUsers[0],
      count: insertedUsers.length,
    });
  } catch (error) {
    console.error("Error saat menambah user:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
}

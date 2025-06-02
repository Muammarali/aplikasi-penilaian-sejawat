import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function PUT(req) {
  const { id_user, npm, nama, email, password, role } = await req.json();

  try {
    // Validasi input required
    if (!id_user || !npm || !nama || !email || !role) {
      return NextResponse.json({
        success: false,
        message: "ID User dan field utama harus diisi",
      });
    }

    // Cek apakah user exists
    const checkUserQuery = `
        SELECT id_user, password FROM users 
        WHERE id_user = $1
        LIMIT 1;
      `;

    const userResult = await handlerQuery(checkUserQuery, [id_user]);

    if (!userResult || userResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    // Cek duplikat NPM/email untuk user lain
    const checkDuplicateQuery = `
        SELECT npm, email FROM users 
        WHERE (npm = $1 OR email = $2) AND id_user != $3
        LIMIT 1;
      `;

    const duplicateResult = await handlerQuery(checkDuplicateQuery, [
      npm,
      email,
      id_user,
    ]);

    if (duplicateResult && duplicateResult.rows.length > 0) {
      const duplicate = duplicateResult.rows[0];
      if (duplicate.npm === npm) {
        return NextResponse.json({
          success: false,
          message: "NPM sudah digunakan user lain",
        });
      }
      if (duplicate.email === email) {
        return NextResponse.json({
          success: false,
          message: "Email sudah digunakan user lain",
        });
      }
    }

    // Update user dengan atau tanpa password
    let updateQuery;
    let queryParams;

    if (password && password !== undefined) {
      // Jika ada password baru, update termasuk password
      updateQuery = `
          UPDATE users 
          SET npm = $1, nama = $2, email = $3, password = $4, role = $5
          WHERE id_user = $6
          RETURNING id_user, npm, nama, email, role;
        `;
      queryParams = [npm, nama, email, password, role, id_user];
    } else {
      // Jika password undefined/kosong, update tanpa mengubah password
      updateQuery = `
          UPDATE users 
          SET npm = $1, nama = $2, email = $3, role = $4
          WHERE id_user = $5
          RETURNING id_user, npm, nama, email, role;
        `;
      queryParams = [npm, nama, email, role, id_user];
    }

    const result = await handlerQuery(updateQuery, queryParams);

    return NextResponse.json({
      success: true,
      message: "User berhasil diupdate",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error saat mengupdate user:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
}

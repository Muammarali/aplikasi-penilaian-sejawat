import { NextResponse } from "next/server";
import handlerQuery from "../../../../utils/db";

export async function DELETE(req) {
  const { id_user } = await req.json();

  try {
    // Validasi input required
    if (!id_user) {
      return NextResponse.json({
        success: false,
        message: "ID User harus diisi",
      });
    }

    // Cek apakah user exists
    const checkUserQuery = `
        SELECT id_user, nama FROM users 
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

    const userData = userResult.rows[0];

    // Delete user
    const deleteQuery = `
        DELETE FROM users 
        WHERE id_user = $1
        RETURNING id_user;
      `;

    const result = await handlerQuery(deleteQuery, [id_user]);

    if (result.rows.length > 0) {
      return NextResponse.json({
        success: true,
        message: `User "${userData.nama}" berhasil dihapus`,
        data: { id_user: result.rows[0].id_user },
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Gagal menghapus user",
      });
    }
  } catch (error) {
    console.error("Error saat menghapus user:", error);

    // Handle foreign key constraint error
    if (error.code === "23503") {
      return NextResponse.json({
        success: false,
        message:
          "User tidak dapat dihapus karena masih terkait dengan data lain",
      });
    }

    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
}

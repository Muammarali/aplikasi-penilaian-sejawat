import { NextResponse } from "next/server";
import handlerQuery from "../../../utils/db";

export async function GET() {
  try {
    const getUserQuery = `
        SELECT 
            id_user, npm, nama, email, role
        FROM
            users
        WHERE
            role NOT LIKE 'Admin';
    `;

    const result = await handlerQuery(getUserQuery, []);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada users di database.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error processing request",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

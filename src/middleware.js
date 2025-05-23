import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req) {
  const token = await getToken({ req, secret });
  const { pathname } = req.nextUrl;

  // Redirect ke login kalau belum login dan buka halaman selain login
  if (!token && pathname !== "/login") {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect ke halaman utama kalau sudah login dan tetap buka login
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (token) {
    const userRole = token.role;

    // Role-based access
    const roleAccess = {
      Mahasiswa: ["/", "/matakuliah", "/daftarkelas"],
      Dosen: ["/", "/matakuliah", "/daftarkelas"],
      Admin: ["/", "/matakuliah", "/daftarkelas"],
    };

    const allowedPaths = roleAccess[userRole] || [];

    // Support untuk dynamic route seperti /daftarkelas/123
    const isAllowed = allowedPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    const existingPaths = [
      "/",
      "/matakuliah",
      "/daftarkelas",
      "/login",
      "/forbidden",
    ];

    const isKnownPath = existingPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    if (!isKnownPath) {
      return NextResponse.rewrite(new URL("/404", req.url));
    }

    if (!isAllowed && pathname !== "/forbidden" && pathname !== "/login") {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico|images/).*)"],
};

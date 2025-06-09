import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import handlerQuery from "./src/app/utils/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const query = `SELECT * FROM users WHERE email = $1`;
          const value = [credentials.email];
          const data = await handlerQuery(query, value);
          const user = data.rows[0];

          // If no user found, return null
          if (!user) {
            return null;
          }

          if (typeof user.password !== "string") {
            return null;
          }

          const password = String(credentials.password);

          // Compare password hash using bcrypt
          const passwordMatch = await bcrypt.compare(password, user.password);

          if (!passwordMatch) {
            // console.log("Password doesn't match");
            return null;
          }

          // Return user object without the password
          const { password: _password, ...userWithoutPassword } = user;
          return {
            id: userWithoutPassword.id_user,
            nama: userWithoutPassword.nama,
            email: userWithoutPassword.email,
            role: userWithoutPassword.role,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // JWT configuration
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

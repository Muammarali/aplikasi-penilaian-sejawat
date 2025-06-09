import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import handlerQuery from "../src/app/utils/db";

export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 5, // Session berumur 5 jam karena 60 * 60 detik * 5 = 5 jam
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const query = `SELECT * FROM users WHERE email = $1`;
        const value = [credentials.email];
        const data = await handlerQuery(query, value);
        const user = data.rows[0];
        const passwordCorrect = await bcrypt.compare(
          credentials?.password,
          user?.password
        );

        if (passwordCorrect) {
          return {
            id: user?.id_user,
            npm: user?.npm,
            nama: user?.nama,
            email: user?.email,
            role: user?.role,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        token.provider = account.provider;
      }
      if (user) {
        token.id = user.id;
        token.npm = user.npm;
        token.nama = user.nama;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        npm: token.npm,
        nama: token.nama,
        email: token.email,
        role: token.role,
      };
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

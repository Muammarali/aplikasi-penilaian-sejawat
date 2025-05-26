import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionWrapper from "../components/SessionWrapper";
import { Toaster } from "react-hot-toast";
import LoadingLayout from "../components/LoadingContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Penilaian Sejawat UNPAR",
  description: "Aplikasi Penilaian Sejawat UNPAR",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <SessionWrapper>
      <html lang="en" suppressHydrationWarning={true}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {/* <LoadingLayout>{children}</LoadingLayout> */}
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000, // 5 detik
              style: {
                background: "#363636",
                color: "#fff",
              },

              success: {
                duration: 5000,
                iconTheme: {
                  primary: "#10B981",
                  secondary: "#FFFFFF",
                },
              },

              error: {
                duration: 5000,
                iconTheme: {
                  primary: "#EF4444",
                  secondary: "#FFFFFF",
                },
              },
            }}
          />
        </body>
      </html>
    </SessionWrapper>
  );
}

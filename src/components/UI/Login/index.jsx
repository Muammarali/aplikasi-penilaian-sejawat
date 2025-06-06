"use client";
import { useEffect, useRef, useState, FormEvent } from "react";
import { signIn, useSession } from "next-auth/react";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { MdOutlineAlternateEmail } from "react-icons/md";
import { CgLock } from "react-icons/cg";
import { showNotification } from "../Notification/notification";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter } from "next/navigation";

const Login = () => {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    password: "",
    general: "",
  });
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Clear errors when user types
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.password || errors.general) {
      setErrors((prev) => ({ ...prev, password: "", general: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password || errors.general) {
      setErrors((prev) => ({ ...prev, password: "", general: "" }));
    }
  };

  const validateForm = () => {
    let errorMessage = "";

    if (email.length < 4) {
      errorMessage = "Email harus lebih dari 4 karakter";
    } else if (password.length < 4) {
      errorMessage = "Password harus lebih dari 4 karakter";
    }

    setErrors({ password: errorMessage, general: "" });
    return !errorMessage;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Clear previous errors
    setErrors({ password: "", general: "" });

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      const loadingToastId = showNotification.loading("Logging in...");

      const response = await signIn("credentials", {
        email: email,
        password: password,
        redirect: false,
      });

      showNotification.dismiss(loadingToastId);

      if (!response?.ok) {
        // Set error message only for password field when login fails
        setErrors({
          password: "Email atau password salah",
          general: "",
        });
        showNotification.error("Email atau password salah");
        setIsLoading(false);
      } else {
        showNotification.success("Berhasil login");
        router.push("/");
      }
    } catch (error) {
      setErrors({
        password: "",
        general: "Error saat login. Silakan coba lagi.",
      });
      showNotification.error("Error saat login");
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return mounted ? (
    <div
      className="min-h-screen min-w-96 flex flex-col lg:flex-row space-y-6 lg:space-y-0 items-center justify-center bg-cover bg-center space-x-8 overflow-hidden"
      style={{
        backgroundImage: 'url("/images/bg-login.jpg")', // Ganti dengan path gambar Anda
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex items-center">
        <img src="/images/logo-unpar.png" alt="Logo UNPAR" className="w-24" />
        <div className="text-white p-2 text-center lg:text-left">
          <div className="font-bold text-2xl lg:text-4xl uppercase text-nowrap">
            Jurusan Informatika
          </div>
          <div className="font-medium text-xl lg:text-2xl text-nowrap">
            Universitas Katolik Parahyangan
          </div>
        </div>
      </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden grid">
        <div className="px-8 sm:px-10 md:px-8 py-12">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-blue-600">
              Aplikasi Penilaian Sejawat Informatika UNPAR
            </div>
            <h1 className="text-gray-500 pt-2">Please enter your details</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error Message */}
            {errors.general && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                {errors.general}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium pl-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MdOutlineAlternateEmail
                    className={`text-lg ${
                      errors.password ? "text-red-400" : "text-blue-400"
                    }`}
                  />
                </div>
                <input
                  autoComplete="off"
                  type="text"
                  id="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full rounded-md border p-2.5 pl-10 shadow-sm text-sm focus:ring-1 outline-none ${
                    errors.password
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  style={{ minHeight: "40px" }}
                />
              </div>
            </div>

            <div className="space-y-2 pb-2">
              <label htmlFor="password" className="text-sm font-medium pl-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <CgLock
                    className={`text-lg ${
                      errors.password ? "text-red-400" : "text-blue-400"
                    }`}
                  />
                </div>
                <input
                  autoComplete="off"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  className={`w-full rounded-md border p-2.5 pl-10 pr-10 shadow-sm text-sm focus:ring-1 outline-none ${
                    errors.password
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  style={{ minHeight: "40px" }}
                />
                <div
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <FiEye
                      className={`text-lg ${
                        errors.password ? "text-red-400" : "text-blue-400"
                      }`}
                    />
                  ) : (
                    <FiEyeOff
                      className={`text-lg hover:text-blue-400 ${
                        errors.password ? "text-red-400" : "text-gray-400"
                      }`}
                    />
                  )}
                </div>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 pl-1">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-10 bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-800 transition-all flex items-center justify-center cursor-pointer ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  ) : null;
};

export default Login;

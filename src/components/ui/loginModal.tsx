"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import clsx from "clsx";

type Mode = "login" | "register";

export default function LoginModal() {
  const { isModalOpen } = useAuth();
  if (!isModalOpen) return null;
  return <LoginModalContent />;
}

function LoginModalContent() {
  const { closeModal, login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
    name?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Lock body scroll + Escape-to-close while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [closeModal]);

  const validate = () => {
    const next: typeof errors = {};
    if (!identifier.trim())
      next.identifier = "Email atau No. Telepon wajib diisi";
    if (!password) next.password = "Password wajib diisi";
    else if (mode === "register" && password.length < 8)
      next.password = "Password minimal 8 karakter";
    if (mode === "register" && !name.trim()) next.name = "Nama wajib diisi";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    const result =
      mode === "login"
        ? await login(identifier.trim(), password)
        : await register(identifier.trim(), password, name.trim());
    setSubmitting(false);

    if (!result.ok) setServerError(result.error);
    // On success AuthContext closed the modal — no work here.
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setErrors({});
    setServerError(null);
  };

  const submitLabel = submitting
    ? "Memproses..."
    : mode === "login"
    ? "Masuk"
    : "Daftar";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Tutup"
        onClick={closeModal}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white shadow-2xl border border-[#E8DDD0]">
        <button
          type="button"
          onClick={closeModal}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-[#7C6E62] hover:bg-[#F5EFE6] transition-colors"
          aria-label="Tutup"
        >
          ✕
        </button>

        <div className="px-6 pt-8 pb-6">
          <div className="flex flex-col items-center gap-1 mb-6">
            <span className="text-3xl">🌈</span>
            <h2
              id="login-title"
              className="font-serif text-2xl font-bold text-[#1A110A]"
            >
              {mode === "login" ? "Masuk ke Pelangi²" : "Daftar di Pelangi²"}
            </h2>
            <p className="text-xs text-[#7C6E62]">
              {mode === "login"
                ? "Masukkan email atau nomor telepon Anda"
                : "Buat akun baru dengan email atau nomor telepon"}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex border border-[#E8DDD0] mb-4">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={clsx(
                  "flex-1 py-2 text-xs font-semibold tracking-wide uppercase transition-colors",
                  mode === m
                    ? "bg-[#1A110A] text-white"
                    : "bg-white text-[#7C6E62] hover:bg-[#F5EFE6]"
                )}
              >
                {m === "login" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            noValidate
          >
            {/* Name — register only */}
            {mode === "register" && (
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="name"
                  className="text-[0.7rem] font-semibold tracking-wider uppercase text-[#7C6E62]"
                >
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={clsx(
                    "border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40",
                    errors.name ? "border-red-500" : "border-[#E8DDD0]"
                  )}
                  placeholder="Contoh: Budi Santoso"
                  autoComplete="name"
                />
                {errors.name && (
                  <span className="text-xs text-red-600">{errors.name}</span>
                )}
              </div>
            )}

            {/* Identifier — email or phone */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="identifier"
                className="text-[0.7rem] font-semibold tracking-wider uppercase text-[#7C6E62]"
              >
                Email atau No. Telepon
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={clsx(
                  "border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40",
                  errors.identifier ? "border-red-500" : "border-[#E8DDD0]"
                )}
                placeholder="nama@email.com atau 081234567890"
                autoComplete="username"
              />
              {errors.identifier && (
                <span className="text-xs text-red-600">
                  {errors.identifier}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="password"
                className="text-[0.7rem] font-semibold tracking-wider uppercase text-[#7C6E62]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={clsx(
                  "border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40",
                  errors.password ? "border-red-500" : "border-[#E8DDD0]"
                )}
                placeholder="••••••••"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
              {errors.password && (
                <span className="text-xs text-red-600">{errors.password}</span>
              )}
            </div>

            {serverError && (
              <p
                role="alert"
                className="text-xs text-red-600 text-center -mt-1"
              >
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 py-3 bg-red-600 text-white text-sm font-semibold tracking-wide hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitLabel}
            </button>

            <button
              type="button"
              onClick={() =>
                switchMode(mode === "login" ? "register" : "login")
              }
              className="text-xs text-[#7C6E62] hover:text-red-600 hover:underline text-center"
            >
              {mode === "login"
                ? "Belum punya akun? Daftar di sini"
                : "Sudah punya akun? Masuk"}
            </button>

            <p className="text-[0.65rem] text-[#7C6E62] text-center leading-relaxed">
              Dengan melanjutkan, Anda menyetujui syarat & ketentuan toko.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

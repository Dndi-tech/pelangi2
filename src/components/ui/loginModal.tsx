"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import clsx from "clsx";

type Method = "email" | "phone";

// Loose but useful — real validation will happen server-side in Phase 3.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?62|0)8[1-9][0-9]{6,10}$/; // Indonesian mobile format

// Outer component: just gates on isModalOpen so the inner unmounts on close.
// This way the form state resets naturally — no reset-on-close effect needed.
export default function LoginModal() {
  const { isModalOpen } = useAuth();
  if (!isModalOpen) return null;
  return <LoginModalContent />;
}

function LoginModalContent() {
  const { closeModal, login } = useAuth();

  const [method, setMethod] = useState<Method>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; contact?: string }>({});
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
    if (!name.trim()) next.name = "Nama wajib diisi";

    if (method === "email") {
      if (!email.trim()) next.contact = "Email wajib diisi";
      else if (!EMAIL_RE.test(email)) next.contact = "Format email tidak valid";
    } else {
      if (!phone.trim()) next.contact = "Nomor telepon wajib diisi";
      else if (!PHONE_RE.test(phone))
        next.contact = "Gunakan format 08xx atau +62 8xx";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    // Simulate a small async delay — keeps the UX honest about what
    // logging in actually feels like once we have a real backend.
    setTimeout(() => {
      login({
        name: name.trim(),
        email: method === "email" ? email.trim() : undefined,
        phone: method === "phone" ? phone.trim() : undefined,
      });
      setSubmitting(false);
    }, 300);
  };

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
              Masuk ke Pelangi²
            </h2>
            <p className="text-xs text-[#7C6E62]">
              Belum punya akun? Cukup isi nama dan kontak.
            </p>
          </div>

          {/* Method tabs */}
          <div className="flex border border-[#E8DDD0] mb-4">
            {(["email", "phone"] as Method[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMethod(m);
                  setErrors((prev) => ({ ...prev, contact: undefined }));
                }}
                className={clsx(
                  "flex-1 py-2 text-xs font-semibold tracking-wide uppercase transition-colors",
                  method === m
                    ? "bg-[#1A110A] text-white"
                    : "bg-white text-[#7C6E62] hover:bg-[#F5EFE6]"
                )}
              >
                {m === "email" ? "Email" : "No. Telepon"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
                onBlur={() => {
                  if (!name.trim())
                    setErrors((p) => ({ ...p, name: "Nama wajib diisi" }));
                  else setErrors((p) => ({ ...p, name: undefined }));
                }}
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

            {method === "email" ? (
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="email"
                  className="text-[0.7rem] font-semibold tracking-wider uppercase text-[#7C6E62]"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={clsx(
                    "border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40",
                    errors.contact ? "border-red-500" : "border-[#E8DDD0]"
                  )}
                  placeholder="nama@email.com"
                  autoComplete="email"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="phone"
                  className="text-[0.7rem] font-semibold tracking-wider uppercase text-[#7C6E62]"
                >
                  No. Telepon
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={clsx(
                    "border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40",
                    errors.contact ? "border-red-500" : "border-[#E8DDD0]"
                  )}
                  placeholder="0812xxxxxxxx"
                  autoComplete="tel"
                />
              </div>
            )}

            {errors.contact && (
              <span className="text-xs text-red-600 -mt-2">
                {errors.contact}
              </span>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 py-3 bg-red-600 text-white text-sm font-semibold tracking-wide hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Memproses..." : "Masuk"}
            </button>

            <p className="text-[0.65rem] text-[#7C6E62] text-center leading-relaxed">
              Dengan masuk, Anda menyetujui syarat & ketentuan toko.
              <br />
              <span className="opacity-60">
                (Login asli akan diaktifkan pada tahap berikutnya.)
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

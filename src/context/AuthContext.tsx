"use client";

// src/context/AuthContext.tsx
//
// Auth state for the whole app. Three responsibilities:
//   1. Hydrate — on mount, ask /me "who am I?" (cookie is httpOnly so JS
//      can't read it; only the server can answer).
//   2. Mutate — login / register / logout call POST endpoints and update
//      React state from the response.
//   3. Expose — useAuth() lets any component read user, open modal, log out.
//
// isLoading represents HYDRATION ONLY. It starts true, flips to false in
// the useEffect's .finally(), and stays false forever. Modal handles its
// own submitting state. This avoids Navbar flicker on every auth action.

import { classifyIdentifier } from "@/lib/identifier";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type User = {
  id: string;
  name: string;
  email?: string | null;   // phone-registered users have no email
  phone?: string | null;   // email-registered users have no phone
};

export type AuthResult =
  | { ok: true; data: User }
  | { ok: false; error: string };

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  login: (identifier: string, password: string) => Promise<AuthResult>;
  register: (
    identifier: string,
    password: string,
    name: string
  ) => Promise<AuthResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hydration — runs ONCE per provider mount.
  // Empty deps array is mandatory; putting `user` here would loop forever.
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data: { user: User | null }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  // ── login(identifier, password) ───────────────────────────────────────────
  //
  // Server classifies the identifier as email or phone and looks up the user.
  // On success: update React state and close the modal. On failure: return
  // the Result so the modal can display the error inline.
  async function login(
    identifier: string,
    password: string
  ): Promise<AuthResult> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        return { ok: false, error: data.error ?? "Login gagal" };
      }

      // The TWO state commitments — without these, login is decorative.
      setUser(data.user);
      setIsModalOpen(false);

      // Unwrap: data is { user: {...} }, AuthResult.data is User.
      return { ok: true, data: data.user };
    } catch {
      return { ok: false, error: "Network error" };
    }
  }

  // ── register(identifier, password, name) ──────────────────────────────────
  //
  // Client-side classification decides whether to send `email` or `phone`
  // in the body. Server independently re-validates and normalizes.
  async function register(
    identifier: string,
    password: string,
    name: string
  ): Promise<AuthResult> {
    const type = classifyIdentifier(identifier.trim());
    if (type === "invalid") {
      return {
        ok: false,
        error: "Masukkan email atau nomor telepon yang valid",
      };
    }

    // Build the body shape the server expects. /api/auth/register accepts
    // { email?, phone?, password, name } with a refine() requiring at least
    // one of the two identifiers.
    const body =
      type === "email"
        ? { email: identifier.trim().toLowerCase(), password, name }
        : { phone: identifier.trim(), password, name };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        // 409 returns a string; 400 (zod) returns a flatten() object.
        // Collapse both into a single string for the modal.
        const message =
          typeof data.error === "string"
            ? data.error
            : "Pendaftaran gagal. Periksa input Anda.";
        return { ok: false, error: message };
      }

      setUser(data.user);
      setIsModalOpen(false);
      return { ok: true, data: data.user };
    } catch {
      return { ok: false, error: "Network error" };
    }
  }

  // ── logout() ──────────────────────────────────────────────────────────────
  //
  // Promise<void> — no Result needed. We always clear local state, even if
  // the server call fails; better to make the user re-log in than to leave
  // a half-logged-out UI.
  async function logout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Swallow — we clear local state regardless.
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

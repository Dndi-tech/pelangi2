"use client";

import { classifyIdentifier } from "@/lib/identifier";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

export type User = {
  id: string;
  name: string;
  email?: string; // nullable now — phone-registered users have no email
  phone?: string;
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
  login: (
    identifier: string,
    password: string,
    name: string
  ) => Promise<AuthResult>;
  register: (
    identifier: string,
    password: string,
    name: string
  ) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsloading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data: { user: User | null }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setIsloading(false));
  }, []);
  async function login(
    identifier: string,
    password: string,
    name: string
  ): Promise<AuthResult> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, password, name }),
      });
      const data = await response.json();

      if (!response.ok) {
        return { ok: false, error: data.error ?? "login failed" };
      }
      setUser(data.user);
      return { ok: true, data: data };
    } catch {
      return { ok: false, error: "Network error" };
    } finally {
      setIsloading(false);
    }
  }

  async function logout(): Promise<AuthResult> {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        return { ok: false, error: data.error ?? "login failed" };
      }
      return { ok: true, data: data };
    } catch {
      return { ok: false, error: "Network error" };
    } finally {
      setUser(null);
      setIsloading(false);
    }
  }
  // EXAMPLE — pattern reference. Do not paste blindly; understand each piece.
  async function register(
    identifier: string, // ← was `email`. Now means "either"
    password: string,
    name: string
  ): Promise<AuthResult> {
    // STEP 1 — classify. Imported from lib/auth.ts (you'll add it in Task #2).
    // Until you write that helper, you can inline a quick check:
    //   const type = identifier.includes("@") ? "email" : "phone";
    // …but a real classifier validates format, not just presence of "@".
    const type = classifyIdentifier(identifier.trim());

    // STEP 2 — reject early. No network call for invalid input.
    // Returning AuthResult keeps the caller's narrowing code simple.
    if (type === "invalid") {
      return {
        ok: false,
        error: "Masukkan email atau nomor telepon yang valid",
      };
    }

    // STEP 3 — build the body shape the server expects.
    // Server accepts { email?, phone?, password, name } with refine() requiring
    // at least one. We send the right key based on what the user typed.
    const body =
      type === "email"
        ? { email: identifier.trim().toLowerCase(), password, name }
        : { phone: identifier.trim(), password, name };
    //                                ↑
    //                Phone normalization happens on the server in /register
    //                — single source of truth. Don't normalize in two places.

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body), // ← THIS WAS MISSING IN YOUR CODE
      });
      const data = await response.json();

      if (!response.ok) {
        // Tighten the fallback message — "login failed" in a register
        // function is a copy-paste tell. Future-you will be confused.
        return { ok: false, error: data.error ?? "Pendaftaran gagal" };
      }

      setUser(data.user);
      setIsModalOpen(false); // ← also currently missing from your register
      return { ok: true, data: data.user };
      //                       ↑
      //         Unwrap. data is { user: {...} }; AuthResult.data is User.
      //         You had `data: data` before — that stores the wrapper, not
      //         the user. Caller doing `result.data.id` would get undefined.
    } catch {
      return { ok: false, error: "Network error" };
    } finally {
      setIsloading(false);
    }
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

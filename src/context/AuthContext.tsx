"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Children,
} from "react";

type User = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

type LoginCredentials = {
  name: string;
  email?: string;
  phone?: string;
};
type AuthContextType = {
  user: User | null;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  login: (credentials: LoginCredentials) => void;
  logout: () => void;
};

function generateId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const login = ({ name, email, phone }: LoginCredentials) => {
    if (!email && !phone) {
      throw new Error("Email/nomor telepon waji diisi");
    }
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    setUser({
      id: generateId(),
      name,
      email,
      phone,
    });
    setIsModalOpen(false);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        login,
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

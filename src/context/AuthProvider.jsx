import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import { authServices } from "../api/authServices";

const STORAGE_KEY = "session";

const readSession = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  /*
   * authServices puede actualizar la sesión cuando renueva
   * automáticamente el access token.
   *
   * Este listener hace que React también se entere del cambio.
   */
  useEffect(() => {
    const handleSessionUpdate = () => {
      setSession(readSession());
    };

    window.addEventListener("auth-session-updated", handleSessionUpdate);

    return () => {
      window.removeEventListener("auth-session-updated", handleSessionUpdate);
    };
  }, []);

  const login = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // La sesión permanece en memoria si el navegador no permite storage.
    }

    setSession(next);
  }, []);

  const logout = useCallback(() => {
    authServices.clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      refreshToken: session?.refreshToken ?? null,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
    }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

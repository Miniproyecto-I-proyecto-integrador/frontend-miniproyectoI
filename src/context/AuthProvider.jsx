import { useCallback, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";

const STORAGE_KEY = "session"; // { token, user }

const readSession = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

// Por ahora solo guarda y expone la sesión. Cuando el backend esté listo,
// LoginPage llamará a la API y, si sale bien, ejecutará login({ token, user }).
export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession); // se lee una sola vez al montar: la sesión sobrevive a recargar

  const login = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* sin storage: la sesión vive solo en memoria */
    }
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nada que limpiar */
    }
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
    }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

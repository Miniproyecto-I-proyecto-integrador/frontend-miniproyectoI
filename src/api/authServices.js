const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://backend-miniproyectoi.onrender.com/api"
).replace(/\/+$/, "");

const STORAGE_KEY = "session";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      body.detail ||
      body.non_field_errors?.[0] ||
      "No pudimos completar la solicitud";
    const error = new Error(message);
    error.status = response.status;
    error.fields = body;
    throw error;
  }

  return body;
};

const readStoredSession = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

export const authServices = {
  login: async ({ email, password }) => {
    const data = await request("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    return {
      token: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
    };
  },

  register: async ({ first_name, last_name, email, password }) => {
    // El backend usa el username de Django, pero no lo pide en la interfaz.
    // Usamos el correo como username para mantener ambos datos consistentes.
    return request("/auth/register/", {
      method: "POST",
      body: JSON.stringify({
        username: email,
        first_name,
        last_name,
        email,
        password,
      }),
    });
  },

  me: async () => {
    const session = readStoredSession();
    if (!session?.token) return null;

    return request("/auth/me/", {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });
  },

  getAccessToken: () => readStoredSession()?.token ?? null,
};

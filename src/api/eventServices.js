import { API_URL } from "../../config";
import { authServices } from "./authServices";

const buildApiUrl = (path) => {
  const base = API_URL.replace(/\/+$/, "").replace(/\/api$/, "");
  const normalizedPath = path.startsWith("/api/")
    ? path
    : `/api${path.startsWith("/") ? path : `/${path}`}`;
  return `${base}${normalizedPath}`;
};

const request = async (path, options = {}, canRefresh = true) => {
  const token = authServices.getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    method: options.method || "GET",
    headers,
  });

  const body = await response.json().catch(() => ({}));

  /*
   * Si el access token expiró, el backend responde 401.
   * Intentamos renovarlo utilizando el refresh token.
   */
  if (response.status === 401 && canRefresh) {
    try {
      await authServices.refreshAccessToken();

      // Repetimos la petición original con el nuevo access token.
      return request(path, options, false);
    } catch {
      // El refresh token tampoco es válido.
      authServices.clearSession();
      window.location.href = "/login";
      return;
    }
  }

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

export const eventServices = {
  listEvents: () => request("/api/actividades/"),

  getEvent: (id) => request(`/api/actividades/${id}/`),

  createEvent: (data) =>
    request("/api/actividades/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateActividad: (id, data) =>
    request(`/api/actividades/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateEvent: (id, data) =>
    request(`/api/actividades/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteEvent: (id) =>
    request(`/api/actividades/${id}/`, {
      method: "DELETE",
    }),

  createSubtask: (data) =>
    request("/api/subtareas/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateSubtask: (id, data) =>
    request(`/api/subtareas/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  patchSubtask: (id, data) =>
    request(`/subtareas/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  rescheduleSubtask: (id, dueDate) =>
    request(`/api/subtareas/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ due_date: dueDate }),
    }),

  suggestSubtaskDay: (id, today) => {
    const query = new URLSearchParams({ today });
    return request(`/api/subtareas/${id}/sugerir-dia/?${query}`);
  },

  moveSubtask: (id, dueDate, today) => {
    const query = new URLSearchParams({ today });
    return request(`/api/subtareas/${id}/resolver-mover/?${query}`, {
      method: "PATCH",
      body: JSON.stringify({ due_date: dueDate }),
    });
  },

  reduceSubtaskHours: (id, estimatedHours, today) => {
    const query = new URLSearchParams({ today });
    return request(`/api/subtareas/${id}/resolver-reducir/?${query}`, {
      method: "PATCH",
      body: JSON.stringify({ estimated_hours: estimatedHours }),
    });
  },

  // US-09: PATCH /api/subtareas/{id}/registrar-ejecucion/
  registerExecution: async (id, { status, note, due_date } = {}) => {
    const payload = { status };
    if (status === "postponed") {
      payload.note = (note ?? "").trim();
      if (due_date) {
        payload.due_date = due_date;
      }
    } else if (note !== undefined && note !== "") {
      payload.note = note.trim();
    }

    try {
      return await request(`/api/subtareas/${id}/registrar-ejecucion/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (error?.status === 404) {
        return request(`/api/subtareas/${id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      throw error;
    }
  },

  deleteSubtask: (id) =>
    request(`/api/subtareas/${id}/`, {
      method: "DELETE",
    }),

  // US-10: GET /api/actividades/{id}/progreso/
  getProgress: (id) => request(`/api/actividades/${id}/progreso/`),

  getCapacity: (date, userId) => {
    const query = new URLSearchParams({
      date,
      ...(userId ? { user_id: userId } : {}),
    });

    return request(`/api/capacidad-diaria/resumen/?${query}`);
  },
};


export async function getDailyLimit(today) {
  const query = today ? `?today=${encodeURIComponent(today)}` : "";
  return request(`/configuracion/limite-diario/${query}`);
}

export async function updateDailyLimit(dailyHoursLimit, today) {
  const query = today ? `?today=${encodeURIComponent(today)}` : "";
  return request(`/configuracion/limite-diario/${query}`, {
    method: 'PATCH',
    body: JSON.stringify({ daily_hours_limit: Number(dailyHoursLimit) }),
  });
}
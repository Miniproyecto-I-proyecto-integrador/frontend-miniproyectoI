const TEST_USER = {
  first_name: "Isabela",
  last_name: "Bermúdez",
  email: "isabela@test.com",
  password: "12345678",
};

const fakeSession = {
  token: "token-de-prueba",
  user: {
    first_name: TEST_USER.first_name,
    last_name: TEST_USER.last_name,
    email: TEST_USER.email,
  },
};

export const authServices = {
  login: async ({ email, password }) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (email !== TEST_USER.email || password !== TEST_USER.password) {
      const error = new Error("Credenciales incorrectas");
      error.status = 401;
      throw error;
    }

    return fakeSession;
  },

  register: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    console.log("Usuario registrado:", data);

    return {
      message: "Usuario creado correctamente",
    };
  },
};

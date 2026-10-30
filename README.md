# Logística — Planificador de eventos (Frontend)

Aplicación web SPA para la planificación de eventos, control de subtareas diarias y seguimiento de progreso operativo. Permite gestionar límites diarios de horas, detectar sobrecargas de agenda y resolver conflictos mediante reprogramación o ajuste de tiempos.

- **App publicada (Vercel):** [https://frontend-miniproyecto-i.vercel.app/](https://frontend-miniproyecto-i.vercel.app/)
- **API publicada (Render):** [https://backend-miniproyectoi.onrender.com/admin/](https://backend-miniproyectoi.onrender.com/admin/)
- **Repositorio Frontend:** [https://github.com/Miniproyecto-I-proyecto-integrador/frontend-miniproyectoI](https://github.com/Miniproyecto-I-proyecto-integrador/frontend-miniproyectoI)
- **Repositorio Backend:** [https://github.com/Miniproyecto-I-proyecto-integrador/backend-miniproyectoI](https://github.com/Miniproyecto-I-proyecto-integrador/backend-miniproyectoI)
- **Organización GitHub:** [https://github.com/Miniproyecto-I-proyecto-integrador](https://github.com/Miniproyecto-I-proyecto-integrador)

## Cuenta de prueba
- **Correo:** `isabela@correoqueseainventado.com`
- **Contraseña:** `gummyesmeralda`

## Tecnologías
- **React 19.2.8** y **React DOM 19.2.8**
- **React Router DOM 7.18.4**
- **Vite 8.3.0**
- **Lucide React 1.47.0**
- **ESLint 10.10.0**

## Estructura
```text
frontend-miniproyectoI/
├── public/            # Recursos públicos estáticos
├── src/
│   ├── api/           # Servicios de conexión con la API (auth y eventos)
│   ├── assets/        # Imágenes e íconos locales
│   ├── components/    # Componentes reutilizables (common, events, hoy)
│   ├── context/       # Estado global de autenticación (AuthContext)
│   ├── pages/         # Vistas principales (Hoy, Eventos, EventoDetail, Crear, Login, Registro)
│   ├── utils/         # Funciones auxiliares de fechas y agenda
│   ├── App.jsx        # Configuración de rutas y layout principal
│   └── main.jsx       # Punto de entrada de la aplicación
├── config.js          # Configuración global y URL base de la API
├── package.json
└── vite.config.js
```

## Características principales
- **Autenticación JWT:** Inicio de sesión, registro y renovación automática de sesión (`refresh_token`).
- **Vista operativa diaria (`/hoy`):** Control de subtareas del día, filtros de estado y resumen de capacidad horaria utilizada.
- **Gestión de eventos y subtareas (`/eventos`, `/crear`, `/evento/:id`):** Creación, edición, eliminación y registro de ejecución (completada o pospuesta con notas).
- **Seguimiento de progreso (`/progreso`):** Visualización del porcentaje de avance por cada evento según sus subtareas completadas.
- **Control de límite diario y sobrecargas:** Configuración del tope de horas diarias (1 a 16 h), detección de conflictos y resolución asistida (reprogramar fecha o reducir horas).

## Cómo correrlo en local
```bash
git clone https://github.com/Miniproyecto-I-proyecto-integrador/frontend-miniproyectoI.git
cd frontend-miniproyectoI
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`. Por defecto se conecta a la API en Render; para usar un backend local, crea un archivo `.env` con `VITE_API_URL=http://localhost:8000`.

## Equipo
- Juan Marin Orozco ([@JuanmoCode](https://github.com/JuanmoCode))
- Juan Diego Ledezma Muñoz ([@Ju4nD1ego](https://github.com/Ju4nD1ego))
- Brandon Alexis Franco Flor ([@BrandoliOrname](https://github.com/BrandoliOrname))
- Isabela Bermudez Moreno ([@isabelabermudez](https://github.com/isabelabermudez))

---
**Proyecto Integrador - MiniProyecto 1**  
Profesor: Fabián Stiven Valencia Córdoba

# Ultimate Scheduler

Frontend progresivo en React + Vite + TypeScript para diseñar torneos de Ultimate Frisbee.

## Características

- Flujo por fases con bloqueo progresivo
- Estado global con Zustand y persistencia en `localStorage`
- UI moderna con Tailwind CSS, animaciones Framer Motion y drag & drop mediante React DnD
- Generación de modelos y horarios simulados con datos locales
- Vista pública lista para compartir resultados en directo

## Scripts

```bash
npm install
npm run dev    # Inicia el entorno de desarrollo en http://localhost:5173
npm run build  # Compila la aplicación para producción
npm run preview
```

## Estructura

- `src/store`: Estado global y selectores
- `src/components/phases`: Componentes principales de cada fase
- `src/utils`: Utilidades para generar modelos, horarios y slug públicos
- `src/pages`: Constructor principal y vista pública del torneo

La interfaz está en español mientras que el código y los comentarios están en inglés, tal como se solicitó.

# Configuración de Desarrollo

## Prerrequisitos

- Node.js 18+
- npm o bun

## Instalación

```bash
npm install
```

## Variables de Entorno

Crear archivo `.env`:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
```

## Desarrollo

```bash
npm run dev
```

Acceder a `http://localhost:5173`

## Build

```bash
npm run build
```

## Estructura

```
src/
├── components/     # Componentes React
├── contexts/       # Contextos (Auth)
├── data/          # Datos mock
├── hooks/         # Hooks personalizados
├── integrations/  # Supabase client
├── lib/           # Utilidades
├── pages/         # Páginas
└── types/         # TypeScript interfaces
```

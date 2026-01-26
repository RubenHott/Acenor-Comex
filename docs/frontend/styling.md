# Sistema de Estilos

El proyecto utiliza Tailwind CSS con un sistema de diseño personalizado.

## Archivos de Configuración

| Archivo | Propósito |
|---------|-----------|
| `src/index.css` | Variables CSS y clases custom |
| `tailwind.config.ts` | Configuración de Tailwind |

## Sistema de Colores

### Variables CSS (index.css)

```css
:root {
  /* Fondos */
  --background: 210 20% 98%;     /* Fondo principal */
  --foreground: 215 25% 15%;     /* Texto principal */
  --card: 0 0% 100%;             /* Fondo de tarjetas */
  --card-foreground: 215 25% 15%;
  --popover: 0 0% 100%;          /* Fondo de popovers */
  --popover-foreground: 215 25% 15%;
  
  /* Colores Semánticos */
  --primary: 215 60% 25%;        /* Navy Blue - Primario */
  --primary-foreground: 0 0% 100%;
  --secondary: 215 15% 92%;      /* Slate - Secundario */
  --secondary-foreground: 215 25% 25%;
  --muted: 215 15% 95%;          /* Contenido silenciado */
  --muted-foreground: 215 15% 45%;
  --accent: 38 92% 50%;          /* Amber - Acentos */
  --accent-foreground: 38 92% 15%;
  
  /* Estados */
  --destructive: 0 72% 51%;      /* Rojo - Errores */
  --destructive-foreground: 0 0% 100%;
  --success: 142 71% 45%;        /* Verde - Éxito */
  --success-foreground: 0 0% 100%;
  --warning: 25 95% 53%;         /* Naranja - Advertencias */
  --warning-foreground: 25 95% 15%;
  --info: 199 89% 48%;           /* Azul - Información */
  --info-foreground: 0 0% 100%;
  
  /* Bordes e inputs */
  --border: 215 20% 88%;
  --input: 215 20% 88%;
  --ring: 215 60% 25%;
  --radius: 0.5rem;
  
  /* Sidebar */
  --sidebar-background: 215 60% 18%;
  --sidebar-foreground: 215 15% 95%;
  --sidebar-primary: 38 92% 50%;
  --sidebar-accent: 215 50% 25%;
  --sidebar-border: 215 50% 25%;
  
  /* Charts */
  --chart-1: 215 60% 40%;
  --chart-2: 38 92% 50%;
  --chart-3: 142 71% 45%;
  --chart-4: 199 89% 48%;
  --chart-5: 280 65% 60%;
}
```

### Modo Oscuro

```css
.dark {
  --background: 215 30% 8%;
  --foreground: 215 15% 95%;
  --card: 215 30% 12%;
  --primary: 38 92% 50%;        /* Accent se vuelve primary */
  --secondary: 215 30% 18%;
  /* ... */
}
```

## Uso de Colores

### ✅ Correcto - Usar tokens semánticos

```tsx
// Usar clases de Tailwind con tokens
<div className="bg-background text-foreground" />
<div className="bg-primary text-primary-foreground" />
<div className="bg-card border border-border" />
<div className="text-muted-foreground" />
<Badge className="bg-success text-success-foreground" />
<Badge className="bg-warning text-warning-foreground" />
```

### ❌ Incorrecto - Colores directos

```tsx
// No usar colores directos
<div className="bg-white text-black" />
<div className="bg-blue-500" />
<div className="text-gray-600" />
```

## Clases Utilitarias Custom

### Status Badges

```css
.status-badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.status-pending { @apply bg-warning/10 text-warning; }
.status-active { @apply bg-info/10 text-info; }
.status-completed { @apply bg-success/10 text-success; }
.status-overdue { @apply bg-destructive/10 text-destructive; }
```

### Glass Effect

```css
.glass {
  @apply bg-card/80 backdrop-blur-md border border-border/50;
}
```

### Gradientes

```css
.gradient-primary {
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(215 60% 35%) 100%);
}

.gradient-accent {
  background: linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(25 95% 53%) 100%);
}
```

### Card Hover

```css
.card-hover {
  @apply transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5;
}
```

### Stats Card

```css
.stats-card {
  @apply relative overflow-hidden rounded-xl p-6 bg-card border border-border shadow-sm;
}

.stats-card::before {
  content: '';
  @apply absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10;
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%);
}
```

### Sidebar Active Link

```css
.sidebar-link-active {
  @apply bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary;
}
```

### Table Row Hover

```css
.table-row-hover {
  @apply transition-colors hover:bg-muted/50;
}
```

### Input Focus

```css
.input-focus {
  @apply focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background;
}
```

### Animaciones

```css
.page-enter {
  @apply animate-in fade-in slide-in-from-bottom-4 duration-300;
}

.skeleton-pulse {
  @apply animate-pulse bg-muted;
}
```

### Text Gradient

```css
.text-gradient {
  @apply bg-clip-text text-transparent;
  background-image: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%);
}
```

### Shadows

```css
.shadow-glow {
  box-shadow: 0 0 20px hsl(var(--primary) / 0.3);
}

.shadow-glow-accent {
  box-shadow: 0 0 20px hsl(var(--accent) / 0.3);
}
```

## Tailwind Config Extendido

```typescript
// tailwind.config.ts

export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Colores base
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // Estados semánticos
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        // Sidebar
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          accent: "hsl(var(--sidebar-accent))",
        },
        // Charts
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--accent) / 0.4)" },
          "50%": { boxShadow: "0 0 20px 5px hsl(var(--accent) / 0.2)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in-from-bottom 0.4s ease-out",
        "pulse-glow": "pulse-glow 2s infinite",
      },
    },
  },
} satisfies Config;
```

## Responsive Design

### Breakpoints de Tailwind

| Breakpoint | Ancho | Uso |
|------------|-------|-----|
| `sm` | 640px | Móviles grandes |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Pantallas grandes |

### Patrones Comunes

```tsx
// Grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Ocultar en móvil
<div className="hidden md:block">

// Texto responsive
<h1 className="text-2xl md:text-4xl">

// Padding responsive
<div className="p-4 md:p-6 lg:p-8">
```

## Scrollbar Personalizado

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-muted rounded-full;
}

::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/30 rounded-full hover:bg-muted-foreground/50;
}
```

## Tipografía

- **Fuente principal**: Inter
- **Fallbacks**: system-ui, sans-serif
- **Importación**: Google Fonts

```css
body {
  font-family: 'Inter', system-ui, sans-serif;
}
```

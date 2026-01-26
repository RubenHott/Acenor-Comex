# Librería UI (shadcn/ui)

El proyecto utiliza [shadcn/ui](https://ui.shadcn.com/) como librería de componentes base.

## Componentes Disponibles

Todos los componentes están en `src/components/ui/`:

### Formularios

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| Button | `button.tsx` | Botón con variantes |
| Input | `input.tsx` | Campo de texto |
| Textarea | `textarea.tsx` | Área de texto |
| Select | `select.tsx` | Selector desplegable |
| Checkbox | `checkbox.tsx` | Casilla de verificación |
| Radio Group | `radio-group.tsx` | Grupo de opciones |
| Switch | `switch.tsx` | Toggle on/off |
| Slider | `slider.tsx` | Control deslizante |
| Form | `form.tsx` | Integración con react-hook-form |
| Label | `label.tsx` | Etiqueta de campo |
| Input OTP | `input-otp.tsx` | Entrada de código OTP |

### Layout

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| Card | `card.tsx` | Contenedor con borde |
| Separator | `separator.tsx` | Línea divisoria |
| Aspect Ratio | `aspect-ratio.tsx` | Mantiene proporción |
| Scroll Area | `scroll-area.tsx` | Área con scroll |
| Resizable | `resizable.tsx` | Paneles redimensionables |
| Sidebar | `sidebar.tsx` | Barra lateral |

### Navegación

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| Tabs | `tabs.tsx` | Pestañas |
| Navigation Menu | `navigation-menu.tsx` | Menú de navegación |
| Menubar | `menubar.tsx` | Barra de menú |
| Breadcrumb | `breadcrumb.tsx` | Ruta de navegación |
| Pagination | `pagination.tsx` | Paginación |

### Feedback

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| Alert | `alert.tsx` | Mensaje de alerta |
| Badge | `badge.tsx` | Etiqueta/badge |
| Progress | `progress.tsx` | Barra de progreso |
| Skeleton | `skeleton.tsx` | Loading placeholder |
| Toast | `toast.tsx` | Notificación toast |
| Toaster | `toaster.tsx` | Contenedor de toasts |
| Sonner | `sonner.tsx` | Toasts animados |

### Overlays

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| Dialog | `dialog.tsx` | Modal de diálogo |
| Alert Dialog | `alert-dialog.tsx` | Diálogo de confirmación |
| Sheet | `sheet.tsx` | Panel lateral deslizante |
| Drawer | `drawer.tsx` | Cajón inferior (móvil) |
| Popover | `popover.tsx` | Contenido emergente |
| Tooltip | `tooltip.tsx` | Tooltip informativo |
| Hover Card | `hover-card.tsx` | Tarjeta al hover |
| Context Menu | `context-menu.tsx` | Menú contextual |
| Dropdown Menu | `dropdown-menu.tsx` | Menú desplegable |
| Command | `command.tsx` | Paleta de comandos |

### Datos

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| Table | `table.tsx` | Tabla de datos |
| Avatar | `avatar.tsx` | Imagen de perfil |
| Calendar | `calendar.tsx` | Selector de fecha |
| Chart | `chart.tsx` | Gráficos (Recharts) |
| Carousel | `carousel.tsx` | Carrusel de items |

### Disclosure

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| Accordion | `accordion.tsx` | Acordeón colapsable |
| Collapsible | `collapsible.tsx` | Contenido colapsable |
| Toggle | `toggle.tsx` | Botón toggle |
| Toggle Group | `toggle-group.tsx` | Grupo de toggles |

## Ejemplos de Uso

### Button

```tsx
import { Button } from '@/components/ui/button';

// Variantes
<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Tamaños
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>
    Contenido principal
  </CardContent>
  <CardFooter>
    <Button>Acción</Button>
  </CardFooter>
</Card>
```

### Table

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>Estado</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Item 1</TableCell>
      <TableCell>Activo</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Dialog

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título del Modal</DialogTitle>
      <DialogDescription>Descripción</DialogDescription>
    </DialogHeader>
    <div>Contenido</div>
    <DialogFooter>
      <Button>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form con React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

function MyForm() {
  const form = useForm();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Enviar</Button>
      </form>
    </Form>
  );
}
```

### Toast

```tsx
import { useToast } from '@/hooks/use-toast';

function Component() {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: 'Éxito',
      description: 'La operación se completó correctamente',
    });
  };

  // Variantes
  toast({ variant: 'destructive', title: 'Error' });
}
```

## Personalización

### Colores del Sistema

Los componentes usan las variables CSS definidas en `index.css`:

```css
:root {
  --primary: 215 60% 25%;      /* Navy Blue */
  --secondary: 215 15% 92%;    /* Slate */
  --accent: 38 92% 50%;        /* Amber */
  --destructive: 0 72% 51%;    /* Rojo */
  --success: 142 71% 45%;      /* Verde */
  --warning: 25 95% 53%;       /* Naranja */
  --info: 199 89% 48%;         /* Azul Info */
}
```

### Extensiones en Tailwind

```typescript
// tailwind.config.ts
colors: {
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
}
```

## Referencia Oficial

Para documentación detallada de cada componente, visita:
- [shadcn/ui Documentation](https://ui.shadcn.com/docs/components)
- [Radix UI Primitives](https://www.radix-ui.com/docs/primitives)

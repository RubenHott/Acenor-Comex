import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreateWorkOrder } from '@/hooks/useWorkOrders';

export default function CreateWorkOrderPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createMutation = useCreateWorkOrder();
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: '',
    tipoTrabajo: '',
    area: '',
    solicitante: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.titulo || !formData.descripcion || !formData.prioridad || 
        !formData.tipoTrabajo || !formData.area || !formData.solicitante) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos obligatorios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Edge function generates codigo and fecha_limite server-side
      await createMutation.mutateAsync({
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        prioridad: formData.prioridad,
        tipo_trabajo: formData.tipoTrabajo,
        area: formData.area,
        solicitante: formData.solicitante,
      });
      
      toast({
        title: 'Orden de trabajo creada',
        description: 'La OT se ha creado exitosamente.',
      });
      
      navigate('/work-orders/orders');
    } catch (error) {
      console.error('Error creating work order:', error);
      toast({
        title: 'Error al crear la orden',
        description: 'Ocurrió un error al guardar la orden de trabajo.',
        variant: 'destructive',
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isSubmitting = createMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/work-orders/orders">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nueva Orden de Trabajo</h1>
          <p className="text-muted-foreground">Completa los datos para crear una nueva OT</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    placeholder="Ej: Reparación de compresor principal"
                    value={formData.titulo}
                    onChange={(e) => handleChange('titulo', e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción *</Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Describe detalladamente el trabajo a realizar..."
                    value={formData.descripcion}
                    onChange={(e) => handleChange('descripcion', e.target.value)}
                    rows={4}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="solicitante">Solicitante *</Label>
                  <Input
                    id="solicitante"
                    placeholder="Nombre del solicitante"
                    value={formData.solicitante}
                    onChange={(e) => handleChange('solicitante', e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Clasificación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Prioridad *</Label>
                  <Select 
                    value={formData.prioridad} 
                    onValueChange={(v) => handleChange('prioridad', v)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Trabajo *</Label>
                  <Select 
                    value={formData.tipoTrabajo} 
                    onValueChange={(v) => handleChange('tipoTrabajo', v)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="correctivo">Correctivo</SelectItem>
                      <SelectItem value="preventivo">Preventivo</SelectItem>
                      <SelectItem value="mejora">Mejora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Área *</Label>
                  <Select 
                    value={formData.area} 
                    onValueChange={(v) => handleChange('area', v)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar área" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Producción">Producción</SelectItem>
                      <SelectItem value="Envasado">Envasado</SelectItem>
                      <SelectItem value="Almacén">Almacén</SelectItem>
                      <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="Calidad">Calidad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full bg-success hover:bg-success/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Orden de Trabajo
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

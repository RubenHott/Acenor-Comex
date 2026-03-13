import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, X, Plus, Anchor, Check } from 'lucide-react';
import { useActiveMolinos } from '@/hooks/useMolinos';
import { usePuertos, useCreatePuerto, type Puerto } from '@/hooks/usePuertos';
import { AddFabricaMolinoDialog } from './AddFabricaMolinoDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ContractConditionsData {
  condicionPrecio: string;
  fechaEmbarqueInicio: Date | undefined;
  fechaEmbarqueFin: Date | undefined;
  origen: string;
  fabricasOrigen: string;
  molinoId: string;
  notasPago: string;
  puertosDestino: string[];
}

interface PIMContractConditionsProps {
  data: ContractConditionsData;
  onChange: (data: ContractConditionsData) => void;
  onMolinoCreated?: (molinoId: string) => void;
}

const PRECIO_OPTIONS = [
  { value: 'CFR San Antonio, Chile', label: 'CFR San Antonio, Chile' },
  { value: 'CFR FO San Antonio - Valparaíso, TPS', label: 'CFR FO San Antonio - Valparaíso, TPS' },
  { value: 'CIF San Antonio, Chile', label: 'CIF San Antonio, Chile' },
  { value: 'FOB Origen', label: 'FOB Origen' },
  { value: 'CIF Valparaíso, Chile', label: 'CIF Valparaíso, Chile' },
  { value: 'DAP Destino', label: 'DAP Destino' },
  { value: 'DDP Destino', label: 'DDP Destino' },
  { value: 'FAS Puerto Origen', label: 'FAS Puerto Origen' },
  { value: 'EXW Fábrica', label: 'EXW Fábrica' },
  { value: 'CPT Destino', label: 'CPT Destino' },
  { value: 'CIP Destino', label: 'CIP Destino' },
  { value: '__custom__', label: '+ Crear nueva condición...' },
];

const ORIGEN_OPTIONS = [
  { value: 'China', label: 'China' },
  { value: 'Taiwán', label: 'Taiwán' },
  { value: 'Corea del Sur', label: 'Corea del Sur' },
  { value: 'India', label: 'India' },
  { value: 'Japón', label: 'Japón' },
  { value: 'Alemania', label: 'Alemania' },
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'Brasil', label: 'Brasil' },
  { value: 'Turquía', label: 'Turquía' },
  { value: '__custom__', label: '+ Otro país...' },
];

export function PIMContractConditions({
  data,
  onChange,
  onMolinoCreated,
}: PIMContractConditionsProps) {
  const { data: molinos } = useActiveMolinos();
  const { data: puertos } = usePuertos();
  const createPuerto = useCreatePuerto();
  const [showCustomPrecio, setShowCustomPrecio] = useState(false);
  const [customPrecio, setCustomPrecio] = useState('');
  const [showCustomOrigen, setShowCustomOrigen] = useState(false);
  const [customOrigen, setCustomOrigen] = useState('');
  const [showAddPuerto, setShowAddPuerto] = useState(false);
  const [newPuertoNombre, setNewPuertoNombre] = useState('');
  const [puertosOpen, setPuertosOpen] = useState(false);

  const handleChange = <K extends keyof ContractConditionsData>(
    field: K,
    value: ContractConditionsData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const handlePrecioSelect = (v: string) => {
    if (v === '__custom__') {
      setShowCustomPrecio(true);
      return;
    }
    handleChange('condicionPrecio', v);
  };

  const handleCustomPrecioConfirm = () => {
    if (customPrecio.trim()) {
      handleChange('condicionPrecio', customPrecio.trim());
      setShowCustomPrecio(false);
      setCustomPrecio('');
    }
  };

  const handleOrigenSelect = (v: string) => {
    if (v === '__custom__') {
      setShowCustomOrigen(true);
      return;
    }
    handleChange('origen', v);
  };

  const handleCustomOrigenConfirm = () => {
    if (customOrigen.trim()) {
      handleChange('origen', customOrigen.trim());
      setShowCustomOrigen(false);
      setCustomOrigen('');
    }
  };

  const togglePuerto = (puertoId: string) => {
    const current = data.puertosDestino || [];
    const next = current.includes(puertoId)
      ? current.filter((id) => id !== puertoId)
      : [...current, puertoId];
    onChange({ ...data, puertosDestino: next });
  };

  const removePuerto = (puertoId: string) => {
    onChange({ ...data, puertosDestino: (data.puertosDestino || []).filter((id) => id !== puertoId) });
  };

  const handleAddPuerto = async () => {
    if (!newPuertoNombre.trim()) return;
    try {
      const created = await createPuerto.mutateAsync({ nombre: newPuertoNombre.trim() });
      onChange({ ...data, puertosDestino: [...(data.puertosDestino || []), created.id] });
      setNewPuertoNombre('');
      setShowAddPuerto(false);
      toast.success(`Puerto "${created.nombre}" creado`);
    } catch {
      toast.error('Error al crear el puerto');
    }
  };

  const formatDateRange = () => {
    const parts: string[] = [];
    if (data.fechaEmbarqueInicio) parts.push(format(data.fechaEmbarqueInicio, 'MMM yyyy', { locale: es }));
    if (data.fechaEmbarqueFin) parts.push(format(data.fechaEmbarqueFin, 'MMM yyyy', { locale: es }));
    return parts.join(' - ') || '';
  };

  // Check if condicionPrecio is a custom value (not in predefined list)
  const isCustomPrecio = data.condicionPrecio && !PRECIO_OPTIONS.some(o => o.value === data.condicionPrecio);
  const isCustomOrigen = data.origen && !ORIGEN_OPTIONS.some(o => o.value === data.origen);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h4 className="font-semibold text-sm text-foreground">
          Condiciones del Contrato
        </h4>
        <Separator className="flex-1" />
      </div>

      {/* Condición de Precio */}
      <div className="space-y-2">
        <Label htmlFor="condicionPrecio">Condición de Precio (Incoterm)</Label>
        {showCustomPrecio ? (
          <div className="flex gap-2">
            <Input
              placeholder="Ej: CFR FO Valparaíso, Chile"
              value={customPrecio}
              onChange={(e) => setCustomPrecio(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomPrecioConfirm()}
              autoFocus
            />
            <Button size="sm" onClick={handleCustomPrecioConfirm} disabled={!customPrecio.trim()}>
              OK
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCustomPrecio(false)}>
              ✕
            </Button>
          </div>
        ) : (
          <>
            {isCustomPrecio ? (
              <div className="flex gap-2 items-center">
                <Input value={data.condicionPrecio} readOnly className="flex-1" />
                <Button size="sm" variant="outline" onClick={() => handleChange('condicionPrecio', '')}>
                  Cambiar
                </Button>
              </div>
            ) : (
              <Select
                value={data.condicionPrecio}
                onValueChange={handlePrecioSelect}
              >
                <SelectTrigger id="condicionPrecio">
                  <SelectValue placeholder="Seleccionar Incoterm" />
                </SelectTrigger>
                <SelectContent>
                  {PRECIO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        )}
        <p className="text-xs text-muted-foreground">
          Carga suelta: Liner Out Place of Rest | Contenedores: FCL/FCL CY/CY
        </p>
      </div>

      {/* Fecha de Embarque - Calendar range */}
      <div className="space-y-2">
        <Label>Fecha de Embarque</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Desde</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !data.fechaEmbarqueInicio && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.fechaEmbarqueInicio
                    ? format(data.fechaEmbarqueInicio, 'dd MMM yyyy', { locale: es })
                    : 'Seleccionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.fechaEmbarqueInicio}
                  onSelect={(d) => handleChange('fechaEmbarqueInicio', d)}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Hasta</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !data.fechaEmbarqueFin && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.fechaEmbarqueFin
                    ? format(data.fechaEmbarqueFin, 'dd MMM yyyy', { locale: es })
                    : 'Seleccionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.fechaEmbarqueFin}
                  onSelect={(d) => handleChange('fechaEmbarqueFin', d)}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Embarques posteriores al plazo requieren autorización expresa
        </p>
      </div>

      {/* Origen */}
      <div className="space-y-2">
        <Label htmlFor="origen">País de Origen</Label>
        {showCustomOrigen ? (
          <div className="flex gap-2">
            <Input
              placeholder="Nombre del país"
              value={customOrigen}
              onChange={(e) => setCustomOrigen(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomOrigenConfirm()}
              autoFocus
            />
            <Button size="sm" onClick={handleCustomOrigenConfirm} disabled={!customOrigen.trim()}>
              OK
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCustomOrigen(false)}>
              ✕
            </Button>
          </div>
        ) : (
          <>
            {isCustomOrigen ? (
              <div className="flex gap-2 items-center">
                <Input value={data.origen} readOnly className="flex-1" />
                <Button size="sm" variant="outline" onClick={() => handleChange('origen', '')}>
                  Cambiar
                </Button>
              </div>
            ) : (
              <Select
                value={data.origen}
                onValueChange={handleOrigenSelect}
              >
                <SelectTrigger id="origen">
                  <SelectValue placeholder="Seleccionar país de origen" />
                </SelectTrigger>
                <SelectContent>
                  {ORIGEN_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        )}
      </div>

      {/* Fábricas / Molinos */}
      <div className="space-y-2">
        <Label htmlFor="molinoId">Fábrica / Molino Autorizado</Label>
        <div className="flex gap-2 items-center">
          <Select
            value={data.molinoId || '__none__'}
            onValueChange={(v) => handleChange('molinoId', v === '__none__' ? '' : v)}
          >
            <SelectTrigger id="molinoId" className="flex-1">
              <SelectValue placeholder="Seleccionar fábrica/molino" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin fábrica asignada</SelectItem>
              {(molinos ?? []).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.codigo} — {m.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AddFabricaMolinoDialog
            onMolinoCreated={(id) => {
              handleChange('molinoId', id);
              onMolinoCreated?.(id);
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Seleccione la fábrica o molino autorizado para este PIM
        </p>
      </div>

      {/* Puertos de Destino */}
      <div className="space-y-2">
        <Label>Puertos de Destino</Label>
        {/* Selected ports badges */}
        {(data.puertosDestino || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1">
            {(data.puertosDestino || []).map((pid) => {
              const p = puertos?.find((x) => x.id === pid);
              return (
                <Badge key={pid} variant="secondary" className="flex items-center gap-1 pr-1">
                  <Anchor className="h-3 w-3" />
                  {p?.nombre || pid}
                  <button
                    type="button"
                    onClick={() => removePuerto(pid)}
                    className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Dropdown */}
        <Popover open={puertosOpen} onOpenChange={setPuertosOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <Anchor className="h-4 w-4 mr-2 text-muted-foreground" />
              {(data.puertosDestino || []).length > 0
                ? `${(data.puertosDestino || []).length} puerto${(data.puertosDestino || []).length !== 1 ? 's' : ''} seleccionado${(data.puertosDestino || []).length !== 1 ? 's' : ''}`
                : 'Seleccionar puertos...'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-2" align="start">
            <div className="max-h-[200px] overflow-y-auto space-y-0.5">
              {(puertos || []).map((p) => {
                const isChecked = (data.puertosDestino || []).includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePuerto(p.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors text-left',
                      isChecked && 'bg-primary/10'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                      isChecked ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                    )}>
                      {isChecked && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span>{p.nombre}</span>
                    {p.codigo && <span className="text-xs text-muted-foreground ml-auto">{p.codigo}</span>}
                  </button>
                );
              })}
            </div>

            <Separator className="my-2" />

            {showAddPuerto ? (
              <div className="flex gap-1.5">
                <Input
                  placeholder="Nombre del puerto"
                  value={newPuertoNombre}
                  onChange={(e) => setNewPuertoNombre(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPuerto()}
                  autoFocus
                  className="h-8 text-sm"
                />
                <Button size="sm" className="h-8" onClick={handleAddPuerto} disabled={!newPuertoNombre.trim() || createPuerto.isPending}>
                  OK
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setShowAddPuerto(false); setNewPuertoNombre(''); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setShowAddPuerto(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Agregar nuevo puerto
              </Button>
            )}
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Seleccione uno o mas puertos de destino en Chile
        </p>
      </div>

      {/* Notas de Pago */}
      <div className="space-y-2">
        <Label htmlFor="notasPago">Notas Adicionales de Pago</Label>
        <Textarea
          id="notasPago"
          placeholder="Ej: 100% Carta de Crédito a ser abierta 10 días después de firmado el contrato..."
          value={data.notasPago}
          onChange={(e) => handleChange('notasPago', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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
import { CalendarIcon } from 'lucide-react';
import { useActiveMolinos } from '@/hooks/useMolinos';
import { AddFabricaMolinoDialog } from './AddFabricaMolinoDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface ContractConditionsData {
  condicionPrecio: string;
  fechaEmbarqueInicio: Date | undefined;
  fechaEmbarqueFin: Date | undefined;
  origen: string;
  fabricasOrigen: string;
  molinoId: string;
  notasPago: string;
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
  const [showCustomPrecio, setShowCustomPrecio] = useState(false);
  const [customPrecio, setCustomPrecio] = useState('');
  const [showCustomOrigen, setShowCustomOrigen] = useState(false);
  const [customOrigen, setCustomOrigen] = useState('');

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

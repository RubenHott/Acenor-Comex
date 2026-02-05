import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export interface ContractConditionsData {
  condicionPrecio: string;
  fechaEmbarque: string;
  origen: string;
  fabricasOrigen: string;
  notasPago: string;
}

interface PIMContractConditionsProps {
  data: ContractConditionsData;
  onChange: (data: ContractConditionsData) => void;
}

const PRECIO_OPTIONS = [
  { value: 'cfr_san_antonio', label: 'CFR San Antonio, Chile' },
  { value: 'cfr_fo_san_antonio', label: 'CFR FO San Antonio - Valparaiso, TPS' },
  { value: 'cif_san_antonio', label: 'CIF San Antonio, Chile' },
  { value: 'fob_origen', label: 'FOB Origen' },
  { value: 'otro', label: 'Otro (especificar en notas)' },
];

const ORIGEN_OPTIONS = [
  { value: 'china', label: 'China' },
  { value: 'taiwan', label: 'Taiwán' },
  { value: 'corea', label: 'Corea del Sur' },
  { value: 'india', label: 'India' },
  { value: 'europa', label: 'Europa' },
  { value: 'otro', label: 'Otro' },
];

export function PIMContractConditions({
  data,
  onChange,
}: PIMContractConditionsProps) {
  const handleChange = <K extends keyof ContractConditionsData>(
    field: K,
    value: ContractConditionsData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

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
        <Label htmlFor="condicionPrecio">Condición de Precio</Label>
        <Select
          value={data.condicionPrecio}
          onValueChange={(v) => handleChange('condicionPrecio', v)}
        >
          <SelectTrigger id="condicionPrecio">
            <SelectValue placeholder="Seleccionar condición de precio" />
          </SelectTrigger>
          <SelectContent>
            {PRECIO_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Carga suelta: Liner Out Place of Rest | Contenedores: FCL/FCL CY/CY
        </p>
      </div>

      {/* Fecha de Embarque */}
      <div className="space-y-2">
        <Label htmlFor="fechaEmbarque">Fecha de Embarque</Label>
        <Input
          id="fechaEmbarque"
          placeholder="Ej: Oct-Nov 2025"
          value={data.fechaEmbarque}
          onChange={(e) => handleChange('fechaEmbarque', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Embarques posteriores al plazo requieren autorización expresa
        </p>
      </div>

      {/* Origen */}
      <div className="space-y-2">
        <Label htmlFor="origen">País de Origen</Label>
        <Select
          value={data.origen}
          onValueChange={(v) => handleChange('origen', v)}
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
      </div>

      {/* Fábricas / Molinos */}
      <div className="space-y-2">
        <Label htmlFor="fabricasOrigen">Fábricas / Molinos Autorizados</Label>
        <Textarea
          id="fabricasOrigen"
          placeholder="Ej: RNAV (Yanshan-Benxi), PGR (Yingkou), RLF (Jingye, Tiantie)..."
          value={data.fabricasOrigen}
          onChange={(e) => handleChange('fabricasOrigen', e.target.value)}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Separar múltiples fábricas por categoría de producto
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

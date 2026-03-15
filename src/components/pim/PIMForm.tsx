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
import { AddSupplierDialog } from './AddSupplierDialog';
import type { Supplier } from '@/hooks/useSuppliers';

export interface PIMFormData {
  descripcion: string;
  proveedorId: string;
  modalidadPago: 'carta_credito' | 'anticipo' | 'contado' | 'mixto';
  diasCredito: number | null;
  porcentajeAnticipo: number | null;
  codigoCorrelativo: string;
}

interface PIMFormProps {
  formData: PIMFormData;
  onFormDataChange: (data: PIMFormData) => void;
  suppliers: Supplier[];
  isLoadingSuppliers?: boolean;
}

export function PIMForm({
  formData,
  onFormDataChange,
  suppliers,
  isLoadingSuppliers = false,
}: PIMFormProps) {
  const activeSuppliers = suppliers.filter((s) => s.activo !== false);

  const handleChange = <K extends keyof PIMFormData>(
    field: K,
    value: PIMFormData[K]
  ) => {
    const updated = { ...formData, [field]: value };
    // Reset conditional fields when modalidad changes
    if (field === 'modalidadPago') {
      if (value === 'carta_credito') {
        updated.porcentajeAnticipo = null;
      } else if (value === 'anticipo' || value === 'contado') {
        updated.diasCredito = null;
      }
      if (value === 'contado') {
        updated.diasCredito = null;
        updated.porcentajeAnticipo = null;
      }
    }
    onFormDataChange(updated);
  };

  const handleSupplierCreated = (supplierId: string) => {
    handleChange('proveedorId', supplierId);
  };

  return (
    <div className="space-y-6">
      {/* Correlativo Empresa */}
      <div className="space-y-2">
        <Label htmlFor="codigoCorrelativo">Correlativo Empresa</Label>
        <Input
          id="codigoCorrelativo"
          placeholder="Ej: OC-2025-042, IMP-389"
          value={formData.codigoCorrelativo}
          onChange={(e) => handleChange('codigoCorrelativo', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Número o código interno de la empresa para este proceso.</p>
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción del PIM *</Label>
        <Textarea
          id="descripcion"
          placeholder="Ej: Cierre de materia prima para producción de enero"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          rows={3}
        />
      </div>

      {/* Proveedor with inline add */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="proveedor">Proveedor (Trader) *</Label>
          <AddSupplierDialog onSupplierCreated={handleSupplierCreated} />
        </div>
        <Select
          value={formData.proveedorId}
          onValueChange={(v) => handleChange('proveedorId', v)}
          disabled={isLoadingSuppliers}
        >
          <SelectTrigger id="proveedor">
            <SelectValue placeholder="Seleccionar proveedor" />
          </SelectTrigger>
          <SelectContent>
            {activeSuppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nombre} ({s.pais})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Modalidad de Pago */}
      <div className="space-y-2">
        <Label htmlFor="modalidad">Modalidad de Pago *</Label>
        <Select
          value={formData.modalidadPago}
          onValueChange={(v) =>
            handleChange('modalidadPago', v as PIMFormData['modalidadPago'])
          }
        >
          <SelectTrigger id="modalidad">
            <SelectValue placeholder="Seleccionar modalidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="carta_credito">Carta de Crédito</SelectItem>
            <SelectItem value="anticipo">Anticipo</SelectItem>
            <SelectItem value="contado">Contado</SelectItem>
            <SelectItem value="mixto">Mixto (Anticipo + Crédito)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditional: Días Crédito */}
      {(formData.modalidadPago === 'carta_credito' ||
        formData.modalidadPago === 'mixto') && (
        <div className="space-y-2">
          <Label htmlFor="diasCredito">Días de Crédito</Label>
          <Input
            id="diasCredito"
            type="number"
            min={0}
            max={365}
            placeholder="Ej: 90"
            value={formData.diasCredito ?? ''}
            onChange={(e) =>
              handleChange(
                'diasCredito',
                e.target.value ? parseInt(e.target.value, 10) : null
              )
            }
          />
        </div>
      )}

      {/* Conditional: % Anticipo */}
      {(formData.modalidadPago === 'anticipo' ||
        formData.modalidadPago === 'mixto') && (
        <div className="space-y-2">
          <Label htmlFor="porcentajeAnticipo">Porcentaje de Anticipo (%)</Label>
          <Input
            id="porcentajeAnticipo"
            type="number"
            min={0}
            max={100}
            step={0.5}
            placeholder="Ej: 30"
            value={formData.porcentajeAnticipo ?? ''}
            onChange={(e) =>
              handleChange(
                'porcentajeAnticipo',
                e.target.value ? parseFloat(e.target.value) : null
              )
            }
          />
        </div>
      )}
    </div>
  );
}

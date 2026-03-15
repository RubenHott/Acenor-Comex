import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Download } from 'lucide-react';
import type { PIMTrackingInfo } from '@/hooks/useTrackingDashboard';

interface PIMRow {
  id: string;
  codigo: string;
  codigo_correlativo?: string | null;
  descripcion: string;
  estado: string;
  proveedor_nombre: string | null;
  total_usd: number;
  total_toneladas: number;
  cuadroNombre: string | null;
  origen: string | null;
  fecha_embarque: string | null;
  fecha_creacion: string | null;
  molino_nombre?: string | null;
  modalidad_pago?: string | null;
  condicion_precio?: string | null;
  fecha_contrato?: string | null;
  numero_contrato?: string | null;
  porcentaje_anticipo?: number | null;
  puerto?: string | null;
  items?: {
    codigo_producto: string;
    descripcion: string;
    unidad: string;
    cantidad: number;
    toneladas: number;
    precio_unitario_usd: number;
    total_usd: number;
    espesor?: number | null;
    familia?: string | null;
    ancho?: number | null;
  }[];
}

interface Props {
  pims: PIMRow[];
  trackingMap?: Map<string, PIMTrackingInfo>;
}

const ESTADO_COLORS: Record<string, string> = {
  creado: 'bg-gray-100 text-gray-700',
  en_negociacion: 'bg-yellow-100 text-yellow-800',
  contrato_validado: 'bg-blue-100 text-blue-800',
  en_produccion: 'bg-purple-100 text-purple-800',
  en_transito: 'bg-orange-100 text-orange-800',
  en_puerto: 'bg-cyan-100 text-cyan-800',
  en_aduana: 'bg-teal-100 text-teal-800',
  cerrado: 'bg-green-100 text-green-800',
};

const ESTADO_LABELS: Record<string, string> = {
  creado: 'CREADO',
  en_negociacion: 'EN NEGOCIACIÓN',
  contrato_validado: 'CONTRATO VALIDADO',
  en_produccion: 'EN PRODUCCIÓN',
  en_transito: 'EN TRÁNSITO',
  en_puerto: 'EN PUERTO',
  en_aduana: 'EN ADUANA',
  cerrado: 'CERRADO',
};

const MODALIDAD_LABELS: Record<string, string> = {
  carta_credito: 'Carta de Crédito',
  pago_contado: 'Pago al Contado',
  anticipo: 'Anticipo + Saldo',
  mixto: 'Mixto',
};

const SLA_COLORS: Record<string, string> = {
  verde: 'bg-green-500',
  amarillo: 'bg-yellow-400',
  rojo: 'bg-red-500',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  pagado: 'Pagado',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-gray-100 text-gray-700',
  en_proceso: 'bg-yellow-100 text-yellow-800',
  pagado: 'bg-green-100 text-green-800',
};

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

/** Parse a date-range string like "2025-01-15 - 2025-03-20" and return the latest date */
function parseMaxDate(d: string | null | undefined): string {
  if (!d) return '—';
  const parts = d.split(' - ');
  let max: Date | null = null;
  for (const p of parts) {
    const date = new Date(p.trim());
    if (!isNaN(date.getTime()) && (!max || date > max)) max = date;
  }
  if (!max) return '—';
  return max.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtUSD(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function fmtTon(n: number): string {
  return n.toLocaleString('es-CL', { maximumFractionDigits: 1 });
}

interface FlatRow {
  pimId: string;
  correlativo: string;
  pim: string;
  lote: string;
  proveedor: string;
  producto: string;
  codigo: string;
  unidad: string;
  cantidad: number;
  toneladas: number;
  precioUSD: number;
  totalItemUSD: number;
  // Product master data
  familia: string;
  espesor: number | null;
  ancho: number | null;
  // PIM-level
  estado: string;
  origen: string;
  molino: string;
  modalidadPago: string;
  totalPimUSD: number;
  totalPimTon: number;
  fechaCreacion: string;
  fechaContrato: string;
  fechaEmbarque: string;
  cuadro: string;
  condicionPrecio: string;
  nroContrato: string;
  porcentajeAnticipo: string;
  puerto: string;
  // Payment calculated
  pagoAnticipo: number;
  pagoSaldo: number;
  statusPago: string;
  // Logistics (from tracking)
  nroBl: string;
  vapor: string;
  nroInvoice: string;
  fechaEmbarqueReal: string;
  fechaArribo: string;
  derechosUsd: number | null;
  // Tracking
  etapaActual: string;
  pasoActual: string;
  progreso: string;
  diasProceso: number;
  sla: string;
  slaColor: string;
  allComplete: boolean;
  responsable: string;
  area: string;
  // For grouping
  isFirstOfPim: boolean;
  rowSpan: number;
}

export function PIMSpreadsheetView({ pims, trackingMap }: Props) {
  const navigate = useNavigate();

  const flatRows = useMemo(() => {
    const rows: FlatRow[] = [];

    for (const pim of pims) {
      const tracking = trackingMap?.get(pim.id);
      const items = pim.items || [];
      const rowCount = Math.max(items.length, 1);

      // Payment calculations
      const anticipo = pim.porcentaje_anticipo != null && pim.total_usd
        ? pim.total_usd * pim.porcentaje_anticipo / 100
        : 0;
      const saldo = anticipo > 0 ? pim.total_usd - anticipo : 0;

      const pimBase = {
        pimId: pim.id,
        correlativo: pim.codigo_correlativo || pim.codigo,
        pim: pim.codigo,
        proveedor: pim.proveedor_nombre || '—',
        estado: pim.estado,
        origen: pim.origen || '—',
        molino: pim.molino_nombre || '—',
        modalidadPago: MODALIDAD_LABELS[pim.modalidad_pago || ''] || pim.modalidad_pago || '—',
        totalPimUSD: pim.total_usd,
        totalPimTon: pim.total_toneladas,
        fechaCreacion: fmtDate(pim.fecha_creacion),
        fechaContrato: fmtDate(pim.fecha_contrato),
        fechaEmbarque: parseMaxDate(pim.fecha_embarque),
        cuadro: pim.cuadroNombre || '—',
        condicionPrecio: pim.condicion_precio || '—',
        nroContrato: pim.numero_contrato || '—',
        porcentajeAnticipo: pim.porcentaje_anticipo != null ? `${pim.porcentaje_anticipo}%` : '—',
        puerto: pim.puerto || '—',
        // Payment
        pagoAnticipo: anticipo,
        pagoSaldo: saldo,
        statusPago: tracking?.paymentStatus || 'pendiente',
        // Logistics
        nroBl: tracking?.nroBl || '—',
        vapor: tracking?.vapor || '—',
        nroInvoice: tracking?.nroInvoice || '—',
        fechaEmbarqueReal: fmtDate(tracking?.fechaEmbarqueReal),
        fechaArribo: fmtDate(tracking?.fechaArribo),
        derechosUsd: tracking?.derechosUsd ?? null,
        // Tracking
        etapaActual: tracking?.allComplete ? 'COMPLETADO' : tracking?.currentStageName || 'Sin seguimiento',
        pasoActual: tracking?.allComplete ? '—' : tracking?.currentStepName || '—',
        progreso: tracking ? `${tracking.completedSteps}/${tracking.totalSteps}` : '—',
        diasProceso: tracking?.diasEnProceso || 0,
        sla: tracking?.slaStatus || 'verde',
        slaColor: SLA_COLORS[tracking?.slaStatus || 'verde'],
        allComplete: tracking?.allComplete || false,
        responsable: tracking?.responsable || '—',
        area: tracking?.departamento || '—',
      };

      if (items.length === 0) {
        rows.push({
          ...pimBase,
          lote: pim.codigo,
          producto: '—',
          codigo: '—',
          unidad: '—',
          cantidad: 0,
          toneladas: 0,
          precioUSD: 0,
          totalItemUSD: 0,
          familia: '—',
          espesor: null,
          ancho: null,
          isFirstOfPim: true,
          rowSpan: 1,
        });
      } else {
        items.forEach((item, idx) => {
          rows.push({
            ...pimBase,
            lote: pim.codigo,
            producto: item.descripcion,
            codigo: item.codigo_producto,
            unidad: item.unidad,
            cantidad: item.cantidad,
            toneladas: item.toneladas,
            precioUSD: item.precio_unitario_usd,
            totalItemUSD: item.total_usd,
            familia: item.familia || '—',
            espesor: item.espesor ?? null,
            ancho: item.ancho ?? null,
            isFirstOfPim: idx === 0,
            rowSpan: rowCount,
          });
        });
      }
    }

    return rows;
  }, [pims, trackingMap]);

  // Column definitions grouped like the Excel
  const columns = [
    // PIM Info
    { key: 'correlativo', label: 'CORRELATIVO', width: 120, sticky: true, pimLevel: true },
    { key: 'pim', label: 'PIM (AUTO)', width: 100, pimLevel: true },
    { key: 'estado', label: 'STATUS', width: 140, pimLevel: true },
    { key: 'proveedor', label: 'PROV', width: 130, pimLevel: true },
    { key: 'origen', label: 'ORIGEN', width: 90, pimLevel: true },
    { key: 'molino', label: 'MOLINO', width: 110, pimLevel: true },
    { key: 'cuadro', label: 'CUADRO', width: 90, pimLevel: true },
    { key: 'puerto', label: 'PUERTO', width: 120, pimLevel: true },
    // Product details
    { key: 'codigo', label: 'CÓDIGO', width: 120 },
    { key: 'producto', label: 'PRODUCTO', width: 180 },
    { key: 'familia', label: 'FAMILIA', width: 100 },
    { key: 'espesor', label: 'ESPESOR', width: 70, numeric: true },
    { key: 'ancho', label: 'ANCHO', width: 70, numeric: true },
    { key: 'unidad', label: 'UND', width: 60 },
    { key: 'cantidad', label: 'QTY', width: 70, numeric: true },
    { key: 'toneladas', label: 'TM', width: 80, numeric: true },
    { key: 'precioUSD', label: 'USD/u', width: 90, numeric: true },
    { key: 'totalItemUSD', label: 'TOTAL USD', width: 110, numeric: true },
    // PIM totals
    { key: 'totalPimTon', label: 'TM TOTAL', width: 90, numeric: true, pimLevel: true },
    { key: 'totalPimUSD', label: 'MONTO TOTAL', width: 120, numeric: true, pimLevel: true },
    // Payment
    { key: 'modalidadPago', label: 'MOD. PAGO', width: 130, pimLevel: true },
    { key: 'condicionPrecio', label: 'CONDICIÓN', width: 100, pimLevel: true },
    { key: 'porcentajeAnticipo', label: '% ANTICIPO', width: 90, pimLevel: true },
    { key: 'pagoAnticipo', label: 'ANTICIPO USD', width: 110, numeric: true, pimLevel: true },
    { key: 'pagoSaldo', label: 'SALDO USD', width: 110, numeric: true, pimLevel: true },
    { key: 'statusPago', label: 'ST. PAGO', width: 100, pimLevel: true },
    { key: 'derechosUsd', label: 'DERECHOS', width: 100, numeric: true, pimLevel: true },
    { key: 'nroContrato', label: 'NRO CONTRATO', width: 120, pimLevel: true },
    // Logistics
    { key: 'nroBl', label: 'Nro BL', width: 130, pimLevel: true },
    { key: 'vapor', label: 'VAPOR', width: 120, pimLevel: true },
    { key: 'nroInvoice', label: 'INVOICE', width: 120, pimLevel: true },
    // Dates
    { key: 'fechaCreacion', label: 'FCH CREACIÓN', width: 110, pimLevel: true },
    { key: 'fechaContrato', label: 'FCH CONTRATO', width: 110, pimLevel: true },
    { key: 'fechaEmbarque', label: 'FCH EMBARQUE', width: 110, pimLevel: true },
    { key: 'fechaEmbarqueReal', label: 'FCH EMB. REAL', width: 110, pimLevel: true },
    { key: 'fechaArribo', label: 'FCH ARRIBO', width: 110, pimLevel: true },
    // Tracking
    { key: 'etapaActual', label: 'ETAPA ACTUAL', width: 170, pimLevel: true },
    { key: 'pasoActual', label: 'PASO ACTUAL', width: 180, pimLevel: true },
    { key: 'progreso', label: 'PROGRESO', width: 80, pimLevel: true },
    { key: 'diasProceso', label: 'DÍAS', width: 60, numeric: true, pimLevel: true },
    { key: 'sla', label: 'SLA', width: 50, pimLevel: true },
    { key: 'responsable', label: 'RESPONSABLE', width: 140, pimLevel: true },
    { key: 'area', label: 'ÁREA', width: 100, pimLevel: true },
  ] as const;

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const XLSX = await import('xlsx');

      // Build rows with all data (no hidden PIM-level cells)
      const exportData = flatRows.map((row) => {
        const obj: Record<string, string | number | null> = {};
        for (const col of columns) {
          const raw = (row as any)[col.key];
          if (col.key === 'sla') {
            obj[col.label] = raw === 'verde' ? 'OK' : raw === 'amarillo' ? 'Atención' : raw === 'rojo' ? 'Alerta' : raw;
          } else if (col.key === 'estado') {
            obj[col.label] = ESTADO_LABELS[raw] || raw;
          } else if (col.key === 'statusPago') {
            obj[col.label] = PAYMENT_STATUS_LABELS[raw] || raw;
          } else {
            obj[col.label] = raw === '—' ? '' : raw;
          }
        }
        return obj;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);

      // Auto-fit column widths
      ws['!cols'] = columns.map((col) => ({ wch: Math.max(col.label.length + 2, col.width / 8) }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Status PIMs');

      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Estatus_PIMs_${today}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting || flatRows.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exportando...' : 'Exportar Excel'}
        </Button>
      </div>
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-max min-w-full text-xs border-collapse">
          {/* Header */}
          <thead>
            <tr className="bg-[#0070C0] text-white">
              {columns.map((col, idx) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-2 py-2 text-left font-semibold whitespace-nowrap border-r border-blue-400/30',
                    col.numeric && 'text-right',
                    idx === 0 && 'sticky left-0 z-20 bg-[#0070C0]'
                  )}
                  style={{ minWidth: col.width, maxWidth: col.width * 1.5 }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {flatRows.map((row, rowIdx) => {
              const isNewPim = row.isFirstOfPim;

              // Determine the PIM group background
              let pimGroupBg = 'bg-white';
              let firstIdx = rowIdx;
              while (firstIdx > 0 && !flatRows[firstIdx].isFirstOfPim) firstIdx--;
              let pimCount = 0;
              for (let i = 0; i <= firstIdx; i++) {
                if (flatRows[i].isFirstOfPim) pimCount++;
              }
              pimGroupBg = pimCount % 2 === 0 ? 'bg-blue-50/30' : 'bg-white';

              return (
                <tr
                  key={`${row.pimId}-${rowIdx}`}
                  className={cn(
                    pimGroupBg,
                    'border-b border-border/40 hover:bg-blue-50/50 transition-colors cursor-pointer',
                    isNewPim && rowIdx > 0 && 'border-t-2 border-t-blue-200'
                  )}
                  onClick={() => navigate(`/comex/pim/${row.pimId}/tracking`)}
                >
                  {columns.map((col, colIdx) => {
                    // For PIM-level columns, only show on first row of PIM group
                    if (col.pimLevel && !isNewPim) {
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            'px-2 py-1.5 border-r border-border/20',
                            colIdx === 0 && 'sticky left-0 z-10',
                            colIdx === 0 && pimGroupBg
                          )}
                        />
                      );
                    }

                    const value = (row as any)[col.key];

                    // Special renderers
                    if (col.key === 'correlativo') {
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            'px-2 py-1.5 font-bold text-blue-700 sticky left-0 z-10 border-r border-border/20',
                            pimGroupBg
                          )}
                        >
                          {value}
                        </td>
                      );
                    }

                    if (col.key === 'pim') {
                      return (
                        <td
                          key={col.key}
                          className="px-2 py-1.5 text-xs text-muted-foreground font-mono border-r border-border/20"
                        >
                          {value}
                        </td>
                      );
                    }

                    if (col.key === 'estado') {
                      return (
                        <td key={col.key} className="px-2 py-1.5 border-r border-border/20">
                          <Badge className={cn('text-[10px] font-semibold', ESTADO_COLORS[value] || 'bg-gray-100')}>
                            {ESTADO_LABELS[value] || value}
                          </Badge>
                        </td>
                      );
                    }

                    if (col.key === 'statusPago') {
                      return (
                        <td key={col.key} className="px-2 py-1.5 border-r border-border/20">
                          <Badge className={cn('text-[10px] font-semibold', PAYMENT_STATUS_COLORS[value] || 'bg-gray-100')}>
                            {PAYMENT_STATUS_LABELS[value] || value}
                          </Badge>
                        </td>
                      );
                    }

                    if (col.key === 'sla') {
                      return (
                        <td key={col.key} className="px-2 py-1.5 text-center border-r border-border/20">
                          <div
                            className={cn('h-3 w-3 rounded-full mx-auto', row.slaColor)}
                            title={`SLA: ${value}`}
                          />
                        </td>
                      );
                    }

                    if (col.key === 'etapaActual') {
                      return (
                        <td key={col.key} className="px-2 py-1.5 border-r border-border/20">
                          <span className={cn(
                            'text-xs',
                            row.allComplete ? 'text-green-700 font-semibold' : 'text-foreground'
                          )}>
                            {value}
                          </span>
                        </td>
                      );
                    }

                    // Numeric formatting
                    if (col.numeric) {
                      let formatted = '';
                      if (col.key === 'totalItemUSD' || col.key === 'totalPimUSD' || col.key === 'pagoAnticipo' || col.key === 'pagoSaldo') {
                        formatted = typeof value === 'number' && value > 0 ? fmtUSD(value) : '—';
                      } else if (col.key === 'derechosUsd') {
                        formatted = value != null && value > 0 ? fmtUSD(value) : '—';
                      } else if (col.key === 'precioUSD') {
                        formatted = typeof value === 'number' && value > 0
                          ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
                          : '—';
                      } else if (col.key === 'toneladas' || col.key === 'totalPimTon') {
                        formatted = typeof value === 'number' && value > 0 ? fmtTon(value) : '—';
                      } else if (col.key === 'cantidad') {
                        formatted = typeof value === 'number' && value > 0 ? value.toLocaleString('es-CL') : '—';
                      } else if (col.key === 'diasProceso') {
                        formatted = value > 0 ? String(value) : '—';
                      } else if (col.key === 'espesor' || col.key === 'ancho') {
                        formatted = value != null ? String(value) : '—';
                      } else {
                        formatted = value != null ? String(value) : '—';
                      }

                      return (
                        <td
                          key={col.key}
                          className={cn(
                            'px-2 py-1.5 text-right font-mono tabular-nums border-r border-border/20',
                            col.key === 'diasProceso' && value > 10 && 'text-red-600 font-semibold'
                          )}
                        >
                          {formatted}
                        </td>
                      );
                    }

                    // Default text
                    return (
                      <td
                        key={col.key}
                        className="px-2 py-1.5 truncate border-r border-border/20"
                        style={{ maxWidth: col.width * 1.5 }}
                        title={typeof value === 'string' ? value : undefined}
                      >
                        {value || '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>

          {/* Footer totals */}
          <tfoot>
            <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold">
              {columns.map((col, colIdx) => {
                if (colIdx === 0) {
                  return (
                    <td key={col.key} className="px-2 py-2 sticky left-0 z-10 bg-gray-100 border-r border-border/20">
                      TOTAL
                    </td>
                  );
                }
                if (col.key === 'totalPimTon') {
                  const total = pims.reduce((s, p) => s + (p.total_toneladas || 0), 0);
                  return (
                    <td key={col.key} className="px-2 py-2 text-right font-mono border-r border-border/20">
                      {fmtTon(total)}
                    </td>
                  );
                }
                if (col.key === 'totalPimUSD') {
                  const total = pims.reduce((s, p) => s + (p.total_usd || 0), 0);
                  return (
                    <td key={col.key} className="px-2 py-2 text-right font-mono border-r border-border/20">
                      {fmtUSD(total)}
                    </td>
                  );
                }
                if (col.key === 'toneladas') {
                  const total = flatRows.reduce((s, r) => s + (r.toneladas || 0), 0);
                  return (
                    <td key={col.key} className="px-2 py-2 text-right font-mono border-r border-border/20">
                      {fmtTon(total)}
                    </td>
                  );
                }
                if (col.key === 'totalItemUSD') {
                  const total = flatRows.reduce((s, r) => s + (r.totalItemUSD || 0), 0);
                  return (
                    <td key={col.key} className="px-2 py-2 text-right font-mono border-r border-border/20">
                      {fmtUSD(total)}
                    </td>
                  );
                }
                if (col.key === 'pagoAnticipo') {
                  const total = flatRows.filter((r) => r.isFirstOfPim).reduce((s, r) => s + (r.pagoAnticipo || 0), 0);
                  return (
                    <td key={col.key} className="px-2 py-2 text-right font-mono border-r border-border/20">
                      {total > 0 ? fmtUSD(total) : '—'}
                    </td>
                  );
                }
                if (col.key === 'pagoSaldo') {
                  const total = flatRows.filter((r) => r.isFirstOfPim).reduce((s, r) => s + (r.pagoSaldo || 0), 0);
                  return (
                    <td key={col.key} className="px-2 py-2 text-right font-mono border-r border-border/20">
                      {total > 0 ? fmtUSD(total) : '—'}
                    </td>
                  );
                }
                if (col.key === 'derechosUsd') {
                  const total = flatRows.filter((r) => r.isFirstOfPim).reduce((s, r) => s + (r.derechosUsd || 0), 0);
                  return (
                    <td key={col.key} className="px-2 py-2 text-right font-mono border-r border-border/20">
                      {total > 0 ? fmtUSD(total) : '—'}
                    </td>
                  );
                }
                if (col.key === 'pim' || col.key === 'estado') {
                  return <td key={col.key} className="px-2 py-2 border-r border-border/20">{pims.length} PIMs</td>;
                }
                return <td key={col.key} className="px-2 py-2 border-r border-border/20" />;
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    </div>
  );
}

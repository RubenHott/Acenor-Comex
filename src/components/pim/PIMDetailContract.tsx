import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Ship,
  MapPin,
  Factory,
  CreditCard,
  CalendarDays,
  FileText,
} from 'lucide-react';
import type { PIM } from '@/hooks/usePIMs';

interface PIMDetailContractProps {
  pim: PIM;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function PIMDetailContract({ pim }: PIMDetailContractProps) {
  const fabricasDisplay = pim.molino_nombre || pim.fabricas_origen;
  const hasContractInfo = pim.condicion_precio || pim.fecha_embarque || pim.origen || fabricasDisplay || pim.notas_pago;

  if (!hasContractInfo) {
    return (
      <div className="p-4 rounded-lg border border-dashed border-border text-center text-muted-foreground text-sm">
        Sin condiciones de contrato registradas
      </div>
    );
  }

  // Parse fecha_embarque range (stored as "YYYY-MM-DD - YYYY-MM-DD" or ISO range)
  let embarqueDisplay = pim.fecha_embarque || '';
  if (embarqueDisplay) {
    try {
      const parts = embarqueDisplay.split(' - ');
      const formatted = parts.map(p => {
        const d = new Date(p.trim());
        if (isNaN(d.getTime())) return p.trim();
        return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
      });
      embarqueDisplay = formatted.join('  →  ');
    } catch {
      // keep original
    }
  }

  return (
    <div className="p-4 rounded-lg border border-border space-y-1">
      <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
        <FileText className="h-4 w-4" />
        Condiciones del Contrato
      </h4>
      <Separator className="my-2" />
      <InfoRow icon={Ship} label="Condición de Precio (Incoterm)" value={pim.condicion_precio} />
      <InfoRow icon={CalendarDays} label="Fecha de Embarque" value={embarqueDisplay} />
      <InfoRow icon={MapPin} label="País de Origen" value={pim.origen} />
      <InfoRow icon={Factory} label="Fábricas / Molinos" value={fabricasDisplay} />
      <InfoRow icon={CreditCard} label="Notas de Pago" value={pim.notas_pago} />
    </div>
  );
}

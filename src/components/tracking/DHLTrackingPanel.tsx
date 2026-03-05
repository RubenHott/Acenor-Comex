import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Truck, RefreshCw, ExternalLink, Package, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useDHLTracking } from '@/hooks/usePIMDocuments';

interface DHLEvent {
  timestamp?: string;
  location?: { address?: { addressLocality?: string; countryCode?: string } };
  description?: string;
  statusCode?: string;
}

interface Props {
  pimId: string;
  currentTrackingCode?: string | null;
  lastStatus?: string | null;
  lastCheckedAt?: string | null;
}

export function DHLTrackingPanel({
  pimId,
  currentTrackingCode,
  lastStatus,
  lastCheckedAt,
}: Props) {
  const [trackingCode, setTrackingCode] = useState(currentTrackingCode || '');
  const [events, setEvents] = useState<DHLEvent[]>([]);
  const [statusDesc, setStatusDesc] = useState(lastStatus || '');
  const dhlTracking = useDHLTracking();

  const handleTrack = async () => {
    if (!trackingCode.trim()) {
      toast.error('Ingresa un código de seguimiento');
      return;
    }
    try {
      const result = await dhlTracking.mutateAsync({
        trackingNumber: trackingCode.trim(),
        pimId,
      });
      setEvents(result.events || []);
      setStatusDesc(result.statusDescription || '');
      toast.success('Tracking actualizado');
    } catch {
      toast.error('Error al consultar DHL. Verifica el código.');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Seguimiento DHL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input + actions */}
        <div className="flex gap-2">
          <Input
            value={trackingCode}
            onChange={(e) => !currentTrackingCode && setTrackingCode(e.target.value)}
            readOnly={!!currentTrackingCode}
            placeholder="Código DHL (ej: 1234567890)"
            className={`flex-1 ${currentTrackingCode ? 'bg-muted font-mono font-medium' : ''}`}
          />
          <Button
            size="sm"
            onClick={handleTrack}
            disabled={dhlTracking.isPending}
          >
            {dhlTracking.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          {trackingCode && (
            <Button size="sm" variant="outline" asChild>
              <a
                href={`https://www.dhl.com/cl-es/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingCode}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>

        {/* Current status */}
        {statusDesc && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{statusDesc}</span>
            {lastCheckedAt && (
              <span className="text-xs text-muted-foreground ml-auto">
                Última consulta: {new Date(lastCheckedAt).toLocaleString('es-CL')}
              </span>
            )}
          </div>
        )}

        {/* Events timeline */}
        {events.length > 0 && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground">Historial de eventos:</p>
            {events.map((evt, idx) => (
              <div
                key={idx}
                className="flex gap-3 text-xs border-l-2 border-muted pl-3 py-1"
              >
                <div className="shrink-0 text-muted-foreground w-24">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {evt.timestamp
                      ? new Date(evt.timestamp).toLocaleDateString('es-CL')
                      : '—'}
                  </div>
                  {evt.timestamp && (
                    <span>{new Date(evt.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p>{evt.description || '—'}</p>
                  {evt.location?.address && (
                    <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {evt.location.address.addressLocality}
                      {evt.location.address.countryCode
                        ? `, ${evt.location.address.countryCode}`
                        : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!statusDesc && !dhlTracking.isPending && (
          <p className="text-xs text-muted-foreground">
            Ingresa el código de seguimiento DHL y presiona el botón para consultar el estado.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

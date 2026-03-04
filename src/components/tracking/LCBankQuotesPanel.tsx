import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  Plus,
  Star,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useBancosLC,
  useCotizacionesLC,
  useCreateBancoLC,
  useCreateCotizacionLC,
  useSeleccionarBancoLC,
  type CotizacionLC,
} from '@/hooks/useBancosLC';
import { cn } from '@/lib/utils';

interface Props {
  pimId: string;
  readOnly?: boolean;
  userId?: string;
}

export function LCBankQuotesPanel({ pimId, readOnly, userId }: Props) {
  const { data: bancos = [] } = useBancosLC();
  const { data: cotizaciones = [], isLoading } = useCotizacionesLC(pimId);
  const createBanco = useCreateBancoLC();
  const createCotizacion = useCreateCotizacionLC();
  const seleccionarBanco = useSeleccionarBancoLC();

  const [showAddQuote, setShowAddQuote] = useState(false);
  const [showNewBank, setShowNewBank] = useState(false);

  // Quote form
  const [bancoId, setBancoId] = useState('');
  const [tasa, setTasa] = useState('');
  const [montoUsd, setMontoUsd] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // New bank form
  const [newBancoNombre, setNewBancoNombre] = useState('');
  const [newBancoPais, setNewBancoPais] = useState('');
  const [newBancoSwift, setNewBancoSwift] = useState('');

  const selectedQuote = cotizaciones.find((c) => c.seleccionado);

  const resetQuoteForm = () => {
    setBancoId('');
    setTasa('');
    setMontoUsd('');
    setObservaciones('');
    setShowAddQuote(false);
  };

  const resetBankForm = () => {
    setNewBancoNombre('');
    setNewBancoPais('');
    setNewBancoSwift('');
    setShowNewBank(false);
  };

  const handleCreateQuote = () => {
    if (!bancoId || !tasa) {
      toast.error('Seleccione banco y tasa');
      return;
    }
    createCotizacion.mutate(
      {
        pimId,
        bancoId,
        tasa: parseFloat(tasa),
        montoUsd: montoUsd ? parseFloat(montoUsd) : undefined,
        observaciones: observaciones || undefined,
        createdBy: userId,
      },
      {
        onSuccess: () => {
          toast.success('Cotizacion agregada');
          resetQuoteForm();
        },
        onError: () => toast.error('Error al crear cotizacion'),
      }
    );
  };

  const handleCreateBank = () => {
    if (!newBancoNombre.trim()) {
      toast.error('Nombre del banco requerido');
      return;
    }
    createBanco.mutate(
      {
        nombre: newBancoNombre.trim(),
        pais: newBancoPais || undefined,
        swiftCode: newBancoSwift || undefined,
      },
      {
        onSuccess: (bank) => {
          toast.success(`Banco "${bank.nombre}" creado`);
          setBancoId(bank.id);
          resetBankForm();
        },
        onError: () => toast.error('Error al crear banco'),
      }
    );
  };

  const handleSelectWinner = (cotizacion: CotizacionLC) => {
    seleccionarBanco.mutate(
      { cotizacionId: cotizacion.id, pimId },
      {
        onSuccess: () => toast.success('Banco seleccionado como ganador'),
        onError: () => toast.error('Error al seleccionar banco'),
      }
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Cotizaciones Carta de Credito
          </CardTitle>
          {!readOnly && (
            <Button size="sm" variant="outline" onClick={() => setShowAddQuote(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar cotizacion
            </Button>
          )}
        </div>
        {selectedQuote && selectedQuote.banco && (
          <div className="mt-2 p-2 rounded bg-blue-50 border border-blue-200 text-sm">
            <span className="text-blue-700 font-medium">
              Banco seleccionado: {selectedQuote.banco.nombre}
            </span>
            <span className="text-blue-600 ml-2">
              | Tasa: {selectedQuote.tasa}%
              {selectedQuote.monto_usd && ` | USD ${selectedQuote.monto_usd.toLocaleString()}`}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : cotizaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay cotizaciones registradas. Agregue cotizaciones de los bancos para comparar tasas.
          </p>
        ) : (
          <div className="space-y-2">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-3 pb-1 border-b">
              <div className="col-span-4">Banco</div>
              <div className="col-span-2">Tasa</div>
              <div className="col-span-2">Monto USD</div>
              <div className="col-span-2">Fecha</div>
              <div className="col-span-2 text-right">Accion</div>
            </div>

            {cotizaciones.map((cot) => (
              <div
                key={cot.id}
                className={cn(
                  'grid grid-cols-12 gap-2 items-center text-sm px-3 py-2 rounded-lg',
                  cot.seleccionado
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-muted/50'
                )}
              >
                <div className="col-span-4 flex items-center gap-2 min-w-0">
                  {cot.seleccionado && <Star className="h-4 w-4 text-blue-600 shrink-0 fill-blue-600" />}
                  <span className="truncate font-medium">
                    {cot.banco?.nombre || 'Banco desconocido'}
                  </span>
                </div>
                <div className="col-span-2">
                  <Badge variant="outline" className="text-xs">
                    {cot.tasa}%
                  </Badge>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  {cot.monto_usd ? `$${cot.monto_usd.toLocaleString()}` : '—'}
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  {new Date(cot.created_at).toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </div>
                <div className="col-span-2 flex justify-end gap-1">
                  {cot.cotizacion_url && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => window.open(cot.cotizacion_url!, '_blank')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {!readOnly && !cot.seleccionado && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleSelectWinner(cot)}
                      disabled={seleccionarBanco.isPending}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Seleccionar
                    </Button>
                  )}
                  {cot.seleccionado && (
                    <Badge className="bg-blue-600 text-white text-[10px]">Ganador</Badge>
                  )}
                </div>
              </div>
            ))}

            {cotizaciones.some((c) => c.observaciones) && (
              <div className="pt-2 border-t space-y-1">
                {cotizaciones
                  .filter((c) => c.observaciones)
                  .map((c) => (
                    <p key={c.id} className="text-xs text-muted-foreground">
                      <span className="font-medium">{c.banco?.nombre}:</span> {c.observaciones}
                    </p>
                  ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Add Quote Dialog */}
      <Dialog open={showAddQuote} onOpenChange={setShowAddQuote}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Cotizacion</DialogTitle>
            <DialogDescription>
              Registre la cotizacion recibida de un banco para la Carta de Credito.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Banco *</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                  onClick={() => setShowNewBank(true)}
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  Nuevo banco
                </Button>
              </div>
              <Select value={bancoId} onValueChange={setBancoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar banco" />
                </SelectTrigger>
                <SelectContent>
                  {bancos.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nombre}{b.pais ? ` (${b.pais})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tasa (%) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="1.85"
                  value={tasa}
                  onChange={(e) => setTasa(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Monto USD</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="50000"
                  value={montoUsd}
                  onChange={(e) => setMontoUsd(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observaciones</Label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Condiciones, plazos..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetQuoteForm}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateQuote}
              disabled={!bancoId || !tasa || createCotizacion.isPending}
            >
              {createCotizacion.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Bank Dialog */}
      <Dialog open={showNewBank} onOpenChange={setShowNewBank}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo Banco</DialogTitle>
            <DialogDescription>
              Agregar un banco al catalogo de bancos para Carta de Credito.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                placeholder="Nombre del banco"
                value={newBancoNombre}
                onChange={(e) => setNewBancoNombre(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pais</Label>
              <Input
                placeholder="Pais"
                value={newBancoPais}
                onChange={(e) => setNewBancoPais(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>SWIFT Code</Label>
              <Input
                placeholder="SWIFT"
                value={newBancoSwift}
                onChange={(e) => setNewBancoSwift(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetBankForm}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateBank}
              disabled={!newBancoNombre.trim() || createBanco.isPending}
            >
              {createBanco.isPending ? 'Creando...' : 'Crear banco'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

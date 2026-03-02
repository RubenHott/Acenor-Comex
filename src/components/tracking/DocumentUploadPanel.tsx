import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  usePIMDocuments,
  useUploadDocument,
  useDeleteDocument,
  DOCUMENT_TYPES,
  type PIMDocument,
} from '@/hooks/usePIMDocuments';

interface Props {
  pimId: string;
  stageKey: string;
  stageName?: string;
  usuario: string;
}

export function DocumentUploadPanel({ pimId, stageKey, stageName, usuario }: Props) {
  const { data: documents = [], isLoading } = usePIMDocuments(pimId, stageKey);
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();

  const [showUpload, setShowUpload] = useState(false);
  const [tipo, setTipo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [versionGroup, setVersionGroup] = useState<string | undefined>();
  const [versionNumber, setVersionNumber] = useState<number | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  // Group documents by version_group for SWIFT versioning
  const groupedDocs = documents.reduce<Record<string, PIMDocument[]>>((acc, doc) => {
    const key = doc.version_group || doc.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    acc[key].sort((a, b) => b.version - a.version);
    return acc;
  }, {});

  const handleUpload = async () => {
    if (!selectedFile || !tipo) {
      toast.error('Selecciona tipo y archivo');
      return;
    }

    try {
      await uploadDoc.mutateAsync({
        pimId,
        file: selectedFile,
        tipo,
        stageKey,
        observaciones,
        usuario,
        versionGroup,
        version: versionNumber,
      });
      toast.success('Documento subido');
      resetForm();
    } catch (err: any) {
      const msg = err?.message || err?.error_description || JSON.stringify(err);
      console.error('Upload error:', err);
      toast.error(`Error al subir documento: ${msg}`);
    }
  };

  const handleNewVersion = (doc: PIMDocument) => {
    setVersionGroup(doc.version_group || doc.id);
    setVersionNumber(doc.version + 1);
    setTipo(doc.tipo);
    setObservaciones('');
    setSelectedFile(null);
    setShowUpload(true);
  };

  const resetForm = () => {
    setShowUpload(false);
    setTipo('');
    setObservaciones('');
    setSelectedFile(null);
    setVersionGroup(undefined);
    setVersionNumber(undefined);
  };

  const typeLabel = (val: string) =>
    DOCUMENT_TYPES.find((t) => t.value === val)?.label || val;

  const handleDownload = (url: string, filename: string) => {
    // Append ?download= to Supabase Storage URLs to force file download
    const downloadUrl = url.includes('supabase.co/storage/')
      ? `${url}${url.includes('?') ? '&' : '?'}download=${encodeURIComponent(filename)}`
      : url;
    window.open(downloadUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Documentos — {stageName || stageKey}
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => { resetForm(); setShowUpload(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Subir
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : Object.keys(groupedDocs).length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay documentos en esta etapa.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedDocs).map(([groupKey, docs]) => {
              const latest = docs[0];
              const hasVersions = docs.length > 1 || latest.tipo === 'swift';

              return (
                <div
                  key={groupKey}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">{latest.nombre}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {typeLabel(latest.tipo)}
                      </Badge>
                      {hasVersions && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          v{latest.version}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(latest.tipo === 'swift' || latest.tipo === 'enmienda') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleNewVersion(latest)}
                            >
                              <Upload className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Nueva versión</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleDownload(latest.url, latest.nombre)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Descargar</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() =>
                              deleteDoc.mutate(
                                { docId: latest.id, pimId },
                                { onSuccess: () => toast.success('Documento eliminado') }
                              )
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {latest.observaciones && (
                    <p className="text-xs text-muted-foreground pl-6">{latest.observaciones}</p>
                  )}

                  <div className="text-xs text-muted-foreground pl-6 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {latest.fecha_subida
                      ? new Date(latest.fecha_subida).toLocaleDateString('es-CL')
                      : '—'}
                    <span>por {latest.subido_por}</span>
                  </div>

                  {/* Version history */}
                  {docs.length > 1 && (
                    <div className="pl-6 space-y-1 border-t pt-2 mt-2">
                      <p className="text-xs font-medium text-muted-foreground">Versiones anteriores:</p>
                      {docs.slice(1).map((v) => (
                        <div key={v.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>v{v.version}</span>
                          <span className="truncate">{v.nombre}</span>
                          <button
                            type="button"
                            onClick={() => handleDownload(v.url, v.nombre)}
                            className="text-primary hover:underline shrink-0"
                          >
                            Descargar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {versionNumber
                ? `Nueva versión (v${versionNumber})`
                : 'Subir Documento'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de documento</Label>
              <Select value={tipo} onValueChange={setTipo} disabled={!!versionGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Archivo</Label>
              <Input
                ref={fileRef}
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label>Observaciones (opcional)</Label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas sobre este documento..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={uploadDoc.isPending}>
              {uploadDoc.isPending ? 'Subiendo...' : 'Subir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

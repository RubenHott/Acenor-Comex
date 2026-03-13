import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  FileText,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  usePIMDocuments,
  useUploadDocument,
  useDeleteDocument,
  DOCUMENT_TYPES,
  UPLOAD_ACCEPT,
  type PIMDocument,
} from '@/hooks/usePIMDocuments';
import type { DocumentType } from '@/lib/trackingChecklists';
import { cn } from '@/lib/utils';

interface Props {
  pimId: string;
  stageKey: string;
  stageName?: string;
  requiredDocTypes: DocumentType[];
  usuario: string;
  readOnly?: boolean;
  pimCodigo?: string;
}

const DOC_LABELS: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPES.map((t) => [t.value, t.label])
);

export function RequiredDocumentsPanel({
  pimId,
  stageKey,
  stageName,
  requiredDocTypes,
  usuario,
  readOnly,
  pimCodigo,
}: Props) {
  const { data: documents = [], isLoading } = usePIMDocuments(pimId, stageKey);
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();

  const [showUpload, setShowUpload] = useState(false);
  const [uploadForType, setUploadForType] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [versionGroup, setVersionGroup] = useState<string | undefined>();
  const [versionNumber, setVersionNumber] = useState<number | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  // Group documents by tipo
  const docsByType = new Map<string, PIMDocument[]>();
  for (const doc of documents) {
    if (!docsByType.has(doc.tipo)) docsByType.set(doc.tipo, []);
    docsByType.get(doc.tipo)!.push(doc);
  }
  // Sort each group by version descending
  for (const docs of docsByType.values()) {
    docs.sort((a, b) => b.version - a.version);
  }

  // Extra documents (not in required types)
  const extraDocs = documents.filter(
    (d) => !requiredDocTypes.includes(d.tipo as DocumentType)
  );

  const uploadedRequired = requiredDocTypes.filter(
    (t) => docsByType.has(t) && docsByType.get(t)!.length > 0
  ).length;

  const resetForm = () => {
    setShowUpload(false);
    setUploadForType('');
    setObservaciones('');
    setSelectedFile(null);
    setVersionGroup(undefined);
    setVersionNumber(undefined);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForType) {
      toast.error('Selecciona archivo');
      return;
    }
    try {
      await uploadDoc.mutateAsync({
        pimId,
        file: selectedFile,
        tipo: uploadForType,
        stageKey,
        observaciones,
        usuario,
        versionGroup,
        version: versionNumber,
        pimCodigo,
      });
      toast.success('Documento subido');
      resetForm();
    } catch (err: any) {
      const msg = err?.message || JSON.stringify(err);
      toast.error(`Error al subir: ${msg}`);
    }
  };

  const openUploadFor = (tipo: string, existingDoc?: PIMDocument) => {
    if (existingDoc) {
      setVersionGroup(existingDoc.version_group || existingDoc.id);
      setVersionNumber(existingDoc.version + 1);
    } else {
      setVersionGroup(undefined);
      setVersionNumber(undefined);
    }
    setUploadForType(tipo);
    setObservaciones('');
    setSelectedFile(null);
    setShowUpload(true);
  };

  const handleDownload = (url: string, filename: string) => {
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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {uploadedRequired}/{requiredDocTypes.length} requeridos
          </Badge>
          {!readOnly && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openUploadFor('')}
            >
              <Plus className="h-4 w-4 mr-1" />
              Otro doc
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <>
            {/* Required document boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {requiredDocTypes.map((docType) => {
                const docs = docsByType.get(docType) || [];
                const latest = docs[0];
                const hasDoc = !!latest;
                const label = DOC_LABELS[docType] || docType;

                return (
                  <div
                    key={docType}
                    className={cn(
                      'p-3 rounded-lg border-2 border-dashed transition-colors',
                      hasDoc
                        ? 'border-green-300 bg-green-50/50'
                        : 'border-yellow-300 bg-yellow-50/30'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {hasDoc ? (
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
                        )}
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      {hasDoc ? (
                        <Badge className="text-[10px] bg-green-600 shrink-0">Subido</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-yellow-400 text-yellow-700 shrink-0">
                          Pendiente
                        </Badge>
                      )}
                    </div>

                    {hasDoc ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground truncate" title={latest.nombre}>
                          {latest.nombre}
                          {docs.length > 1 && ` (v${latest.version})`}
                        </p>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {latest.fecha_subida
                            ? new Date(latest.fecha_subida).toLocaleDateString('es-CL')
                            : '—'}
                          <span>— {latest.subido_por}</span>
                        </div>
                        <div className="flex gap-1 mt-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => handleDownload(latest.url, latest.nombre)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Descargar</TooltipContent>
                          </Tooltip>
                          {!readOnly && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => openUploadFor(docType, latest)}
                                  >
                                    <Upload className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Nueva version</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-destructive"
                                    onClick={() =>
                                      deleteDoc.mutate(
                                        { docId: latest.id, pimId },
                                        { onSuccess: () => toast.success('Documento eliminado') }
                                      )
                                    }
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Eliminar</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      !readOnly && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full h-8 text-xs"
                          onClick={() => openUploadFor(docType)}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Subir {label}
                        </Button>
                      )
                    )}
                  </div>
                );
              })}
            </div>

            {/* Extra (non-required) documents */}
            {extraDocs.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Otros documentos ({extraDocs.length})
                </p>
                <div className="space-y-2">
                  {extraDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded border text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{doc.nombre}</span>
                        <Badge variant="secondary" className="text-[9px] shrink-0">
                          {DOC_LABELS[doc.tipo] || doc.tipo}
                        </Badge>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleDownload(doc.url, doc.nombre)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        {!readOnly && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive"
                            onClick={() =>
                              deleteDoc.mutate(
                                { docId: doc.id, pimId },
                                { onSuccess: () => toast.success('Eliminado') }
                              )
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {versionNumber
                ? `Nueva version (v${versionNumber})`
                : uploadForType
                  ? `Subir: ${DOC_LABELS[uploadForType] || uploadForType}`
                  : 'Subir Documento'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!uploadForType && (
              <div>
                <Label>Tipo de documento</Label>
                <Select value={uploadForType} onValueChange={setUploadForType}>
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
            )}
            <div>
              <Label>Archivo</Label>
              <Input
                ref={fileRef}
                type="file"
                accept={UPLOAD_ACCEPT}
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
            <Button
              onClick={handleUpload}
              disabled={uploadDoc.isPending || !selectedFile || !uploadForType}
            >
              {uploadDoc.isPending ? 'Subiendo...' : 'Subir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

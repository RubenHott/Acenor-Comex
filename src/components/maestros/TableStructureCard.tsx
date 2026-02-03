import { useState } from 'react';
import { ChevronDown, ChevronRight, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface ColumnDefinition {
  name: string;
  type: 'texto' | 'número' | 'fecha' | 'boolean';
  required: boolean;
  description: string;
}

interface TableStructureCardProps {
  tableName: string;
  columns: ColumnDefinition[];
  templateFilename: string;
}

function downloadTemplate(columns: ColumnDefinition[], filename: string) {
  const headers = columns.map((c) => c.name).join(',');
  const csv = headers + '\n';
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function TableStructureCard({ tableName, columns, templateFilename }: TableStructureCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  const requiredColumns = columns.filter((c) => c.required);
  const optionalColumns = columns.filter((c) => !c.required);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg bg-muted/30">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-4 h-auto hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <span className="font-medium">Estructura requerida para carga masiva</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 pb-4">
        <div className="space-y-4">
          {/* Required columns summary */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Columnas obligatorias:</span>
            {requiredColumns.map((col) => (
              <Badge key={col.name} variant="default" className="bg-destructive/90">
                {col.name}
              </Badge>
            ))}
          </div>

          {/* Columns table */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[180px]">Columna</TableHead>
                  <TableHead className="w-[100px]">Tipo</TableHead>
                  <TableHead className="w-[100px]">Requerido</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.map((col) => (
                  <TableRow key={col.name}>
                    <TableCell className="font-mono text-sm font-medium">{col.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {col.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {col.required ? (
                        <Badge variant="destructive" className="text-xs">Sí</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{col.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Download template button */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate(columns, templateFilename)}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla CSV
            </Button>
            <span className="text-xs text-muted-foreground">
              Archivo CSV con encabezados correctos para llenar
            </span>
          </div>

          {/* Example hint */}
          <div className="bg-muted/50 rounded-md p-3 text-sm">
            <p className="text-muted-foreground">
              <strong>Nota:</strong> El archivo debe tener la primera fila como encabezados.
              Las columnas opcionales pueden omitirse o dejarse vacías.
              {optionalColumns.length > 0 && (
                <> Columnas opcionales: {optionalColumns.map((c) => c.name).join(', ')}.</>
              )}
            </p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

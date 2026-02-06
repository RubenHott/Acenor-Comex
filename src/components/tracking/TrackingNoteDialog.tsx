import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (text: string) => void;
  stageName?: string;
}

export function TrackingNoteDialog({ open, onOpenChange, onSubmit, stageName }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Agregar Nota
          </DialogTitle>
          <DialogDescription>
            {stageName
              ? `Nota para la etapa "${stageName}"`
              : 'Nota general del seguimiento'}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Escribe tu nota aquí..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!text.trim()}>
            Guardar Nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

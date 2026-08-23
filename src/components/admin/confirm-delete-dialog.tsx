import React from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({ open, onOpenChange, onConfirm }: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Подтвердите удаление</DialogTitle>
        </DialogHeader>
        <p>Вы действительно хотите удалить этот товар?</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={() => { onConfirm(); onOpenChange(false); }}>Удалить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
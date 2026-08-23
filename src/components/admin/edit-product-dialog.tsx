import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Flower } from './flower-card';

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Flower;
  onUpdate: (updatedProduct: Flower) => void;
}

export function EditProductDialog({ open, onOpenChange, product, onUpdate }: EditProductDialogProps) {
  const [editedProduct, setEditedProduct] = useState<Flower>(product);

  const handleSave = () => {
    onUpdate(editedProduct);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактирование товара</DialogTitle>
          <DialogDescription>Обновите информацию о товаре</DialogDescription>
        </DialogHeader>

        <Input placeholder="Название" value={editedProduct.name} onChange={(e) => setEditedProduct({...editedProduct, name: e.target.value})} />
        <Input placeholder="Описание" value={editedProduct.description} onChange={(e) => setEditedProduct({...editedProduct, description: e.target.value})} />
        <Input placeholder="Цена" value={editedProduct.price} type="number" onChange={(e) => setEditedProduct({...editedProduct, price: Number(e.target.value)})} />
        <Input placeholder="Количество" value={editedProduct.stock} type="number" onChange={(e) => setEditedProduct({...editedProduct, stock: Number(e.target.value})} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
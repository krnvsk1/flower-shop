'use client';

import { useState } from 'react';
import { Loader2, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';
import { z } from 'zod';

const orderSchema = z.object({
  name: z
    .string()
    .min(2, 'Имя должно содержать минимум 2 символа'),
  phone: z
    .string()
    .min(1, 'Укажите номер телефона')
    .regex(
      /^(\+7|7|8)?[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/,
      'Введите корректный номер телефона (например, +7 999 123 45 67)'
    ),
});

type OrderForm = z.infer<typeof orderSchema>;

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof OrderForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const clearCart = useCartStore((s) => s.clearCart);

  const currentTotal = total();

  const validate = (): boolean => {
    const result = orderSchema.safeParse({ name, phone });
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors: Partial<Record<keyof OrderForm, string>> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof OrderForm;
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    setErrors(fieldErrors);
    return false;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (items.length === 0) {
      toast.error('Корзина пуста');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: name,
          clientPhone: phone,
          items: items.map((item) => ({
            flowerId: item.flowerId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          total: currentTotal,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to place order');
      }

      clearCart();
      setName('');
      setPhone('');
      setErrors({});
      toast.success('Заказ успешно оформлен! 🎉');
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Произошла ошибка при оформлении заказа'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <CreditCard className="w-5 h-5 text-rose-500" />
            Оформление заказа
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Заполните контактные данные для оформления заказа
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2 md:gap-6">
          {/* Name field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="checkout-name" className="text-slate-700">
              Имя <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="checkout-name"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={errors.name ? 'border-red-400 focus-visible:ring-red-400 md:text-lg' : 'border-slate-200 focus-visible:ring-rose-500 md:text-lg'}
              disabled={submitting}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Phone field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="checkout-phone" className="text-slate-700">
              Телефон <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="checkout-phone"
              placeholder="+7 999 123 45 67"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              className={errors.phone ? 'border-red-400 focus-visible:ring-red-400 md:text-lg' : 'border-slate-200 focus-visible:ring-rose-500 md:text-lg'}
              disabled={submitting}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          <Separator className="bg-slate-100" />

          {/* Order Summary */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-slate-700">Ваш заказ:</h4>
            <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1">
              {items.map((item) => (
                <div
                  key={item.flowerId}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-slate-600">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-slate-800 font-medium">
                    {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-slate-100" />

          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Итого:</span>
            <span className="text-xl font-bold text-rose-600">
              {currentTotal.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="border-slate-200 text-slate-600 text-lg"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-rose-500 hover:bg-rose-600 text-white cursor-pointer text-lg"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {submitting ? 'Оформляем...' : 'Подтвердить заказ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

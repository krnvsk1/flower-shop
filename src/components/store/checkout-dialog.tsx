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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';
import { z } from 'zod';

const DELIVERY_SLOTS = [
  'Как можно скорее',
  'Сегодня 10:00–13:00',
  'Сегодня 13:00–16:00',
  'Сегодня 16:00–19:00',
  'Завтра 10:00–13:00',
  'Завтра 13:00–16:00',
  'Завтра 16:00–19:00',
];

const orderSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  phone: z
    .string()
    .min(1, 'Укажите номер телефона')
    .regex(
      /^(\+7|7|8)?[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/,
      'Введите корректный номер телефона (например, +7 999 123 45 67)'
    ),
  address: z.string().min(5, 'Укажите адрес доставки'),
  deliverySlot: z.string().min(1, 'Выберите время доставки'),
  comment: z.string().optional(),
});

type OrderForm = z.infer<typeof orderSchema>;

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof OrderForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const clearCart = useCartStore((s) => s.clearCart);

  const currentTotal = total();

  const validate = (): boolean => {
    const result = orderSchema.safeParse({ name, phone, address, deliverySlot, comment });
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors: Partial<Record<keyof OrderForm, string>> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof OrderForm;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    setErrors(fieldErrors);
    return false;
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
    setDeliverySlot('');
    setComment('');
    setErrors({});
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
          address,
          deliverySlot,
          comment,
          items: items.map((item) => ({
            flowerId: item.flowerId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to place order');
      }

      clearCart();
      resetForm();
      toast.success('Заказ принят. Мы свяжемся с вами для подтверждения.');
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
      <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <CreditCard className="w-5 h-5 text-primary" />
            Оформление заказа
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Куда и когда привезти букет
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="checkout-name">
              Имя <span className="text-primary">*</span>
            </Label>
            <Input
              id="checkout-name"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              disabled={submitting}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="checkout-phone">
              Телефон <span className="text-primary">*</span>
            </Label>
            <Input
              id="checkout-phone"
              placeholder="+7 999 123 45 67"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              disabled={submitting}
            />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="checkout-address">
              Адрес доставки <span className="text-primary">*</span>
            </Label>
            <Input
              id="checkout-address"
              placeholder="Улица, дом, квартира"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
              }}
              disabled={submitting}
            />
            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              Время доставки <span className="text-primary">*</span>
            </Label>
            <Select
              value={deliverySlot || undefined}
              onValueChange={(v) => {
                setDeliverySlot(v);
                if (errors.deliverySlot) setErrors((prev) => ({ ...prev, deliverySlot: undefined }));
              }}
              disabled={submitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите интервал" />
              </SelectTrigger>
              <SelectContent>
                {DELIVERY_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.deliverySlot && (
              <p className="text-sm text-red-500">{errors.deliverySlot}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="checkout-comment">Комментарий</Label>
            <Textarea
              id="checkout-comment"
              placeholder="Домофон, этаж, повод для букета..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={submitting}
            />
          </div>

          <Separator className="bg-slate-100" />

          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-slate-700">Ваш заказ:</h4>
            <div className="max-h-32 overflow-y-auto flex flex-col gap-1.5 pr-1">
              {items.map((item) => (
                <div key={item.flowerId} className="flex justify-between items-center text-sm">
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

          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Итого:</span>
            <span className="text-xl font-display text-primary">
              {currentTotal.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer rounded-none"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {submitting ? 'Оформляем...' : 'Подтвердить заказ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

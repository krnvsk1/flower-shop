'use client';

import { useEffect, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { earnBonuses, maxSpend, normalizePhone } from '@/lib/bonus';
import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/payment';
import { cn } from '@/lib/utils';
import { AddressPicker } from '@/components/store/address-picker';
import type { LatLng } from '@/lib/geo';

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
  paymentMethod: z.enum(['cash', 'terminal', 'qr'], { message: 'Выберите способ оплаты' }),
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
  const [addressPoint, setAddressPoint] = useState<LatLng | null>(null);
  const [deliverySlot, setDeliverySlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof OrderForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [bonusEnabled, setBonusEnabled] = useState(false);
  const [bonusPercent, setBonusPercent] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [spendBonuses, setSpendBonuses] = useState(false);

  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const clearCart = useCartStore((s) => s.clearCart);

  const currentTotal = total();
  const spendAmount = spendBonuses ? maxSpend(currentTotal, bonusBalance) : 0;
  const payable = currentTotal - spendAmount;
  const willEarn = bonusEnabled ? earnBonuses(payable, bonusPercent) : 0;

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const res = await fetch('/api/bonus');
        if (!res.ok) return;
        const data = await res.json();
        setBonusEnabled(Boolean(data.enabled));
        setBonusPercent(Number(data.percent) || 0);
      } catch {
        setBonusEnabled(false);
      }
    };
    void load();
  }, [open]);

  useEffect(() => {
    if (!open || !bonusEnabled) {
      setBonusBalance(0);
      return;
    }
    const key = normalizePhone(phone);
    if (!key) {
      setBonusBalance(0);
      return;
    }
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/bonus?phone=${encodeURIComponent(phone)}`);
          if (!res.ok) return;
          const data = await res.json();
          setBonusBalance(Number(data.balance) || 0);
        } catch {
          setBonusBalance(0);
        }
      })();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [open, bonusEnabled, phone]);

  const validate = (): boolean => {
    const result = orderSchema.safeParse({
      name,
      phone,
      address,
      deliverySlot,
      paymentMethod,
      comment,
    });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof OrderForm, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof OrderForm;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    if (!addressPoint) {
      setErrors({ address: 'Выберите адрес из подсказок или укажите точку на карте' });
      return false;
    }
    setErrors({});
    return true;
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
    setAddressPoint(null);
    setDeliverySlot('');
    setPaymentMethod('');
    setComment('');
    setErrors({});
    setSpendBonuses(false);
    setBonusBalance(0);
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
          addressLat: addressPoint?.lat,
          addressLng: addressPoint?.lng,
          deliverySlot,
          comment,
          paymentMethod,
          spendBonuses,
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
            <AddressPicker
              open={open}
              address={address}
              disabled={submitting}
              onAddressChange={setAddress}
              onPointChange={setAddressPoint}
              onErrorClear={() => {
                if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
              }}
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
            <Label>
              Оплата <span className="text-primary">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setPaymentMethod(method.value);
                    if (errors.paymentMethod) {
                      setErrors((prev) => ({ ...prev, paymentMethod: undefined }));
                    }
                  }}
                  className={cn(
                    'border px-3 py-2 text-left cursor-pointer transition-colors',
                    paymentMethod === method.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                  )}
                >
                  <p className="text-sm font-medium">{method.label}</p>
                  <p className="text-xs text-muted-foreground">{method.deliveryHint}</p>
                </button>
              ))}
            </div>
            {errors.paymentMethod && (
              <p className="text-sm text-red-500">{errors.paymentMethod}</p>
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
              {payable.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          {bonusEnabled && bonusPercent > 0 ? (
            <p className="text-sm text-muted-foreground">
              Начислим {willEarn.toLocaleString('ru-RU')} ₽ бонусами ({bonusPercent}% от оплаты).
            </p>
          ) : null}
          {bonusEnabled && bonusBalance > 0 ? (
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={spendBonuses}
                onCheckedChange={(v) => setSpendBonuses(v === true)}
                disabled={submitting}
              />
              <span>
                Списать {maxSpend(currentTotal, bonusBalance).toLocaleString('ru-RU')} ₽ бонусами
                (доступно {bonusBalance.toLocaleString('ru-RU')} ₽)
              </span>
            </label>
          ) : null}
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

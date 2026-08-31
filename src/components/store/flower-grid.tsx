'use client';

import { useEffect, useMemo, useState } from 'react';
import { FlowerCard, type Flower } from './flower-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartStore } from '@/store/cart-store';

export function FlowerGrid() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Все');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlowers = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/flowers');
        if (!res.ok) throw new Error('Failed to fetch flowers');
        const data = await res.json();
        const list = (Array.isArray(data) ? data : data.flowers ?? []).filter(
          (flower: Flower) => flower.stock > 0
        );
        setFlowers(list);
        useCartStore.getState().keepOnlyIds(list.map((flower: Flower) => flower.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchFlowers();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(
      flowers
        .map((f) => f.category)
        .filter((category): category is string => Boolean(category))
    );
    return ['Все', ...Array.from(cats).sort()];
  }, [flowers]);

  const filteredFlowers = useMemo(() => {
    return flowers.filter((f) => {
      const matchesCategory =
        activeCategory === 'Все' || f.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [flowers, activeCategory, searchQuery]);

  useEffect(() => {
    setSelectedId(null);
  }, [activeCategory, searchQuery]);

  if (error) {
    return (
      <div className="px-5 sm:px-8 lg:px-12 py-24 text-center">
        <p className="font-display text-3xl">Не удалось загрузить коллекцию</p>
        <p className="text-muted-foreground mt-2 text-sm">Попробуйте обновить страницу</p>
      </div>
    );
  }

  return (
    <section id="collection" className="w-full px-5 sm:px-8 lg:px-12 scroll-mt-24">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-10">
        <div>
          <p className="text-[11px] tracking-[0.32em] uppercase text-brass mb-2">Каталог</p>
          <h2 className="font-display text-5xl sm:text-7xl leading-[0.9] font-medium">
            Коллекция
          </h2>
        </div>
        <div className="flex flex-col sm:items-end gap-4 max-w-xl w-full">
          <input
            placeholder="Найти букет"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            suppressHydrationWarning
            className="w-full sm:w-72 bg-transparent border-0 border-b border-border rounded-none h-10 px-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
          />
          <div className="flex flex-wrap gap-x-5 gap-y-2 sm:justify-end">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={
                  activeCategory === cat
                    ? 'text-[11px] tracking-[0.2em] uppercase text-foreground border-b border-foreground pb-0.5 cursor-pointer'
                    : 'text-[11px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground cursor-pointer'
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`rounded-none bg-muted/80 ${i === 0 ? 'lg:col-span-2 aspect-[4/5]' : 'aspect-[3/4]'}`}
            />
          ))}
        </div>
      ) : filteredFlowers.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-3xl">Ничего не найдено</p>
          <p className="text-muted-foreground text-sm mt-2">Смените категорию или запрос</p>
        </div>
      ) : (
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {selectedId ? (
            <button
              type="button"
              aria-label="Закрыть карточку"
              className="fixed inset-0 z-20 bg-foreground/10 cursor-pointer"
              onClick={() => setSelectedId(null)}
            />
          ) : null}
          {filteredFlowers.map((flower, index) => (
            <div
              key={flower.id}
              className={index === 0 ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2' : ''}
            >
              <FlowerCard
                flower={flower}
                featured={index === 0}
                expanded={selectedId === flower.id}
                onToggle={() =>
                  setSelectedId((id) => (id === flower.id ? null : flower.id))
                }
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

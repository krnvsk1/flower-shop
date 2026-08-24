'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Flower2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FlowerCard, type Flower } from './flower-card';

export function FlowerGrid() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Все');

  useEffect(() => {
    const fetchFlowers = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/flowers');
        if (!res.ok) throw new Error('Failed to fetch flowers');
        const data = await res.json();
        setFlowers(Array.isArray(data) ? data : data.flowers ?? []);
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Flower2 className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-slate-500 text-lg">Не удалось загрузить цветы</p>
        <p className="text-slate-400 text-sm mt-1">Пожалуйста, попробуйте позже</p>
      </div>
    );
  }

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 mb-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.28em] uppercase text-brass mb-1">Каталог</p>
            <h3 className="font-display text-3xl font-semibold">Коллекция</h3>
          </div>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Найти букет или цветок"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border focus-visible:ring-primary rounded-none h-11"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={
                activeCategory === cat
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary rounded-none'
                  : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground rounded-none'
              }
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="w-full aspect-[4/5] rounded-none bg-muted" />
              <Skeleton className="h-5 w-3/4 bg-muted" />
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-4 w-1/2 bg-muted" />
              <Skeleton className="h-10 w-full bg-muted" />
            </div>
          ))}
        </div>
      ) : filteredFlowers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Flower2 className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg">
            {searchQuery || activeCategory !== 'Все'
              ? 'Ничего не найдено'
              : 'Каталог пока пуст'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {searchQuery || activeCategory !== 'Все'
              ? 'Попробуйте изменить параметры поиска'
              : 'Скоро здесь появятся цветы'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFlowers.map((flower) => (
            <FlowerCard key={flower.id} flower={flower} />
          ))}
        </div>
      )}
    </section>
  );
}

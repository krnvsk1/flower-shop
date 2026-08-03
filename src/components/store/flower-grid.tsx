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
  const [activeCategory, setActiveCategory] = useState('All');

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
    const cats = new Set(flowers.map((f) => f.category));
    return ['All', ...Array.from(cats).sort()];
  }, [flowers]);

  const filteredFlowers = useMemo(() => {
    return flowers.filter((f) => {
      const matchesCategory =
        activeCategory === 'All' || f.category === activeCategory;
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
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Search & Filters */}
      <div className="flex flex-col gap-4 mb-8">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Поиск цветов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-slate-200 focus-visible:ring-rose-500"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={
                activeCategory === cat
                  ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500'
                  : 'border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
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
              <Skeleton className="w-full aspect-square rounded-lg bg-slate-100" />
              <Skeleton className="h-5 w-3/4 bg-slate-100" />
              <Skeleton className="h-4 w-full bg-slate-100" />
              <Skeleton className="h-4 w-1/2 bg-slate-100" />
              <Skeleton className="h-10 w-full bg-slate-100" />
            </div>
          ))}
        </div>
      ) : filteredFlowers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Flower2 className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg">
            {searchQuery || activeCategory !== 'All'
              ? 'Ничего не найдено'
              : 'Каталог пока пуст'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {searchQuery || activeCategory !== 'All'
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

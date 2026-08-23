import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table } from '@/components/ui/table';
import { useCartStore } from '@/store/cart-store';
import { Flower } from './flower-card';

export function InventoryManagement() {
  const [products, setProducts] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState<Flower>({ id: '', name: '', description: '', price: 0, stock: 0, category: '', imageUrl: '' });

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products'); // API для получения списка товаров
      const data = await response.json();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async () => {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    });
    if (response.ok) {
      fetchProducts(); // Обновляем список товаров
      setNewProduct({ id: '', name: '', description: '', price: 0, stock: 0, category: '', imageUrl: '' }); // Сброс формы
    }
  };

  const deleteProduct = async (id: string) => {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchProducts(); // Обновляем список товаров
  };

  useEffect(() => { fetchProducts(); }, []);

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Управление запасами</h2>
      <div className="mb-4">
        <h3 className="text-md font-semibold">Добавить новый товар</h3>
        <Input placeholder="Название" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
        <Input placeholder="Описание" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
        <Input placeholder="Цена" value={newProduct.price} type="number" onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})} />
        <Input placeholder="Количество" value={newProduct.stock} type="number" onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})} />
        <Input placeholder="Категория" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} />
        <Button onClick={addProduct}>Добавить товар</Button>
      </div>
      <Table>
        <thead>
          <tr>
            <th>Название</th>
            <th>Цена</th>
            <th>Количество</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.price} ₽</td>
              <td>{product.stock}</td>
              <td>
                <Button onClick={() => deleteProduct(product.id)}>Удалить</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
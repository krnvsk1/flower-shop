import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { NotificationService } from '@/components/ui/notification-service';
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
    notifySuccess('Товар успешно добавлен!');
    logChange('added', newProduct.id);

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

  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
const [selectedProduct, setSelectedProduct] = useState<Flower | null>(null);

const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [productToDelete, setProductToDelete] = useState<string | null>(null);

const deleteProduct = async (id: string) => {
    await logChange('deleted', id);
    notifySuccess('Товар успешно удален!');
    await logChange('deleted', id);

    setProductToDelete(id);
    setDeleteDialogOpen(true);
    return;

    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchProducts(); // Обновляем список товаров
  };

  useEffect(() => { fetchProducts(); }, []);

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="p-4">
      <EditProductDialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen} product={selectedProduct} onUpdate={fetchProducts} />      <h2 className="text-xl font-bold mb-4">Управление запасами</h2>
      <div className="mb-4">
        <h3 className="text-md font-semibold">Добавить новый товар</h3>
        <Input placeholder="Название" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
        <Input placeholder="Описание" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
        <Input placeholder="Цена" value={newProduct.price} type="number" onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})} />
        <Input placeholder="Количество" value={newProduct.stock} type="number" onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})} />
        <Input placeholder="Категория" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} />
        <Button onClick={addProduct}>Добавить товар</Button>
      </div>
      <ConfirmDeleteDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={() => deleteConfirmed(productToDelete)} />
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              <p className="text-sm text-slate-500">{product.description}</p>
              <p className="text-lg font-bold text-rose-600">{product.price} ₽</p>
              <p className="text-sm">В наличии: {product.stock}</p>
              <div className="flex justify-between mt-4">
                <Button onClick={() => {
                  setSelectedProduct(product);
                  setEditDialogOpen(true);
                }}>Редактировать</Button>
                <Button onClick={() => {
                  setProductToDelete(product.id);
                  setDeleteDialogOpen(true);
                }}>Удалить</Button>
              </div>
            </div>
          ))}
        </div>
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
               </tr>
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.price} ₽</td>
              <td>{product.stock}</td>
              <td>
                <Button onClick={() => {
                    setProductToDelete(product.id);
                    setDeleteDialogOpen(true);
                }}>Удалить</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
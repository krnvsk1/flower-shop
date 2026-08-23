import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table } from '@/components/ui/table';

export function CategoryManagement() {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    const response = await fetch('/api/categories');
    const data = await response.json();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const addCategory = async () => {
    await fetch('/api/categories', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ name: newCategory }),
    });
    fetchCategories(); // Обновляем список категорий
    setNewCategory(''); // Сброс формы
  };

  const deleteCategory = async (categoryToDelete: string) => {
    await fetch(`/api/categories/${categoryToDelete}`, { method: 'DELETE' });
    fetchCategories(); // Обновляем список категорий
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Управление категориями</h2>
      <div className="mb-4">
        <Input placeholder="Новая категория" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
        <Button onClick={addCategory}>Добавить категорию</Button>
      </div>
      <Table>
        <thead>
          <tr>
            <th>Категория</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category}>
              <td>{category}</td>
              <td>
                <Button onClick={() => deleteCategory(category)}>Удалить</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
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

  useEffect(() => { fetchCategories(); }, []);

  const addCategory = async () => {
    await fetch('/api/categories', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ name: newCategory }),
    });
    fetchCategories();
    setNewCategory('');
  };

  const deleteCategory = async (categoryToDelete: string) => {
    await fetch(`/api/categories/${categoryToDelete}`, { method: 'DELETE' });
    fetchCategories();
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Управление категориями</h2>
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
\n  const [categories, setCategories] = useState<string[]>([]);\n  const [newCategory, setNewCategory] = useState('');\n  const [loading, setLoading] = useState(true);\n  const fetchCategories = async () => {\n    const response = await fetch('/api/categories');\n    const data = await response.json();\n    setCategories(data);\n    setLoading(false);\n  };\n  useEffect(() => { fetchCategories(); }, []);\n  const addCategory = async () => {\n    await fetch('/api/categories', {\n      method: 'POST',\n      headers: {'Content-Type': 'application/json'},\n      body: JSON.stringify({ name: newCategory }),\n    });\n    fetchCategories();\n    setNewCategory('');\n  };\n  const deleteCategory = async (categoryToDelete: string) => {\n    await fetch(`/api/categories/${categoryToDelete}`, { method: 'DELETE' });\n    fetchCategories();\n  };\n  if (loading) return <p>Загрузка...</p>;\n  return (\n    <div className=\"p-4\">\n      <h2 className=\"text-xl font-bold mb-4\">Управление категориями</h2>\n      <div className=\"mb-4\">\n        <Input placeholder=\"Новая категория\" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />\n        <Button onClick={addCategory}>Добавить категорию</Button>\n      </div>\n      <Table>\n        <thead>\n          <tr>\n            <th>Категория</th>\n            <th>Действия</th>\n          </tr>\n        </thead>\n        <tbody>\n          {categories.map((category) => (\n            <tr key={category}>\n              <td>{category}</td>\n              <td>\n                <Button onClick={() => deleteCategory(category)}>Удалить</Button>\n              </td>\n            </tr>\n          ))}\n        </tbody>\n      </Table>\n    </div>\n  );\n  const [categories, setCategories] = useState<string[]>([]);
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
      <h2 className="text-xl font-bold mb-4">Управление категориями</h2>
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
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table } from '@/components/ui/table';

export function UserManagement() {
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [newUser, setNewUser] = useState<{ name: string; email: string }>({ name: '', email: '' });
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const response = await fetch('/api/users');
    const data = await response.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = async () => {
    notifySuccess('Пользователь успешно добавлен!');
    await fetch('/api/users', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(newUser),
    });
    fetchUsers(); // Обновляем список пользователей
    setNewUser({ name: '', email: '' }); // Сброс формы
  };

  const deleteUser = async (id: string) => {
    notifySuccess('Пользователь успешно удален!');
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchUsers(); // Обновляем список пользователей
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Управление пользователями</h2>
      <div className="mb-4">
        <Input placeholder="Имя" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
        <Input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
        <Button onClick={addUser}>Добавить пользователя</Button>
      </div>
      <Table>
        <thead>
          <tr>
            <th>Имя</th>
            <th>Email</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <Button onClick={() => deleteUser(user.id)}>Удалить</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table } from '@/components/ui/table';

import React, { useEffect, useState } from 'react';\nimport { Button } from '@/components/ui/button';\nimport { Input } from '@/components/ui/input';\nimport { Table } from '@/components/ui/table';\n\nimport { useEffect, useState } from 'react';
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
  useEffect(() => { fetchUsers(); }, []);
  const addUser = async () => {
    await fetch('/api/users', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(newUser),
    });
    fetchUsers();
    setNewUser({ name: '', email: '' });
  };
  const deleteUser = async (id: string) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };
  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Управление пользователями</h2>
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
\n  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);\n  const [newUser, setNewUser] = useState<{ name: string; email: string }>({ name: '', email: '' });\n  const [loading, setLoading] = useState(true);\n  const fetchUsers = async () => {\n    const response = await fetch('/api/users');\n    const data = await response.json();\n    setUsers(data);\n    setLoading(false);\n  };\n  useEffect(() => { fetchUsers(); }, []);\n  const addUser = async () => {\n    await fetch('/api/users', {\n      method: 'POST',\n      headers: {'Content-Type': 'application/json'},\n      body: JSON.stringify(newUser),\n    });\n    fetchUsers();\n    setNewUser({ name: '', email: '' });\n  };\n  const deleteUser = async (id: string) => {\n    await fetch(`/api/users/${id}`, { method: 'DELETE' });\n    fetchUsers();\n  };\n  if (loading) return <p>Загрузка...</p>;\n  return (\n    <div className=\"p-4\">\n      <h2 className=\"text-xl font-bold mb-4\">Управление пользователями</h2>\n      <div className=\"mb-4\">\n        <Input placeholder=\"Имя\" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />\n        <Input placeholder=\"Email\" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />\n        <Button onClick={addUser}>Добавить пользователя</Button>\n      </div>\n      <Table>\n        <thead>\n          <tr>\n            <th>Имя</th>\n            <th>Email</th>\n            <th>Действия</th>\n          </tr>\n        </thead>\n        <tbody>\n          {users.map((user) => (\n            <tr key={user.id}>\n              <td>{user.name}</td>\n              <td>{user.email}</td>\n              <td>\n                <Button onClick={() => deleteUser(user.id)}>Удалить</Button>\n              </td>\n            </tr>\n          ))}\n        </tbody>\n      </Table>\n    </div>\n  );\n  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
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
      <h2 className="text-xl font-bold mb-4">Управление пользователями</h2>
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
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';

export function ChangesManagement() {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChanges = async () => {
    const response = await fetch('/api/changes');
    const data = await response.json();
    setChanges(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchChanges();
  }, []);

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">История изменений</h2>
      <Table>
        <thead>
          <tr>
            <th>Тип изменения</th>
            <th>ID товара</th>
            <th>Дата изменения</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((change) => (
            <tr key={change.id}>
              <td>{change.changeType}</td>
              <td>{change.productId}</td>
              <td>{new Date(change.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
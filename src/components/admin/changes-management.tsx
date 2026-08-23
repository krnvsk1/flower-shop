import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';

import React, { useEffect, useState } from 'react';\nimport { Button } from '@/components/ui/button';\nimport { Table } from '@/components/ui/table';\n\nimport { useEffect, useState } from 'react';
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

  useEffect(() => { fetchChanges(); }, []);

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
\n  const [changes, setChanges] = useState([]);\n  const [loading, setLoading] = useState(true);\n  const fetchChanges = async () => {\n    const response = await fetch('/api/changes');\n    const data = await response.json();\n    setChanges(data);\n    setLoading(false);\n  };\n  useEffect(() => { fetchChanges(); }, []);\n  if (loading) return <p>Загрузка...</p>;\n  return (\n    <div className=\"p-4\">\n      <h2 className=\"text-xl font-bold mb-4\">История изменений</h2>\n      <Table>\n        <thead>\n          <tr>\n            <th>Тип изменения</th>\n            <th>ID товара</th>\n            <th>Дата изменения</th>\n          </tr>\n        </thead>\n        <tbody>\n          {changes.map((change) => (\n            <tr key={change.id}>\n              <td>{change.changeType}</td>\n              <td>{change.productId}</td>\n              <td>{new Date(change.timestamp).toLocaleString()}</td>\n            </tr>\n          ))}\n        </tbody>\n      </Table>\n    </div>\n  );\n  const [changes, setChanges] = useState([]);
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
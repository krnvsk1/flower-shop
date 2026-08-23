import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';

import React, { useEffect, useState } from 'react';\nimport { Button } from '@/components/ui/button';\nimport { Table } from '@/components/ui/table';\n\nimport { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';

export function Analytics() {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSalesData = async () => {
    const response = await fetch('/api/sales');
    const data = await response.json();
    setSalesData(data);
    setLoading(false);
  };

  useEffect(() => { fetchSalesData(); }, []);

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Аналитика продаж</h2>
      <Table>
        <thead>
          <tr>
            <th>Товар</th>
            <th>Количество продаж</th>
            <th>Выручка</th>
          </tr>
        </thead>
        <tbody>
          {salesData.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.productName}</td>
              <td>{sale.quantity}</td>
              <td>{sale.revenue} ₽</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
\n  const [salesData, setSalesData] = useState([]);\n  const [loading, setLoading] = useState(true);\n  const fetchSalesData = async () => {\n    const response = await fetch('/api/sales');\n    const data = await response.json();\n    setSalesData(data);\n    setLoading(false);\n  };\n  useEffect(() => { fetchSalesData(); }, []);\n  if (loading) return <p>Загрузка...</p>;\n  return (\n    <div className=\"p-4\">\n      <h2 className=\"text-xl font-bold mb-4\">Аналитика продаж</h2>\n      <Table>\n        <thead>\n          <tr>\n            <th>Товар</th>\n            <th>Количество продаж</th>\n            <th>Выручка</th>\n          </tr>\n        </thead>\n        <tbody>\n          {salesData.map((sale) => (\n            <tr key={sale.id}>\n              <td>{sale.productName}</td>\n              <td>{sale.quantity}</td>\n              <td>{sale.revenue} ₽</td>\n            </tr>\n          ))}\n        </tbody>\n      </Table>\n    </div>\n  );\n  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSalesData = async () => {
    notifySuccess('Данные о продажах успешно загружены!');
    setLoading(true);
    const response = await fetch('/api/sales'); // API для получения данных о продажах
    const data = await response.json();
    setSalesData(data);
    setLoading(false);
  };

  useEffect(() => { fetchSalesData(); }, []);

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Аналитика продаж</h2>
      <Table>
        <thead>
          <tr>
            <th>Товар</th>
            <th>Количество продаж</th>
            <th>Выручка</th>
          </tr>
        </thead>
        <tbody>
          {salesData.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.productName}</td>
              <td>{sale.quantity}</td>
              <td>{sale.revenue} ₽</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
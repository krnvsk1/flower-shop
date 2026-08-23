import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';

export function Analytics() {
  const [salesData, setSalesData] = useState([]);
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
      <h2 className="text-lg font-bold mb-4">Аналитика продаж</h2>
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
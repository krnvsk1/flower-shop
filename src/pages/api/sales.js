import { NextApiRequest, NextApiResponse } from 'next';

interface Sale {
  id: string;
  productName: string;
  quantity: number;
  revenue: number;
}

let sales: Sale[] = [];

const initSalesData = () => {
  sales = [
    { id: '1', productName: 'Роза', quantity: 15, revenue: 1500 },
    { id: '2', productName: 'Тюльпан', quantity: 10, revenue: 1500 },
    { id: '3', productName: 'Лилия', quantity: 5, revenue: 1000 },
  ];
};

initSalesData();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json(sales);
  }

  return res.status(405).end(); // Method Not Allowed
}
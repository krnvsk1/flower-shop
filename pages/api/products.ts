import { NextApiRequest, NextApiResponse } from 'next';

typedef Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
};

let products: Product[] = [];

const initProductData = () => {
  products = [
    { id: '1', name: 'Роза', description: 'Красная роза', price: 100, stock: 10, category: 'Цветы' },
    { id: '2', name: 'Тюльпан', description: 'Желтый тюльпан', price: 150, stock: 5, category: 'Цветы' },
  ];
};

initProductData();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json(products);
  } else if (req.method === 'POST') {
    const product: Product = req.body;
    products.push({ ...product, id: `${products.length + 1}` });
    return res.status(201).json(product);
  } else if (req.method === 'DELETE') {
    const { id } = req.query;
    products = products.filter((product) => product.id !== id);
    return res.status(204).end();
  }
  return res.status(405).end(); // Method Not Allowed
}
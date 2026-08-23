import { NextApiRequest, NextApiResponse } from 'next';

let products = [];

// Middleware for initializing products (in-memory for now)
const initProductData = () => {
  products = [
    { id: '1', name: 'Роза', description: 'Красная роза', price: 100, stock: 10, category: 'Цветы', imageUrl: null },
    { id: '2', name: 'Тюльпан', description: 'Желтый тюльпан', price: 150, stock: 5, category: 'Цветы', imageUrl: null },
  ];
};

initProductData();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Return the list of products
    return res.status(200).json(products);
  } else if (req.method === 'POST') {
    // Add a new product
    const product = req.body;
    products.push({ ...product, id: `${products.length + 1}` });
    return res.status(201).json(product);
  } else if (req.method === 'DELETE') {
    const { id } = req.query;
    products = products.filter((product) => product.id !== id);
    return res.status(204).end();
  }
  return res.status(405).end(); // Method Not Allowed
}
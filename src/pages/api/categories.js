import { NextApiRequest, NextApiResponse } from 'next';

let categories: string[] = [];

const initCategoryData = () => {
  categories = ['Цветы', 'Упаковка', 'Оборудование'];
};

initCategoryData();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json(categories);
  } else if (req.method === 'POST') {
    const { name } = req.body;
    categories.push(name);
    return res.status(201).json(name);
  } else if (req.method === 'DELETE') {
    const { id } = req.query;
    categories = categories.filter((category) => category !== id);
    return res.status(204).end();
  }
  return res.status(405).end(); // Method Not Allowed
}
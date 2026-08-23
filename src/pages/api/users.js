import { NextApiRequest, NextApiResponse } from 'next';

let users: { id: string; name: string; email: string }[] = [];

const initUserData = () => {
  users = [
    { id: '1', name: 'Админ', email: 'admin@flower-shop.com' },
    { id: '2', name: 'Магазин', email: 'store@flower-shop.com' },
  ];
};

initUserData();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json(users);
  } else if (req.method === 'POST') {
    const { name, email } = req.body;
    users.push({ id: `${users.length + 1}`, name, email });
    return res.status(201).json({ name, email });
  } else if (req.method === 'DELETE') {
    const { id } = req.query;
    users = users.filter((user) => user.id !== id);
    return res.status(204).end();
  }
  return res.status(405).end(); // Method Not Allowed
}
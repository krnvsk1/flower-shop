import { NextApiRequest, NextApiResponse } from 'next';

let changes: { id: string; changeType: string; productId: string; timestamp: string }[] = [];

const initChangeData = () => {
  changes = [];
};

initChangeData();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json(changes);
  } else if (req.method === 'POST') {
    const { changeType, productId } = req.body;
    changes.push({ id: `${changes.length + 1}`, changeType, productId, timestamp: new Date().toISOString() });
    return res.status(201).json({ changeType, productId });
  }
  return res.status(405).end(); // Method Not Allowed
}
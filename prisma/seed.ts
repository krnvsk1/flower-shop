import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const flowers = [
  {
    name: 'Роза красная',
    description: 'Классическая красная роза для букетов и композиций.',
    price: 250,
    stock: 40,
    category: 'Розы',
    active: true,
  },
  {
    name: 'Тюльпан жёлтый',
    description: 'Яркие весенние тюльпаны, продаются поштучно.',
    price: 120,
    stock: 60,
    category: 'Тюльпаны',
    active: true,
  },
  {
    name: 'Лилия белая',
    description: 'Ароматные белые лилии для торжественных букетов.',
    price: 320,
    stock: 18,
    category: 'Лилии',
    active: true,
  },
  {
    name: 'Орхидея фаленопсис',
    description: 'Элегантная орхидея в горшке, цветёт несколько недель.',
    price: 890,
    stock: 8,
    category: 'Орхидеи',
    active: true,
  },
  {
    name: 'Хризантема кустовая',
    description: 'Пышные кустовые хризантемы для повседневных букетов.',
    price: 140,
    stock: 35,
    category: 'Хризантемы',
    active: true,
  },
  {
    name: 'Букет «Нежность»',
    description: 'Готовая композиция из роз, эустомы и эвкалипта.',
    price: 2500,
    stock: 6,
    category: 'Композиции',
    active: true,
  },
]

async function main() {
  const count = await db.flower.count()
  if (count > 0) {
    console.log(`Seed skipped: ${count} flowers already exist`)
    return
  }

  await db.flower.createMany({ data: flowers })
  console.log(`Seeded ${flowers.length} flowers`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

import sharp from 'sharp'
import { writeFileSync } from 'fs'

async function main() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <rect width="900" height="600" fill="#ffffff"/>
  <text x="40" y="50" font-family="DejaVu Sans, Arial, sans-serif" font-size="28" fill="#111">Приходная накладная №18</text>
  <text x="40" y="90" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" fill="#333">Поставщик ООО Цветочный рай</text>
  <text x="40" y="160" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" fill="#111">Роза красная 25 45,00</text>
  <text x="40" y="210" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" fill="#111">Тюльпан жёлтый 10 30</text>
  <text x="40" y="260" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" fill="#111">Хризантема кустовая 15 80</text>
  <text x="40" y="340" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" fill="#333">Итого 3 позиции</text>
</svg>`

  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  writeFileSync('/tmp/test-invoice.png', png)
  console.log('wrote', png.length, 'bytes')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

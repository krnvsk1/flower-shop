import assert from 'node:assert/strict'
import {
  extractJsonObject,
  parseOcrTextToRows,
  rowsFromVisionPayload,
} from '../src/lib/inbound-ocr'

function testVisionJson() {
  const payload = extractJsonObject(`\`\`\`json
{"items":[{"name":"Роза красная","quantity":25,"costPrice":45.5},{"name":"Итого","quantity":1,"costPrice":null}]}
\`\`\``)
  const rows = rowsFromVisionPayload(payload)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].name, 'Роза красная')
  assert.equal(rows[0].quantity, 25)
  assert.equal(rows[0].costPrice, 45.5)
}

function testOcrHeuristics() {
  const text = `
Приходная накладная №12
Поставщик ООО Цветы
Роза красная 50см 25 45,00
Тюльпан жёлтый — 10 шт 30
15 Хризантема кустовая 80
Итого 1125
`
  const rows = parseOcrTextToRows(text)
  assert.equal(rows.length, 3)
  assert.equal(rows[0].name, 'Роза красная 50см')
  assert.equal(rows[0].quantity, 25)
  assert.equal(rows[0].costPrice, 45)
  assert.equal(rows[1].name, 'Тюльпан жёлтый')
  assert.equal(rows[1].quantity, 10)
  assert.equal(rows[2].name, 'Хризантема кустовая')
  assert.equal(rows[2].quantity, 15)
  assert.equal(rows[2].costPrice, 80)
}

testVisionJson()
testOcrHeuristics()
console.log('inbound-ocr parser tests: ok')

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const planilhaPath = path.join(__dirname, 'dados', '859.xlsx');

console.log('\n🔍 ANALISANDO ESTRUTURA DA PLANILHA\n');

const workbook = XLSX.readFile(planilhaPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

console.log('📊 Nome da planilha:', sheetName);
console.log('\n📋 Primeiras 5 linhas em formato JSON:\n');

const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

dados.slice(0, 10).forEach((linha, index) => {
    console.log(`Linha ${index}:`, linha);
});

console.log('\n📋 Usando cabeçalhos automáticos:\n');
const dadosComCabecalho = XLSX.utils.sheet_to_json(sheet);
console.log('Primeiro registro:', JSON.stringify(dadosComCabecalho[0], null, 2));
console.log('\nSegundo registro:', JSON.stringify(dadosComCabecalho[1], null, 2));
console.log('\nTerceiro registro:', JSON.stringify(dadosComCabecalho[2], null, 2));

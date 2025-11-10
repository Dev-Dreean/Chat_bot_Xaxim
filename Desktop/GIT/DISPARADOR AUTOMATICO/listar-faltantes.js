import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
    planilhaPath: path.join(__dirname, 'dados', '859.xlsx'),
    pdfFolder: path.join(__dirname, 'documentos', 'PDFS')
};

function normalizarNome(nome) {
    return nome
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

// Ler planilha
const workbook = XLSX.readFile(CONFIG.planilhaPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const dadosArray = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
const dados = dadosArray
    .filter(linha => linha.length >= 2 && linha[0] && linha[1])
    .map(linha => ({
        Telefone: String(linha[0]).trim(),
        Nome: String(linha[1]).trim()
    }));

// Ler PDFs
const arquivosPDF = fs.readdirSync(CONFIG.pdfFolder).filter(f => f.endsWith('.pdf'));

// Encontrar faltantes
console.log('\n📋 LISTA COMPLETA DE PDFs FALTANTES\n');
console.log('='.repeat(70));

let contador = 1;
for (const registro of dados) {
    const nomeCompleto = registro.Nome;
    const telefone = registro.Telefone;

    const nomeNormalizado = normalizarNome(nomeCompleto);
    const pdfEncontrado = arquivosPDF.find(pdf => {
        const nomePDF = normalizarNome(pdf.replace('.pdf', ''));
        return nomePDF === nomeNormalizado ||
            nomePDF.includes(nomeNormalizado) ||
            nomeNormalizado.includes(nomePDF);
    });

    if (!pdfEncontrado) {
        console.log(`${contador}. ${nomeCompleto}`);
        console.log(`   Tel: ${telefone}`);
        console.log(`   PDF esperado: ${nomeCompleto}.pdf`);
        console.log('');
        contador++;
    }
}

console.log('='.repeat(70));
console.log(`\nTotal de PDFs faltantes: ${contador - 1}\n`);

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

console.log('\n🔍 VALIDADOR DE ARQUIVOS\n');
console.log('='.repeat(60));

// 1. Verificar se a planilha existe
console.log('\n📊 1. Verificando planilha...');
if (!fs.existsSync(CONFIG.planilhaPath)) {
    console.log('❌ Planilha não encontrada!');
    console.log(`   Caminho esperado: ${CONFIG.planilhaPath}`);
    process.exit(1);
}
console.log('✅ Planilha encontrada');

// 2. Ler planilha
console.log('\n📖 2. Lendo dados da planilha...');
let dados;
try {
    const workbook = XLSX.readFile(CONFIG.planilhaPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Lê como array de arrays (sem cabeçalho)
    const dadosArray = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    // Converte para objetos
    dados = dadosArray
        .filter(linha => linha.length >= 2 && linha[0] && linha[1])
        .map(linha => ({
            Telefone: String(linha[0]).trim(),
            Nome: String(linha[1]).trim()
        }));

    console.log(`✅ ${dados.length} registros encontrados`);
} catch (error) {
    console.log(`❌ Erro ao ler planilha: ${error.message}`);
    process.exit(1);
}

// 3. Verificar colunas
console.log('\n📋 3. Verificando estrutura dos dados...');
if (dados.length > 0) {
    const primeiroRegistro = dados[0];
    console.log(`   Exemplo: ${primeiroRegistro.Nome} - ${primeiroRegistro.Telefone}`);
    console.log('✅ Estrutura dos dados está correta');
}

// 4. Verificar pasta de PDFs
console.log('\n📁 4. Verificando pasta de PDFs...');
if (!fs.existsSync(CONFIG.pdfFolder)) {
    console.log('❌ Pasta de PDFs não encontrada!');
    console.log(`   Caminho esperado: ${CONFIG.pdfFolder}`);
    process.exit(1);
}

const arquivosPDF = fs.readdirSync(CONFIG.pdfFolder).filter(f => f.endsWith('.pdf'));
console.log(`✅ ${arquivosPDF.length} PDFs encontrados`);

// 5. Validar correspondência
console.log('\n🔗 5. Validando correspondência entre registros e PDFs...');
let encontrados = 0;
let naoEncontrados = 0;
const listaProblemas = [];

for (const registro of dados) {
    const nomeCompleto = registro.Nome || '';
    const telefone = registro.Telefone || '';

    if (!nomeCompleto) {
        listaProblemas.push(`❌ Registro sem nome (Tel: ${telefone || 'N/A'})`);
        naoEncontrados++;
        continue;
    }

    if (!telefone) {
        listaProblemas.push(`⚠️  ${nomeCompleto} - Sem telefone`);
    }

    const nomeNormalizado = normalizarNome(nomeCompleto);
    const pdfEncontrado = arquivosPDF.find(pdf => {
        const nomePDF = normalizarNome(pdf.replace('.pdf', ''));
        return nomePDF === nomeNormalizado ||
            nomePDF.includes(nomeNormalizado) ||
            nomeNormalizado.includes(nomePDF);
    });

    if (pdfEncontrado) {
        encontrados++;
    } else {
        listaProblemas.push(`❌ ${nomeCompleto} - PDF não encontrado`);
        naoEncontrados++;
    }
}

console.log(`\n✅ Correspondências encontradas: ${encontrados}`);
console.log(`❌ Problemas encontrados: ${naoEncontrados}`);

// 6. Mostrar problemas
if (listaProblemas.length > 0) {
    console.log('\n⚠️  LISTA DE PROBLEMAS:');
    console.log('='.repeat(60));
    listaProblemas.slice(0, 20).forEach(problema => console.log(problema));
    if (listaProblemas.length > 20) {
        console.log(`\n... e mais ${listaProblemas.length - 20} problemas`);
    }
}

// 7. Relatório final
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO DA VALIDAÇÃO');
console.log('='.repeat(60));
console.log(`📄 Total de registros: ${dados.length}`);
console.log(`📑 Total de PDFs: ${arquivosPDF.length}`);
console.log(`✅ Prontos para envio: ${encontrados}`);
console.log(`❌ Com problemas: ${naoEncontrados}`);
console.log('='.repeat(60));

if (naoEncontrados > 0) {
    console.log('\n⚠️  Resolva os problemas antes de executar o disparo!');
    console.log('\nDicas:');
    console.log('- Verifique se os nomes dos PDFs estão corretos');
    console.log('- Confirme que todos os campos da planilha estão preenchidos');
    console.log('- PDFs devem ter o mesmo nome da coluna "Nome"');
} else {
    console.log('\n🎉 Tudo certo! Você pode executar: npm start');
}

console.log('\n');

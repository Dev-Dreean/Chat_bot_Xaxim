import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import MAIN_LOGGER from './logger.js';
import qrcode from 'qrcode-terminal';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { GerenciadorExcel, ProgressoBarra } from './gerenciador-excel.js';
import { DistribuidorInteligente } from './distribuidor-inteligente.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função auxiliar para delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const logger = MAIN_LOGGER.child({});
logger.level = 'silent'; // Silencia os logs do Baileys

// Configurações
const CONFIG = {
    planilhaPath: path.join(__dirname, 'dados', '859.xlsx'),
    pdfFolder: path.join(__dirname, 'documentos', 'PDFS'),
    mensagemTemplate: `Boa tarde.

Prezado {nome}, segue seu aviso e recibo de férias.

Por gentileza conferir os seus dados e encaminhar os documentos devidamente assinados até o dia 07/11/2025, nesse mesmo e-mail (auxiliarrh.750@plansul.com.br).

FAVOR LER COM ATENÇÃO AS ORIENTAÇÕES ABAIXO:

Não aceitamos assinatura digital.
Por questões burocráticas precisamos que assine tanto o aviso como o recibo.
No AVISO DE FÉRIAS consta a mensagem "comparecer a Seção Pessoal munido de Carteira de Trabalho, a fim de receber o valor das mesmas...". Essa é uma mensagem automática do sistema, favor desconsiderar, pois as informações das férias serão atualizadas automaticamente pela Carteira de Trabalho Digital.
O pagamento das férias será creditado em sua conta até a data que consta no recibo.
Contamos com sua colaboração.`,
    delayEntreMensagens: 5000 // 5 segundos entre cada mensagem
};

// Store para manter sessões


/**
 * Lê a planilha Excel e retorna os dados
 */
function lerPlanilha() {
    try {
        logger.info(`Lendo planilha: ${CONFIG.planilhaPath}`);
        const workbook = XLSX.readFile(CONFIG.planilhaPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Lê como array de arrays (sem cabeçalho)
        const dadosArray = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        // Converte para objetos com as colunas corretas
        // Coluna 0 = Telefone, Coluna 1 = Nome
        const dados = dadosArray
            .filter(linha => linha.length >= 2 && linha[0] && linha[1]) // Ignora linhas vazias
            .map(linha => ({
                Telefone: String(linha[0]).trim(),
                Nome: String(linha[1]).trim()
            }));

        logger.info(`${dados.length} registros encontrados na planilha`);
        return dados;
    } catch (error) {
        logger.error(`Erro ao ler planilha: ${error.message}`);
        throw error;
    }
}

/**
 * Normaliza o nome do arquivo PDF
 */
function normalizarNomeArquivo(nome) {
    return nome
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .trim();
}

/**
 * Busca o arquivo PDF correspondente ao nome
 */
function buscarPDF(nomeCompleto) {
    try {
        const arquivos = fs.readdirSync(CONFIG.pdfFolder);
        const nomeNormalizado = normalizarNomeArquivo(nomeCompleto);

        // Busca exata
        let arquivoEncontrado = arquivos.find(arquivo =>
            normalizarNomeArquivo(arquivo.replace('.pdf', '')) === nomeNormalizado
        );

        // Se não encontrar, busca por similaridade
        if (!arquivoEncontrado) {
            arquivoEncontrado = arquivos.find(arquivo => {
                const nomeArquivoNormalizado = normalizarNomeArquivo(arquivo.replace('.pdf', ''));
                return nomeArquivoNormalizado.includes(nomeNormalizado) ||
                    nomeNormalizado.includes(nomeArquivoNormalizado);
            });
        }

        if (arquivoEncontrado) {
            return path.join(CONFIG.pdfFolder, arquivoEncontrado);
        }

        logger.warn(`PDF não encontrado para: ${nomeCompleto}`);
        return null;
    } catch (error) {
        logger.error(`Erro ao buscar PDF: ${error.message}`);
        return null;
    }
}

/**
 * Formata o número de telefone para o formato do WhatsApp
 */
function formatarNumeroWhatsApp(numero) {
    // Remove caracteres não numéricos
    let numeroLimpo = numero.toString().replace(/\D/g, '');

    // Se o número não começar com 55 (código do Brasil), adiciona
    if (!numeroLimpo.startsWith('55')) {
        numeroLimpo = '55' + numeroLimpo;
    }

    // Adiciona @s.whatsapp.net
    return numeroLimpo + '@s.whatsapp.net';
}

/**
 * Extrai o primeiro nome e último sobrenome
 */
function extrairPrimeiroUltimoNome(nomeCompleto) {
    const partes = nomeCompleto.trim().split(' ');
    if (partes.length === 1) {
        return partes[0];
    }
    return `${partes[0]} ${partes[partes.length - 1]}`;
}

/**
 * Função para validar o modo de execução e pedir confirmação
 */
async function validarModoExecucao(sock, meuNumero, numeroTeste) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        console.log('\n' + '='.repeat(70));
        console.log('🔒 VALIDAÇÃO DE SEGURANÇA - CONFIRMAÇÃO OBRIGATÓRIA');
        console.log('='.repeat(70));

        if (meuNumero === numeroTeste) {
            console.log('\n✅ MODO DE DESENVOLVIMENTO DETECTADO!');
            console.log('\n📋 INFORMAÇÕES DETECTADAS:');
            console.log(`   📱 Número conectado: ${meuNumero} (+55 41 9185-2345)`);
            console.log(`   🧪 Modo: TESTE E VALIDAÇÃO`);
            console.log('\n📤 FLUXO QUE SERÁ EXECUTADO:');
            console.log('   1. Sistema NÃO enviará para os 255 contatos da planilha');
            console.log('   2. Sistema enviará APENAS 3 mensagens para você mesmo');
            console.log('   3. Cada mensagem será de uma pessoa aleatória da planilha');
            console.log('   4. Você receberá: Texto + PDF em 3 rodadas diferentes');
            console.log('   5. Após completar, o programa encerrará automaticamente');
            console.log('\n⚠️  NENHUMA mensagem será enviada para outros contatos!');
            console.log('✅ É 100% SEGURO para testes.');
        } else {
            console.log('\n⚠️  MODO DE PRODUÇÃO DETECTADO!');
            console.log('\n📋 INFORMAÇÕES DETECTADAS:');
            console.log(`   📱 Número conectado: ${meuNumero}`);
            console.log(`   📊 Modo: DISPARO COMPLETO`);
            console.log('\n📤 FLUXO QUE SERÁ EXECUTADO:');
            console.log(`   1. Sistema lerá a planilha (293 registros)`);
            console.log(`   2. Sistema enviará para 255 contatos`);
            console.log(`   3. Cada envio: Mensagem personalizada + PDF`);
            console.log(`   4. Delay: 5 segundos entre cada envio`);
            console.log(`   5. Tempo estimado: ~30 minutos`);
            console.log('\n⚠️  ISTO VAI ENVIAR MENSAGENS PARA 255 CONTATOS REAIS!');
        }

        console.log('\n' + '='.repeat(70));
        console.log('');

        rl.question('▶️  Pressione ENTER para continuar (ou Ctrl+C para cancelar): ', (answer) => {
            rl.close();
            console.log('\n✅ Confirmado! Iniciando o fluxo...\n');
            console.log('='.repeat(70) + '\n');

            if (meuNumero === numeroTeste) {
                enviarTesteParaProprioNumero(sock, numeroTeste).then(() => {
                    console.log('\n' + '='.repeat(70));
                    console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
                    console.log('='.repeat(70) + '\n');
                    process.exit(0);
                }).catch(err => {
                    console.error('\n❌ Erro durante o teste:', err.message);
                    process.exit(1);
                });
            } else {
                dispararMensagens(sock);
            }

            resolve();
        });

        // Se o usuário pressionar Ctrl+C
        rl.on('SIGINT', () => {
            rl.close();
            console.log('\n\n🛑 Cancelado pelo usuário!');
            console.log('Nenhuma mensagem foi enviada.\n');
            process.exit(0);
        });
    });
}



/**
 * Inicia a conexão com o WhatsApp
 */
async function iniciarWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();


    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: state
    });

    // Manipulador de eventos de conexão

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n=== QR CODE ===');
            console.log('Escaneie o QR Code abaixo com o WhatsApp:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true;

            logger.info('Conexão fechada. Reconectando:', shouldReconnect);

            if (shouldReconnect) {
                iniciarWhatsApp();
            }
        } else if (connection === 'open') {
            logger.info('✅ Conexão estabelecida com sucesso!');
            console.log('\n✅ WhatsApp conectado com sucesso!');

            // Obtém o número do próprio usuário conectado
            let meuNumero = null;
            try {
                const authInfo = sock?.user;
                if (authInfo && authInfo.id) {
                    // Exemplo: '554191852345:88@s.whatsapp.net' ou '554191852345@s.whatsapp.net'
                    // Remove @s.whatsapp.net e o device ID (após :)
                    meuNumero = authInfo.id.replace('@s.whatsapp.net', '').split(':')[0];
                    console.log(`\n📱 Número conectado: ${meuNumero}`);
                }
            } catch (e) {
                logger.warn('Não foi possível obter o número do usuário conectado.');
            }

            // Número de teste: +55 41 9185-2345 (sem device ID)
            const numeroTeste = '554191852345';

            // Aguarda confirmação do usuário
            await validarModoExecucao(sock, meuNumero, numeroTeste);
        }
    });

    // Salvar credenciais quando atualizadas
    sock.ev.on('creds.update', saveCreds);

    return sock;
}

/**
 * Dispara as mensagens para todos os contatos
 */
async function dispararMensagens(sock) {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('🚀 INICIANDO DISPARO EM MASSA');
        console.log('='.repeat(80) + '\n');

        const dados = lerPlanilha();
        const gerenciador = new GerenciadorExcel(CONFIG.planilhaPath);
        const progresso = new ProgressoBarra(dados.length);

        // Carrega o Excel para atualizar status
        await gerenciador.carregar();

        let sucessos = 0;
        let erros = 0;
        let pdfNaoEncontrado = 0;
        let pulados = 0;

        // Obtém linhas que ainda precisam ser enviadas
        const linhasPendentes = gerenciador.obterLinhasPendentes();
        const totalPendentes = linhasPendentes.length;

        if (totalPendentes < dados.length) {
            console.log(`⏸️  Retomando de parada anterior...`);
            console.log(`✅ ${dados.length - totalPendentes} já foram enviadas`);
            console.log(`📋 ${totalPendentes} ainda precisam ser enviadas\n`);
            pulados = dados.length - totalPendentes;
        }

        for (let i = 0; i < dados.length; i++) {
            // Pula linhas já enviadas
            if (gerenciador.jaFoiEnviada(i)) {
                continue;
            }

            const registro = dados[i];
            const nomeCompleto = registro.Nome || '';
            const telefone = registro.Telefone || '';
            const tempoInicio = Date.now();

            if (!nomeCompleto || !telefone) {
                logger.warn(`Registro ${i + 1}: Dados incompletos`);
                await gerenciador.marcarErro(i, 'Dados incompletos na planilha');
                erros++;
                progresso.registrarEnvio(Date.now() - tempoInicio);
                continue;
            }

            try {
                // Formata o número
                const numeroWhatsApp = formatarNumeroWhatsApp(telefone);

                // Busca o PDF
                const caminhoPDF = buscarPDF(nomeCompleto);

                if (!caminhoPDF) {
                    await gerenciador.marcarErro(i, `PDF não encontrado para: ${nomeCompleto}`);
                    pdfNaoEncontrado++;
                    erros++;
                    progresso.registrarEnvio(Date.now() - tempoInicio);
                    continue;
                }

                // Personaliza a mensagem
                const primeiroUltimo = extrairPrimeiroUltimoNome(nomeCompleto);
                const mensagem = CONFIG.mensagemTemplate.replace('{nome}', primeiroUltimo);

                // Envia a mensagem de texto
                await sock.sendMessage(numeroWhatsApp, {
                    text: mensagem
                });

                // Aguarda um pouco antes de enviar o PDF
                await delay(2000);

                // Envia o PDF
                const pdfBuffer = fs.readFileSync(caminhoPDF);
                await sock.sendMessage(numeroWhatsApp, {
                    document: pdfBuffer,
                    mimetype: 'application/pdf',
                    fileName: path.basename(caminhoPDF)
                });

                // Marca como sucesso no Excel
                await gerenciador.marcarSucesso(i, `Enviado para: ${telefone}`);
                sucessos++;

                // Registra progresso
                progresso.registrarEnvio(Date.now() - tempoInicio);

                // Delay entre mensagens para evitar ban
                if (i < dados.length - 1) {
                    await delay(CONFIG.delayEntreMensagens);
                }

            } catch (error) {
                const motivo = error.message || 'Erro desconhecido';
                await gerenciador.marcarErro(i, motivo);
                logger.error(`Erro no envio para ${nomeCompleto}:`, error);
                erros++;
                progresso.registrarEnvio(Date.now() - tempoInicio);
            }
        }

        // Fecha o Excel com o status final
        await gerenciador.fechar();

        // Relatório final
        console.log('\n' + '='.repeat(80));
        console.log('🎉 DISPARO CONCLUÍDO!');
        console.log('='.repeat(80));
        console.log(`✅ Sucessos nesta execução: ${sucessos}`);
        console.log(`❌ Erros: ${erros}`);
        console.log(`⚠️  PDFs não encontrados: ${pdfNaoEncontrado}`);
        console.log(`⏸️  Já enviados (pulados): ${pulados}`);
        console.log(`📊 Total na planilha: ${dados.length}`);
        console.log('='.repeat(80));
        console.log('='.repeat(80));
        console.log(`\n📁 Planilha atualizada: ${CONFIG.planilhaPath}`);
        console.log('   (Verifique as cores: Verde = Enviado, Vermelho = Erro)\n');

        logger.info('Disparo de mensagens finalizado');

    } catch (error) {
        logger.error('Erro no processo de disparo:', error);
        console.error('\n❌ Erro fatal:', error.message);
    }
}

// Função para enviar 3 PDFs aleatórios para o próprio número de teste
async function enviarTesteParaProprioNumero(sock, numeroTeste) {
    try {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 INICIANDO TESTE AUTOMÁTICO');
        console.log('='.repeat(60));
        console.log(`📱 Enviando 3 mensagens de teste para: ${numeroTeste}`);
        console.log('='.repeat(60) + '\n');

        const dados = lerPlanilha();
        const enviados = new Set();
        let count = 0;

        while (count < 3 && enviados.size < dados.length) {
            // Seleciona pessoa aleatória
            const idx = Math.floor(Math.random() * dados.length);
            if (enviados.has(idx)) continue;

            enviados.add(idx);
            const registro = dados[idx];
            const nomeCompleto = registro.Nome || '';

            if (!nomeCompleto) continue;

            console.log(`\n📋 Teste ${count + 1}/3 - Processando: ${nomeCompleto}`);

            const caminhoPDF = buscarPDF(nomeCompleto);
            if (!caminhoPDF) {
                console.log(`   ⚠️  PDF não encontrado para: ${nomeCompleto}`);
                continue;
            }

            const primeiroUltimo = extrairPrimeiroUltimoNome(nomeCompleto);
            const mensagem = CONFIG.mensagemTemplate.replace('{nome}', primeiroUltimo);

            try {
                // Envia mensagem de texto
                console.log(`   📤 Enviando mensagem de texto...`);
                await sock.sendMessage(numeroTeste + '@s.whatsapp.net', { text: mensagem });
                await delay(2000);

                // Envia PDF
                console.log(`   📎 Anexando PDF: ${path.basename(caminhoPDF)}`);
                const pdfBuffer = fs.readFileSync(caminhoPDF);
                await sock.sendMessage(numeroTeste + '@s.whatsapp.net', {
                    document: pdfBuffer,
                    mimetype: 'application/pdf',
                    fileName: path.basename(caminhoPDF)
                });

                console.log(`   ✅ Teste ${count + 1}/3 enviado com sucesso!`);
                count++;

                // Delay entre mensagens
                if (count < 3) {
                    console.log(`   ⏳ Aguardando ${CONFIG.delayEntreMensagens / 1000}s antes do próximo teste...`);
                    await delay(CONFIG.delayEntreMensagens);
                }
            } catch (sendError) {
                console.log(`   ❌ Erro ao enviar: ${sendError.message}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 TESTE AUTOMÁTICO CONCLUÍDO COM SUCESSO!');
        console.log('='.repeat(60));
        console.log(`✅ ${count} mensagem(ns) de teste enviada(s) para ${numeroTeste}`);
        console.log('📱 Verifique seu WhatsApp para ver as mensagens de teste');
        console.log('='.repeat(60) + '\n');
    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ ERRO NO TESTE AUTOMÁTICO');
        console.error('='.repeat(60));
        console.error(`Erro: ${error.message}`);
        console.error('='.repeat(60) + '\n');
        logger.error('Erro no teste automático:', error);
    }
}

console.log('🚀 Iniciando disparador automático de WhatsApp...\n');
iniciarWhatsApp().catch(err => {
    logger.error('Erro ao iniciar:', err);
    console.error('❌ Erro ao iniciar:', err);
});

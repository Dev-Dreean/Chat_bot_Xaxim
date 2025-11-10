import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class GerenciadorExcel {
    constructor(caminhoExcel) {
        this.caminhoExcel = caminhoExcel;
        this.workbook = null;
        this.worksheet = null;
    }

    /**
     * Carrega o arquivo Excel
     */
    async carregar() {
        this.workbook = new ExcelJS.Workbook();
        await this.workbook.xlsx.readFile(this.caminhoExcel);
        this.worksheet = this.workbook.worksheets[0];

        // Define os headers das colunas Status e Motivo
        this.worksheet.getColumn(3).header = 'Status';
        this.worksheet.getColumn(4).header = 'Motivo';

        // Define largura das colunas
        this.worksheet.getColumn(1).width = 15;
        this.worksheet.getColumn(2).width = 35;
        this.worksheet.getColumn(3).width = 12;
        this.worksheet.getColumn(4).width = 40;

        // Define cabeçalho
        const headerRow = this.worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF366092' }
        };
    }

    /**
     * Marca uma linha como enviada com sucesso (verde)
     */
    async marcarSucesso(numeroLinha, detalhes = '') {
        const row = this.worksheet.getRow(numeroLinha + 1); // +1 porque a primeira linha é cabeçalho

        // Cor verde
        row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC6EFCE' } // Verde claro
        };

        // Define status e motivo
        row.getCell(3).value = '✅ Enviado';
        row.getCell(3).font = { color: { argb: 'FF008000' }, bold: true };

        row.getCell(4).value = detalhes || 'Mensagem e PDF enviados com sucesso';

        // Salva o arquivo
        await this.workbook.xlsx.writeFile(this.caminhoExcel);
    }

    /**
     * Marca uma linha como erro (vermelho)
     */
    async marcarErro(numeroLinha, motivo = 'Erro desconhecido') {
        const row = this.worksheet.getRow(numeroLinha + 1);

        // Cor vermelha
        row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFC7CE' } // Vermelho claro
        };

        // Define status e motivo
        row.getCell(3).value = '❌ Erro';
        row.getCell(3).font = { color: { argb: 'FF9C0006' }, bold: true };

        row.getCell(4).value = motivo;

        // Salva o arquivo
        await this.workbook.xlsx.writeFile(this.caminhoExcel);
    }

    /**
     * Obtém o número total de registros (excluindo cabeçalho)
     */
    getTotalRegistros() {
        return this.worksheet.rowCount - 1;
    }

    /**
     * Verifica se uma linha já foi enviada
     */
    jaFoiEnviada(numeroLinha) {
        const row = this.worksheet.getRow(numeroLinha + 1);
        const statusCell = row.getCell(3).value;
        return statusCell && statusCell.includes('✅');
    }

    /**
     * Retorna lista de índices que ainda precisam ser enviados
     */
    obterLinhasPendentes() {
        const pendentes = [];
        for (let i = 0; i < this.getTotalRegistros(); i++) {
            if (!this.jaFoiEnviada(i)) {
                pendentes.push(i);
            }
        }
        return pendentes;
    }

    /**
     * Fecha o workbook
     */
    async fechar() {
        if (this.workbook) {
            await this.workbook.xlsx.writeFile(this.caminhoExcel);
        }
    }
}

/**
 * Calcula e exibe a barra de progresso com ETA
 */
export class ProgressoBarra {
    constructor(total) {
        this.total = total;
        this.atual = 0;
        this.tempoInicio = Date.now();
        this.temposEnvio = []; // Armazena tempos individuais de envio
    }

    /**
     * Registra um envio e atualiza o progresso
     */
    registrarEnvio(tempoDecorrido) {
        this.atual++;
        this.temposEnvio.push(tempoDecorrido);
        this.exibir();
    }

    /**
     * Exibe a barra de progresso atualizada
     */
    exibir() {
        const percentual = Math.round((this.atual / this.total) * 100);
        const barraLargura = 40;
        const barraPreenchida = Math.round((percentual / 100) * barraLargura);
        const barraVazia = barraLargura - barraPreenchida;

        // Cria a barra visual
        const barra = '█'.repeat(barraPreenchida) + '░'.repeat(barraVazia);

        // Calcula tempo médio
        const tempoMedio =
            this.temposEnvio.length > 0
                ? this.temposEnvio.reduce((a, b) => a + b, 0) / this.temposEnvio.length
                : 0;

        // Calcula tempo restante
        const registrosRestantes = this.total - this.atual;
        const tempoRestanteMs = registrosRestantes * tempoMedio;
        const tempoRestante = this.formatarTempo(tempoRestanteMs);

        // Calcula hora de término
        const agora = new Date();
        const horarioTermino = new Date(agora.getTime() + tempoRestanteMs);
        const horaFormatada = horarioTermino.toLocaleTimeString('pt-BR');

        // Tempo decorrido
        const tempoDecorridoMs = Date.now() - this.tempoInicio;
        const tempoDecorrido = this.formatarTempo(tempoDecorridoMs);

        // Limpa a linha anterior (move cursor para o início e limpa a linha)
        process.stdout.write('\r\x1b[K');

        // Exibe o progresso
        console.log(
            `📊 ${this.atual}/${this.total} | [${barra}] ${percentual}% | ⏱️ ${tempoDecorrido} | ⏳ Restante: ${tempoRestante} | 🕐 Término: ${horaFormatada}`
        );
    }

    /**
     * Formata tempo em ms para formato legível
     */
    formatarTempo(ms) {
        const segundos = Math.floor((ms / 1000) % 60);
        const minutos = Math.floor((ms / (1000 * 60)) % 60);
        const horas = Math.floor((ms / (1000 * 60 * 60)) % 24);

        const partes = [];
        if (horas > 0) partes.push(`${horas}h`);
        if (minutos > 0) partes.push(`${minutos}m`);
        if (segundos > 0 || partes.length === 0) partes.push(`${segundos}s`);

        return partes.join(' ');
    }
}

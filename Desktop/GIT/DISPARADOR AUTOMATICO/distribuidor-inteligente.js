/**
 * Distribuidor Inteligente de Envios - Anti-Spam
 * Calcula delay dinâmico baseado em:
 * - Horário atual
 * - Quantidade de pessoas
 * - Horário de término (18h)
 * - Simula comportamento humano com variação
 */

export class DistribuidorInteligente {
    constructor(totalPessoas, horarioTermino = 18) {
        this.totalPessoas = totalPessoas;
        this.horarioTermino = horarioTermino; // 18h padrão
        this.pessoasEnviadas = 0;
        this.tempoInicio = Date.now();
        this.delays = [];
    }

    /**
     * Calcula o delay ideal baseado no tempo disponível
     */
    calcularDelayIdeal() {
        const agora = new Date();
        const horaAtual = agora.getHours();
        const minutoAtual = agora.getMinutes();

        // Se já passou do horário de término, envia rápido (10-15s)
        if (horaAtual >= this.horarioTermino) {
            return this.randomizar(10000, 15000);
        }

        // Calcula tempo disponível em milissegundos
        const minutosTotais = (this.horarioTermino - horaAtual) * 60 - minutoAtual;
        const msTotais = minutosTotais * 60 * 1000;

        // Calcula delay médio
        const delayMedio = Math.floor(msTotais / this.totalPessoas);

        // Retorna delay com variação (± 30%)
        const variacao = delayMedio * 0.3;
        return this.randomizar(
            Math.max(3000, delayMedio - variacao), // Mínimo 3s
            delayMedio + variacao
        );
    }

    /**
     * Simula comportamento humano com variação
     */
    randomizar(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Retorna informações do envio
     */
    obterInfos() {
        const agora = new Date();
        const horaAtual = agora.getHours();
        const minutoAtual = agora.getMinutes();

        const minutosTotais = Math.max(0, (this.horarioTermino - horaAtual) * 60 - minutoAtual);
        const pessoasRestantes = this.totalPessoas - this.pessoasEnviadas;

        return {
            horaAtual: `${String(horaAtual).padStart(2, '0')}:${String(minutoAtual).padStart(2, '0')}`,
            horarioTermino: `${this.horarioTermino}:00`,
            tempoRestanteMinutos: minutosTotais,
            pessoasEnviadas: this.pessoasEnviadas,
            pessoasRestantes: pessoasRestantes,
            percentual: Math.round((this.pessoasEnviadas / this.totalPessoas) * 100)
        };
    }

    /**
     * Registra um envio
     */
    registrarEnvio() {
        this.pessoasEnviadas++;
    }

    /**
     * Formata tempo em minutos para "Xh Ym"
     */
    formatarTempo(minutos) {
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        if (horas > 0) {
            return `${horas}h ${mins}m`;
        }
        return `${mins}m`;
    }

    /**
     * Retorna mensagem formatada para exibição
     */
    exibirProgresso() {
        const infos = this.obterInfos();
        const tempoFormatado = this.formatarTempo(infos.tempoRestanteMinutos);

        return {
            linha1: `⏱️ Distribuição Inteligente: ${infos.pessoasEnviadas}/${this.totalPessoas} | ${infos.percentual}%`,
            linha2: `🕐 ${infos.horaAtual} → ${infos.horarioTermino} | ${tempoFormatado} restante`,
            detalhes: infos
        };
    }
}

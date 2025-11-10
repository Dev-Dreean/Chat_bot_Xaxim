/**
 * Distribuidor Inteligente de Mensagens
 * Calcula a velocidade ótima de envio baseado no horário comercial disponível
 * Simula comportamento humano para evitar bloqueios do WhatsApp
 */

export class DistribuidorInteligente {
    constructor(horaInicio = 8, horaFim = 18) {
        this.horaInicio = horaInicio;
        this.horaFim = horaFim;
        this.delayCritico = 300; // 5 minutos mínimo entre mensagens (muito agressivo)
        this.delayRecomendado = 5000; // 5 segundos entre mensagens
        this.delayConservador = 8000; // 8 segundos entre mensagens
    }

    /**
     * Calcula o delay dinâmico baseado na quantidade de pessoas e horário disponível
     * @param {number} totalPessoas - Total de pessoas para enviar
     * @param {Date} horaAtual - Hora atual
     * @returns {object} { delay, velocidade, tempoTotal, horaTermino }
     */
    calcularDelayDinamico(totalPessoas, horaAtual = new Date()) {
        const horaAgora = horaAtual.getHours();
        const minutoAgora = horaAtual.getMinutes();

        // Se fora do horário comercial, usa delay muito conservador
        if (horaAgora < this.horaInicio || horaAgora >= this.horaFim) {
            return {
                delay: 15000, // 15 segundos
                velocidade: 'NOTURNA (MUITO LENTA)',
                tempoTotal: Math.ceil((totalPessoas * 15000) / 1000 / 60),
                horaTermino: new Date(horaAtual.getTime() + totalPessoas * 15000),
                aviso: '⚠️  Fora do horário comercial - usando delay máximo de segurança'
            };
        }

        // Calcula horas restantes até o final do dia comercial
        let minutosRestantes = 0;
        if (horaAgora < this.horaFim) {
            minutosRestantes = (this.horaFim - horaAgora) * 60 - minutoAgora;
        }

        // Se menos de 30 minutos, aviso urgente
        if (minutosRestantes < 30 && horaAgora > this.horaFim - 1) {
            return {
                delay: 3000, // 3 segundos - máximo agressivo
                velocidade: 'CRÍTICA (FINAL DO DIA)',
                tempoTotal: Math.ceil((totalPessoas * 3000) / 1000 / 60),
                horaTermino: new Date(horaAtual.getTime() + totalPessoas * 3000),
                aviso: '⚠️  ⏰ Pouco tempo restante do dia comercial! Acelerando envios...'
            };
        }

        // Calcula delay necessário para distribuir uniformemente ao longo do dia
        const segundosRestantes = minutosRestantes * 60;
        const delayCalculado = Math.ceil((segundosRestantes * 1000) / totalPessoas);

        // Aplica limites de segurança
        let delayFinal = delayCalculado;
        let velocidade = 'EQUILIBRADA';

        if (delayFinal < 3000) {
            // Muito rápido - perigoso
            delayFinal = 3000;
            velocidade = 'RÁPIDA (RISCO MODERADO)';
        } else if (delayFinal < 5000) {
            // Normal/rápido
            velocidade = 'NORMAL';
        } else if (delayFinal < 8000) {
            // Normal
            velocidade = 'CONFORTÁVEL';
        } else {
            // Lenta/segura
            velocidade = 'CONSERVADORA (MUITO SEGURA)';
        }

        const horaTermino = new Date(horaAtual.getTime() + totalPessoas * delayFinal);

        return {
            delay: delayFinal,
            velocidade,
            tempoTotal: Math.ceil((totalPessoas * delayFinal) / 1000 / 60),
            horaTermino,
            minutosRestantes,
            segundosRestantes,
            aviso: null
        };
    }

    /**
     * Gera variação aleatória no delay para simular comportamento humano
     * @param {number} delayBase - Delay base em ms
     * @returns {number} Delay com variação aleatória
     */
    gerarDelayComVariacao(delayBase) {
        // Varia entre -10% e +20% do delay base
        const variacao = delayBase * (0.9 + Math.random() * 0.3);
        return Math.ceil(variacao);
    }

    /**
     * Cria um plano de distribuição completo
     * @param {number} totalPessoas - Total de contatos
     * @returns {object} Plano detalhado de distribuição
     */
    criarPlanoDeDistribuicao(totalPessoas) {
        const agora = new Date();
        const info = this.calcularDelayDinamico(totalPessoas, agora);

        return {
            horarioInicio: agora,
            horarioTermino: info.horaTermino,
            totalPessoas,
            delay: info.delay,
            velocidade: info.velocidade,
            tempoTotalMinutos: info.tempoTotal,
            tempoTotalHoras: (info.tempoTotal / 60).toFixed(2),
            minutosRestantes: info.minutosRestantes,
            aviso: info.aviso,
            recomendacoes: this.gerarRecomendacoes(info)
        };
    }

    /**
     * Gera recomendações baseado na distribuição
     */
    gerarRecomendacoes(info) {
        const recomendacoes = [];

        if (info.delay < 3000) {
            recomendacoes.push('❌ RISCO ALTO: Delay muito agressivo. WhatsApp pode bloquear.');
            recomendacoes.push('💡 Sugere: Reduzir quantidade ou estender horário');
        } else if (info.delay < 5000) {
            recomendacoes.push('⚠️  RISCO MODERADO: Delay agressivo. Monitorar bloqueios.');
            recomendacoes.push('💡 Sugere: Aumentar delay para 5-8 segundos');
        } else if (info.delay >= 5000 && info.delay < 8000) {
            recomendacoes.push('✅ SEGURO: Velocidade dentro da norma. Baixo risco.');
        } else {
            recomendacoes.push('✅✅ MUITO SEGURO: Velocidade conservadora. Risco mínimo.');
        }

        return recomendacoes;
    }

    /**
     * Formata o plano para exibição no console
     */
    formatarPlano(plano) {
        const linhas = [
            '\n' + '='.repeat(80),
            '📊 PLANO DE DISTRIBUIÇÃO INTELIGENTE',
            '='.repeat(80),
            `📱 Total de pessoas: ${plano.totalPessoas}`,
            `⏱️  Delay entre mensagens: ${(plano.delay / 1000).toFixed(1)}s`,
            `🚀 Velocidade: ${plano.velocidade}`,
            `⏳ Tempo total: ${plano.tempoTotalMinutos}m (${plano.tempoTotalHoras}h)`,
            `🕐 Início: ${plano.horarioInicio.toLocaleTimeString('pt-BR')}`,
            `🕐 Término previsto: ${plano.horarioTermino.toLocaleTimeString('pt-BR')}`,
            '',
            '📋 RECOMENDAÇÕES:',
            ...plano.recomendacoes,
            '='.repeat(80) + '\n'
        ];

        if (plano.aviso) {
            linhas.push(`\n${plano.aviso}\n`);
        }

        return linhas.join('\n');
    }
}

/**
 * Gerenciador de Rate Limiting Anti-Spam
 * Monitora e previne bloqueios
 */
export class GerenciadorRateLimiting {
    constructor() {
        this.envios = []; // Histórico de envios com timestamp
        this.bloqueios = []; // Histórico de possíveis bloqueios
        this.limiteEnviosPorMinuto = 12; // Máximo 12 mensagens por minuto (agressivo)
        this.limiteEnviosPor5Minutos = 30; // Máximo 30 por 5 minutos (conservador)
        this.limiteEnviosPorHora = 200; // Máximo 200 por hora
    }

    /**
     * Registra um envio e verifica rate limiting
     */
    registrarEnvio() {
        const agora = Date.now();
        this.envios.push(agora);

        // Remove envios antigos (> 1 hora)
        this.envios = this.envios.filter(t => agora - t < 3600000);

        return this.verificarLimites();
    }

    /**
     * Verifica se está violando limites
     */
    verificarLimites() {
        const agora = Date.now();
        const umMinutoAtras = agora - 60000;
        const cincoMinutosAtras = agora - 300000;
        const umaHoraAtras = agora - 3600000;

        const enviosUmMinuto = this.envios.filter(t => t > umMinutoAtras).length;
        const enviosCincoMinutos = this.envios.filter(t => t > cincoMinutosAtras).length;
        const enviosUmaHora = this.envios.filter(t => t > umaHoraAtras).length;

        const resultado = {
            enviosUmMinuto,
            enviosCincoMinutos,
            enviosUmaHora,
            violacoes: [],
            status: 'OK'
        };

        if (enviosUmMinuto > this.limiteEnviosPorMinuto) {
            resultado.violacoes.push(
                `⚠️  ${enviosUmMinuto} envios em 1 minuto (limite: ${this.limiteEnviosPorMinuto})`
            );
            resultado.status = 'ALERTA';
        }

        if (enviosCincoMinutos > this.limiteEnviosPor5Minutos) {
            resultado.violacoes.push(
                `❌ ${enviosCincoMinutos} envios em 5 minutos (limite: ${this.limiteEnviosPor5Minutos})`
            );
            resultado.status = 'CRÍTICO';
        }

        if (enviosUmaHora > this.limiteEnviosPorHora) {
            resultado.violacoes.push(
                `❌❌ ${enviosUmaHora} envios em 1 hora (limite: ${this.limiteEnviosPorHora})`
            );
            resultado.status = 'BLOQUEIO';
        }

        return resultado;
    }

    /**
     * Sugere pausa se necessário
     */
    verificarNecessidadePausa() {
        const status = this.verificarLimites();

        if (status.status === 'BLOQUEIO') {
            return {
                pausaRecomendada: true,
                tempoMs: 600000, // 10 minutos
                mensagem: '🛑 BLOQUEIO DETECTADO: Pausando por 10 minutos'
            };
        }

        if (status.status === 'CRÍTICO') {
            return {
                pausaRecomendada: true,
                tempoMs: 300000, // 5 minutos
                mensagem: '⚠️  LIMITE CRÍTICO: Pausando por 5 minutos'
            };
        }

        if (status.status === 'ALERTA') {
            return {
                pausaRecomendada: true,
                tempoMs: 120000, // 2 minutos
                mensagem: '⏸️  ALERTA: Pausando por 2 minutos'
            };
        }

        return {
            pausaRecomendada: false,
            mensagem: '✅ Taxa normal - continuando envios'
        };
    }
}

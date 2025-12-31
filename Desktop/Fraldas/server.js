// --- SERVIDOR BACKEND PARA GERAR LINKS DO MERCADO PAGO ---
// Para rodar: node server.js

const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(express.json());
app.use(cors());

// --- USANDO VARIÁVEIS DE AMBIENTE PARA SEGURANÇA ---
const accessToken = process.env.MERCADO_PAGO_TOKEN || 'APP_USR-3201161202720205-122917-68a4e13640ec7bb313cfb014e2da5e9d-3100407384';

const client = new MercadoPagoConfig({
    accessToken: accessToken
});

// CORS configurado para Netlify
app.use(cors({
    origin: [
        'https://warm-unicorn-a13d8c.netlify.app',
        'http://localhost:3000',
        'http://localhost:8080'
    ],
    credentials: true
}));

app.post('/create_preference', async (req, res) => {
    try {
        const { title, price, quantity } = req.body;
        console.log(`💰 Criando link: ${title} - R$ ${price}`);

        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items: [
                    {
                        title: title,
                        quantity: quantity || 1,
                        unit_price: Number(price),
                        currency_id: 'BRL',
                    }
                ],
                external_reference: String(price)
            }
        });

        res.json({ init_point: result.init_point });

    } catch (error) {
        console.error("❌ Erro no Mercado Pago:", error);
        res.status(500).json({ error: "Erro ao conectar com Mercado Pago" });
    }
});

// Health check para Render
app.get('/', (req, res) => {
    res.json({ status: 'Backend rodando com sucesso!' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🤖 Robô Backend rodando na porta ${PORT}`);
    console.log(`🔑 Usando chave final: ...${accessToken.slice(-6)}`);
    console.log(`✅ Backend pronto para receber requisições!`);
});
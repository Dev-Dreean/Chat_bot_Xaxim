# 🎉 DEPLOY GUIA - Chá de Fraldas do Ethan

## 📋 CHECKLIST DE DEPLOYMENT

### 1️⃣ PREPARE O GIT
```bash
git add .
git commit -m "Ajustes para deployment em Render"
git push origin main
```

### 2️⃣ DEPLOY NO RENDER (BACKEND)

**Passo a passo:**

1. Acesse: https://render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub: https://github.com/Dev-Dreean/Mercado-pago.git
4. Preencha assim:
   - **Name**: `fraldas-backend`
   - **Region**: `São Paulo (sa-paulo)` (mais rápido para Brasil)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (começa gratuito)

5. **Environment Variables** (clique em "Add Environment Variable"):
   ```
   MERCADO_PAGO_TOKEN = APP_USR-3201161202720205-122917-68a4e13640ec7bb313cfb014e2da5e9d-3100407384
   ```

6. Clique em **"Create Web Service"**
7. **Copie a URL** do seu serviço (ex: `https://fraldas-backend.onrender.com`)

### 3️⃣ CONFIGURE A URL NO INDEX.HTML

No seu arquivo `index.html`, procure por:
```javascript
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080'
    : 'https://fraldas-backend.onrender.com'; // ALTERE AQUI
```

**Substitua `fraldas-backend.onrender.com` pela URL que o Render gerou para você.**

### 4️⃣ DEPLOY NO NETLIFY (FRONTEND)

1. Acesse: https://app.netlify.com
2. **Opção A (Mais fácil):**
   - Drag and drop o arquivo `index.html`
   - Netlify cria um site automático

3. **Opção B (Com Git):**
   - Clique em "New site from Git"
   - Conecte seu repositório GitHub
   - Build command: (deixe em branco)
   - Publish directory: `.` (raiz do projeto)

### 5️⃣ TESTE NO MOBILE

```
1. Abra a URL do Netlify no celular
2. Clique em "Pagar"
3. Veja se consegue gerar o link do Mercado Pago
4. Tente completar um pagamento de teste
```

## ⚠️ POSSÍVEIS ERROS E SOLUÇÕES

### ❌ "CORS Error" ou "Failed to fetch"
**Solução:** Verifique se a URL do Render no `index.html` está EXATAMENTE igual à fornecida pelo Render.

### ❌ "Backend On" não aparece
**Solução:** É normal! Significa que o backend está em produção (Render) e não local.

### ❌ Render diz "Service failed to start"
**Solução:** 
- Verifique se o `package.json` está correto
- Veja os logs no dashboard do Render
- Confirme que o `MERCADO_PAGO_TOKEN` está preenchido

### ❌ Página fica lenta no celular
**Solução:** O plano Free do Render desativa quando não há tráfego. Pode levar 30s na primeira requisição. Atualize para pago se quiser performance melhor.

## 🧪 TESTE RÁPIDO

Após fazer o deploy, teste a API assim:
```
https://fraldas-backend.onrender.com/
```
Você deve ver: `{"status":"Backend rodando com sucesso!"}`

## 📱 URL FINAL PARA COMPARTILHAR

```
https://warm-unicorn-a13d8c.netlify.app/
```

Está pronto para usar no mobile! ✅

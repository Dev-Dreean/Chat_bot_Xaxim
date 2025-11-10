# 🤖 Disparador Automático de WhatsApp com Baileys

Sistema automatizado para envio de mensagens personalizadas no WhatsApp com anexo de documentos em PDF.

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- Uma conta do WhatsApp
- Planilha Excel com os dados dos destinatários
- Arquivos PDF nomeados com o nome completo dos destinatários

## 🚀 Instalação

1. Abra o terminal no diretório do projeto

2. Instale as dependências:
```bash
npm install
```

## 📊 Estrutura da Planilha

A planilha Excel deve conter as seguintes colunas:

| Nome | Telefone |
|------|----------|
| JOAO DA SILVA | 11999999999 |
| MARIA SANTOS | 11988888888 |

**Importante:**
- A coluna `Nome` deve conter o nome completo (igual ao nome do arquivo PDF)
- A coluna `Telefone` deve conter apenas números (pode incluir ou não o DDD e o código do país)

## 📁 Estrutura de Pastas

```
DISPARADOR AUTOMATICO/
├── dados/
│   └── 859.xlsx              # Planilha com os contatos
├── documentos/
│   └── PDFS/
│       ├── JOAO DA SILVA.pdf
│       ├── MARIA SANTOS.pdf
│       └── ...
├── node_modules/
├── auth_info_baileys/        # Criado automaticamente (sessão do WhatsApp)
├── index.js                  # Código principal
├── logger.js                 # Sistema de logs
├── package.json
└── README.md
```

## 🎯 Como Usar

### 1. Prepare seus arquivos
- Coloque a planilha Excel na pasta `dados/`
- Coloque os PDFs na pasta `documentos/PDFS/`
- Certifique-se de que os nomes dos PDFs correspondem aos nomes na planilha

### 2. Execute o programa
```bash
npm start
```

### 3. Conecte o WhatsApp
- Um QR Code aparecerá no terminal
- Abra o WhatsApp no seu celular
- Vá em **Aparelhos Conectados** > **Conectar um aparelho**
- Escaneie o QR Code exibido no terminal

### 4. Aguarde o processamento
O sistema irá:
1. Ler a planilha
2. Para cada contato:
   - Buscar o PDF correspondente
   - Personalizar a mensagem com o nome
   - Enviar a mensagem de texto
   - Enviar o documento PDF
   - Aguardar 5 segundos antes da próxima mensagem

## ⚙️ Configurações

Você pode ajustar as configurações no arquivo `index.js`:

```javascript
const CONFIG = {
    planilhaPath: path.join(__dirname, 'dados', '859.xlsx'),
    pdfFolder: path.join(__dirname, 'documentos', 'PDFS'),
    mensagemTemplate: `...`, // Seu template de mensagem
    delayEntreMensagens: 5000 // Tempo em milissegundos entre mensagens
};
```

### Alterar o delay entre mensagens
**Recomendado:** Mínimo de 3 segundos (3000ms) para evitar bloqueios do WhatsApp

```javascript
delayEntreMensagens: 5000 // 5 segundos
```

### Personalizar a mensagem
A mensagem usa `{nome}` como variável que será substituída pelo primeiro e último nome do destinatário:

```javascript
mensagemTemplate: `Olá {nome}, sua mensagem aqui...`
```

## 📝 Mensagem Atual

```
Boa tarde.

Prezado {nome}, segue seu aviso e recibo de férias.

Por gentileza conferir os seus dados e encaminhar os documentos devidamente assinados até o dia 07/11/2025, nesse mesmo e-mail (auxiliarrh.750@plansul.com.br).

FAVOR LER COM ATENÇÃO AS ORIENTAÇÕES ABAIXO:

Não aceitamos assinatura digital.
Por questões burocráticas precisamos que assine tanto o aviso como o recibo.
No AVISO DE FÉRIAS consta a mensagem "comparecer a Seção Pessoal munido de Carteira de Trabalho, a fim de receber o valor das mesmas...". Essa é uma mensagem automática do sistema, favor desconsiderar, pois as informações das férias serão atualizadas automaticamente pela Carteira de Trabalho Digital.
O pagamento das férias será creditado em sua conta até a data que consta no recibo.
Contamos com sua colaboração.
```

## 🔍 Formato dos Números

O sistema aceita números em diversos formatos:
- `11999999999` (sem código do país)
- `5511999999999` (com código do país)
- `(11) 99999-9999` (com formatação - será limpo automaticamente)

O sistema adiciona automaticamente o código do Brasil (55) se necessário.

## 📊 Relatório

Ao final do processamento, você verá um relatório com:
- ✅ Número de mensagens enviadas com sucesso
- ❌ Número de erros
- 📄 Número de PDFs não encontrados
- 📊 Total de registros processados

## ⚠️ Avisos Importantes

1. **Limite de Mensagens**: O WhatsApp pode bloquear contas que enviam muitas mensagens em pouco tempo. Use delays adequados.

2. **Correspondência de Nomes**: Os nomes dos arquivos PDF devem corresponder exatamente aos nomes na planilha (o sistema ignora acentos e maiúsculas/minúsculas).

3. **Sessão do WhatsApp**: Após a primeira conexão, a sessão fica salva em `auth_info_baileys/`. Você não precisará escanear o QR Code novamente.

4. **Backup**: Sempre faça backup da pasta `auth_info_baileys/` para não perder a sessão.

## 🛠️ Solução de Problemas

### "PDF não encontrado"
- Verifique se o nome do PDF corresponde ao nome na planilha
- Certifique-se de que o PDF está na pasta `documentos/PDFS/`

### "Erro ao ler planilha"
- Verifique se a planilha está no formato Excel (.xlsx)
- Confirme que as colunas se chamam "Nome" e "Telefone"
- Feche o arquivo Excel antes de executar o programa

### "Erro ao enviar mensagem"
- Verifique se o número está correto
- Confirme que o contato existe no WhatsApp
- Verifique sua conexão com a internet

### QR Code não aparece
- Certifique-se de que não existe a pasta `auth_info_baileys/`
- Se existir, delete-a para gerar um novo QR Code

## 📞 Ajustando os Nomes das Colunas

Se sua planilha usa nomes diferentes, edite estas linhas no `index.js`:

```javascript
const nomeCompleto = registro['Nome'] || registro['NOME'] || registro['nome'] || '';
const telefone = registro['Telefone'] || registro['TELEFONE'] || registro['telefone'] || '';
```

Adicione os nomes das suas colunas.

## 🔐 Segurança

- Nunca compartilhe a pasta `auth_info_baileys/`
- Não exponha seus logs publicamente
- Use este sistema com responsabilidade

## 📜 Licença

ISC

---

**Desenvolvido com Baileys - A melhor biblioteca para WhatsApp Web**

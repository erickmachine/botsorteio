# Bot WhatsApp - Roleta da Caixa Magica Diamond

Bot de WhatsApp que realiza sorteios de numeros (1 a 100) e informa o premio de cada numero sorteado, baseado na **Roleta da Caixa Magica Diamond**.

Construido com [Baileys](https://github.com/WhiskeySockets/Baileys) - conecta via QR Code, **sem precisar de navegador/Chrome**, ideal para rodar em VPS.

---

## Comandos do bot

Mande no WhatsApp (privado ou grupo):

| Comando | O que faz |
|---|---|
| `/sorteio` | Sorteia **1** numero aleatorio (1 a 100) |
| `/sorteio 4` | Sorteia **4** numeros aleatorios diferentes |
| `/sorteio 3, 5` | Faz **2 sorteios**: um com 3 numeros e outro com 5 |
| `/premio 22` | Mostra o premio do numero 22 |
| `/ajuda` | Mostra a lista de comandos |

O bot responde com a lista de numeros sorteados **e o premio que cada um deu**.

---

## Como rodar no seu PC (teste rapido)

Precisa do [Node.js 20+](https://nodejs.org).

```bash
cd whatsapp-bot
npm install
npm start
```

Vai aparecer um **QR Code** no terminal. Abra o WhatsApp no celular:
**Configuracoes > Aparelhos conectados > Conectar um aparelho** e escaneie.

Pronto! Mande `/ajuda` para o numero conectado.

> A sessao fica salva na pasta `auth/`. Da proxima vez nao precisa escanear de novo.
> Se quiser trocar de conta, apague a pasta `auth/` e reinicie.

---

## Como instalar numa VPS (passo a passo)

Funciona em qualquer VPS Linux (Ubuntu/Debian recomendado).

### 1. Conecte na VPS via SSH

```bash
ssh root@SEU_IP_DA_VPS
```

### 2. Instale o Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

Confirme a versao:

```bash
node -v   # deve mostrar v20.x ou superior
```

### 3. Baixe o projeto do GitHub

Troque pela URL do seu repositorio:

```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO/whatsapp-bot
```

### 4. Instale as dependencias

```bash
npm install
```

### 5. Rode o bot e escaneie o QR Code

```bash
npm start
```

O QR Code aparece no terminal. Escaneie com o WhatsApp
(**Aparelhos conectados > Conectar um aparelho**).

Quando aparecer `Bot conectado com sucesso!`, esta funcionando.

---

## Manter o bot rodando 24/7 (PM2)

Se voce fechar o SSH, o bot para. Use o **PM2** para mante-lo ligado para sempre.

### Instale o PM2

```bash
sudo npm install -g pm2
```

### Inicie o bot com PM2

```bash
cd ~/SEU_REPOSITORIO/whatsapp-bot
pm2 start src/index.js --name caixa-magica-bot
```

### Veja o QR Code (na primeira vez)

```bash
pm2 logs caixa-magica-bot
```

Escaneie o QR que aparecer. Depois aperte `Ctrl + C` para sair dos logs (o bot continua rodando).

### Fazer o bot iniciar sozinho quando a VPS reiniciar

```bash
pm2 startup
pm2 save
```

### Comandos uteis do PM2

```bash
pm2 list                      # ver bots rodando
pm2 logs caixa-magica-bot     # ver logs / QR code
pm2 restart caixa-magica-bot  # reiniciar
pm2 stop caixa-magica-bot     # parar
pm2 delete caixa-magica-bot   # remover
```

---

## Atualizar o bot depois (quando mudar o codigo)

```bash
cd ~/SEU_REPOSITORIO
git pull
cd whatsapp-bot
npm install
pm2 restart caixa-magica-bot
```

---

## Estrutura do projeto

```
whatsapp-bot/
├── src/
│   ├── index.js     # Conexao com WhatsApp e tratamento de comandos
│   ├── sorteio.js   # Logica de sortear numeros e montar mensagens
│   └── premios.js   # Lista dos 100 premios da roleta
├── package.json
├── .gitignore
└── README.md
```

---

## Avisos importantes

- **NUNCA suba a pasta `auth/` para o GitHub** - ela contem a sessao da sua conta do WhatsApp. O `.gitignore` ja bloqueia isso.
- Use de preferencia um **numero secundario** (chip extra), pois e uma conexao nao-oficial.
- Para editar os premios, mexa no arquivo `src/premios.js`.

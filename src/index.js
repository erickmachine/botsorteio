import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys"
import { Boom } from "@hapi/boom"
import qrcode from "qrcode-terminal"
import pino from "pino"

import { PREMIOS } from "./premios.js"
import { sortearNumeros, montarMensagemSorteio, parseQuantidades } from "./sorteio.js"

// Logger silencioso (so erros) para nao poluir o terminal
const logger = pino({ level: "silent" })

// Texto de ajuda
const TEXTO_AJUDA = [
  "\uD83C\uDFB0 *VallenBot \u2014 Caixa M\u00E1gica de Vallen Faust* \uD83C\uDFB0",
  "",
  "\u2796\u1AD3\u2796\u1AD3\u2772\uD83C\uDFB2\uD83D\uDCE6\uD83C\uDFB2\u2773\u1AD3\u2796\u1AD3\u2796",
  "",
  "\uD83D\uDCDC *Comandos dispon\u00EDveis:*",
  "",
  "\uD83C\uDFB2 */sorteio* \u2014 Sorteia 1 n\u00FAmero (1 a 100)",
  "",
  "\uD83C\uDFB2 */sorteio 4* \u2014 Sorteia 4 n\u00FAmeros aleat\u00F3rios",
  "",
  "\uD83C\uDFB2 */sorteio 3, 5* \u2014 Faz 2 sorteios: um de 3 e outro de 5 n\u00FAmeros",
  "",
  "\uD83C\uDF81 */premio 22* \u2014 Mostra qual \u00E9 o pr\u00EAmio do n\u00FAmero 22",
  "",
  "\u2139\uFE0F */ajuda* \u2014 Mostra esta mensagem",
  "",
  "\u2796\u1AD3\u2796\u1AD3\u2772\uD83C\uDFB2\uD83D\uDCE6\uD83C\uDFB2\u2773\u1AD3\u2796\u1AD3\u2796",
  "",
  "\uD83E\uDD16 *Nick do Bot:* VallenBot",
  "\uD83D\uDC51 *Dono do Bot:* +55 66 99246-4577",
  "\uD83D\uDC65 *Acesso:* Liberado para todos do grupo",
  "",
  "\u2699\uFE0F *Desenvolvido por 9devs*",
].join("\n")

async function iniciarBot() {
  // Salva a sessao na pasta auth/ (gerada automaticamente)
  const { state, saveCreds } = await useMultiFileAuthState("auth")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    // printQRInTerminal foi descontinuado; tratamos o QR manualmente abaixo
    browser: ["Caixa Magica Bot", "Chrome", "1.0.0"],
  })

  // Eventos de conexao
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log("\n[QR] Escaneie o QR Code abaixo com o WhatsApp:\n")
      qrcode.generate(qr, { small: true })
    }

    if (connection === "close") {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
      const deveReconectar = statusCode !== DisconnectReason.loggedOut

      console.log(
        `[CONEXAO] Fechada. Motivo: ${statusCode}. Reconectar: ${deveReconectar}`,
      )

      if (deveReconectar) {
        iniciarBot()
      } else {
        console.log(
          "[CONEXAO] Desconectado (logout). Apague a pasta auth/ e reinicie para gerar novo QR.",
        )
      }
    } else if (connection === "open") {
      console.log("[CONEXAO] Bot conectado com sucesso! \u2705")
    }
  })

  // Salva credenciais sempre que atualizar
  sock.ev.on("creds.update", saveCreds)

  // Recebe mensagens
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return

    for (const msg of messages) {
      // Ignora mensagens proprias e sem conteudo
      if (!msg.message || msg.key.fromMe) continue

      const jid = msg.key.remoteJid
      if (!jid) continue

      // Extrai o texto de varios formatos de mensagem
      const texto =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        ""

      const textoLimpo = texto.trim()
      if (!textoLimpo.startsWith("/")) continue

      const comando = textoLimpo.split(/\s+/)[0].toLowerCase()

      try {
        await tratarComando(sock, jid, comando, textoLimpo)
      } catch (err) {
        console.error("[ERRO] Falha ao tratar comando:", err)
        await sock.sendMessage(jid, {
          text: "Ocorreu um erro ao processar seu comando. Tente novamente.",
        })
      }
    }
  })
}

async function tratarComando(sock, jid, comando, textoLimpo) {
  if (comando === "/sorteio") {
    const quantidades = parseQuantidades(textoLimpo)

    // Gera um bloco de resposta para cada quantidade pedida
    const blocos = quantidades.map((qtd) => {
      const numeros = sortearNumeros(qtd)
      return montarMensagemSorteio(numeros)
    })

    await sock.sendMessage(jid, { text: blocos.join("\n\n------------------------\n\n") })
    return
  }

  if (comando === "/premio") {
    const partes = textoLimpo.split(/\s+/)
    const n = Number.parseInt(partes[1], 10)

    if (!Number.isInteger(n) || n < 1 || n > 100) {
      await sock.sendMessage(jid, {
        text: "Informe um numero valido de 1 a 100. Exemplo: */premio 22*",
      })
      return
    }

    await sock.sendMessage(jid, {
      text: `\uD83C\uDF81 Premio do numero ${n}:\n\n*${PREMIOS[n]}*`,
    })
    return
  }

  if (comando === "/ajuda" || comando === "/help" || comando === "/start") {
    await sock.sendMessage(jid, { text: TEXTO_AJUDA })
    return
  }

  // Comando nao reconhecido
  await sock.sendMessage(jid, {
    text: "Comando nao reconhecido. Digite */ajuda* para ver os comandos.",
  })
}

iniciarBot().catch((err) => console.error("[FATAL]", err))

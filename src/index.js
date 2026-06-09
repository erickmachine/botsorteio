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
  "\uD83C\uDFB0 *BOT DA CAIXA MAGICA DIAMOND* \uD83C\uDFB0",
  "",
  "Comandos disponiveis:",
  "",
  "*/sorteio* - Sorteia 1 numero (1 a 100)",
  "*/sorteio 4* - Sorteia 4 numeros aleatorios",
  "*/sorteio 3, 5* - Faz 2 sorteios: um de 3 e outro de 5 numeros",
  "*/premio 22* - Mostra qual e o premio do numero 22",
  "*/ajuda* - Mostra esta mensagem",
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

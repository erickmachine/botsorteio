import { PREMIOS, numeroComEmoji } from "./premios.js"

// Sorteia "quantidade" numeros aleatorios unicos de 1 a 100
export function sortearNumeros(quantidade) {
  const max = Object.keys(PREMIOS).length // 100
  const qtd = Math.min(Math.max(quantidade, 1), max)
  const disponiveis = Array.from({ length: max }, (_, i) => i + 1)

  // Embaralha (Fisher-Yates) e pega os primeiros "qtd"
  for (let i = disponiveis.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[disponiveis[i], disponiveis[j]] = [disponiveis[j], disponiveis[i]]
  }
  return disponiveis.slice(0, qtd).sort((a, b) => a - b)
}

// Monta a mensagem de resposta de um sorteio
export function montarMensagemSorteio(numeros) {
  const linhas = numeros.map((n) => {
    return `${numeroComEmoji(n)} -> ${PREMIOS[n]}`
  })

  return [
    "\uD83C\uDFB0 ROLETA DA CAIXA MAGICA DIAMOND \uD83C\uDFB0",
    "",
    `Numeros sorteados: ${numeros.length}`,
    "",
    ...linhas,
  ].join("\n")
}

// Interpreta o texto do comando e retorna as quantidades pedidas
// Ex: "/sorteio 3, 5" -> [3, 5]
//     "/sorteio 4"    -> [4]
export function parseQuantidades(texto) {
  const semComando = texto.replace(/^\/sorteio/i, "").trim()
  if (!semComando) return [1] // padrao: 1 numero

  return semComando
    .split(/[,\s]+/)
    .map((x) => Number.parseInt(x, 10))
    .filter((n) => Number.isInteger(n) && n > 0)
}

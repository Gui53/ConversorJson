const fs = require("node:fs");
const { parse } = require("csv-parse/sync");

const formato = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/;

function converterDataCadastro(valor, linha) {
  const partes = formato.exec(String(valor).trim());

  if (!partes) {
    throw new Error(`Linha ${linha}: formato de data inválido.`);
  }

  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  const ano = Number(partes[3]);
  const hora = Number(partes[4]);
  const minuto = Number(partes[5]);

  const conferida = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto));

  const dataValida =
    conferida.getUTCFullYear() === ano &&
    conferida.getUTCMonth() === mes - 1 &&
    conferida.getUTCDate() === dia &&
    hora <= 23 &&
    minuto <= 59;

  if (!dataValida) {
    throw new Error(`Linha ${linha}: data ou hora não existe.`);
  }

  return {
    occurred_at: `${partes[3]}-${partes[2]}-${partes[1]}T${partes[4]}:${partes[5]}:00-03:00`,
    reference_date: `${partes[3]}-${partes[2]}-${partes[1]}`,
    source_line: linha
  };
}

const textoCsv = fs.readFileSync("seuArquivo.csv", "utf8");

const linhasLidas = parse(textoCsv, {
  columns: true,
  delimiter: ";",
  bom: true,
  skip_empty_lines: true,
  trim: true
});

if (linhasLidas.length === 0) {
  throw new Error("O CSV não tem linhas de dados.");
}

if (!Object.hasOwn(linhasLidas[0], "DataCadastro")) {
  throw new Error("Não encontrei a coluna DataCadastro no CSV.");
}

const linhasCsv = linhasLidas.map((item, indice) => ({
  linha: indice + 2,
  dataCadastro: item.DataCadastro
}));

const registros = [];
const erros = [];

for(const item of linhasCsv){
    try{
        const registro = converterDataCadastro(item.dataCadastro, item.linha);
        registros.push(registro);
    }catch (erro){
        erros.push({
            linha: item.linha,
            mensagem: erro.message
        });
    }
}

console.log(`Prévia: ${registros.length} válidos e ${erros.length} com erro.`)
console.log(JSON.stringify({ schema_version: 1, records: registros }, null, 2));

if(erros.length > 0){
    console.table(erros);
}
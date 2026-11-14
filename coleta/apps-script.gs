/**
 * Observatório de Egressos PPGTIC — recebe as respostas do site e grava na planilha.
 *
 * Como instalar (detalhes no README, passo 2):
 *  1. Na planilha do Google, abra Extensões > Apps Script.
 *  2. Apague o conteúdo do arquivo Código.gs, cole este arquivo inteiro e salve.
 *  3. Implantar > Nova implantação > tipo "App da Web";
 *     Executar como: "Eu"; acesso: "Qualquer pessoa"; Implantar e autorizar.
 *  4. Copie o URL do app da Web (termina em /exec) para urlColeta em js/config.js.
 *
 * Cada egresso ocupa uma linha da aba "Respostas", identificada pela coluna id:
 * o cadastro cria a linha e cada etapa do questionário a atualiza.
 * A coluna dados_json é a que o painel do protótipo importa.
 * Depois de alterar este código, publique de novo: Implantar > Gerenciar implantações >
 * editar (lápis) > Versão: "Nova versão" > Implantar (o URL continua o mesmo).
 */
const NOME_ABA = 'Respostas';
const LIMITE_BYTES = 100000;
const LIMITE_COLUNAS = 80;

function doPost(e) {
  const trava = LockService.getScriptLock();
  trava.waitLock(30000);
  try {
    const bruto = e && e.postData && e.postData.contents;
    if (!bruto || bruto.length > LIMITE_BYTES) return resposta({ ok: false, erro: 'conteúdo ausente ou grande demais' });
    const pacote = JSON.parse(bruto);
    const linha = pacote && pacote.linha;
    if (!linha || typeof linha !== 'object' || !/^[A-Za-z0-9_-]{8,64}$/.test(String(linha.id || ''))) {
      return resposta({ ok: false, erro: 'registro sem id válido' });
    }
    const chaves = Object.keys(linha).filter((k) => /^[a-z0-9_]{1,40}$/.test(k)).slice(0, LIMITE_COLUNAS);

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const aba = planilha.getSheetByName(NOME_ABA) || planilha.insertSheet(NOME_ABA);

    // cabeçalho: id e recebido_em primeiro; colunas novas entram no fim
    let cabecalho = aba.getLastRow() > 0 ? aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0].map(String) : [];
    if (!cabecalho.length) {
      cabecalho = ['id', 'recebido_em'];
      aba.setFrozenRows(1);
    }
    const novas = chaves.filter((k) => cabecalho.indexOf(k) < 0);
    if (novas.length && cabecalho.length + novas.length <= LIMITE_COLUNAS + 2) cabecalho = cabecalho.concat(novas);
    aba.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]).setFontWeight('bold');

    const recebido = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    const valores = cabecalho.map((k) => (k === 'recebido_em' ? recebido : k in linha ? limpar(linha[k]) : ''));

    // mesma pessoa (mesmo id): atualiza a linha; senão, acrescenta
    const ultima = aba.getLastRow();
    const ids = ultima > 1 ? aba.getRange(2, 1, ultima - 1, 1).getValues().map((r) => String(r[0])) : [];
    const i = ids.indexOf(String(linha.id));
    const alvo = i >= 0 ? i + 2 : ultima + 1;
    const intervalo = aba.getRange(alvo, 1, 1, valores.length);
    intervalo.setNumberFormat('@'); // tudo como texto: o Planilhas não converte datas nem números longos
    intervalo.setValues([valores]);
    return resposta({ ok: true, linha: alvo });
  } catch (erro) {
    return resposta({ ok: false, erro: String(erro) });
  } finally {
    trava.releaseLock();
  }
}

// Abrir o URL /exec no navegador mostra esta mensagem: serve para conferir a implantação.
function doGet() {
  return ContentService.createTextOutput('Observatório de Egressos PPGTIC: coleta ativa.');
}

function limpar(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'sim' : 'não';
  let s = String(v).slice(0, 49000);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // impede que um texto enviado vire fórmula
  return s;
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

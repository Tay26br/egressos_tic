/* =====================================================================
   Observatório de Egressos PPGTIC/UFSC — Protótipo V2 (EX09)
   base.js — utilitários e referências compartilhadas por todas as telas.
   Sem dependências externas: roda com o Live Server do VS Code ou
   abrindo os arquivos .html direto no navegador.
   ===================================================================== */
(function (root) {
  'use strict';
  const Obs = (root.Obs = root.Obs || {});
  const U = {};

  /* ---------------------------- Datas ---------------------------- */
  U.hoje = function () {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  };
  U.dois = (n) => String(n).padStart(2, '0');
  // 'AAAA-MM-DD' na hora local (evita o deslocamento de fuso do toISOString)
  U.iso = (d) => `${d.getFullYear()}-${U.dois(d.getMonth() + 1)}-${U.dois(d.getDate())}`;
  U.isoMes = (d) => U.iso(d).slice(0, 7);
  U.agora = function () {
    const d = new Date();
    return `${U.iso(d)}T${U.dois(d.getHours())}:${U.dois(d.getMinutes())}:${U.dois(d.getSeconds())}`;
  };
  // Aceita Date, 'AAAA-MM-DD', 'AAAA-MM' ou 'AAAA-MM-DDTHH:MM:SS'
  U.parse = function (s) {
    if (!s) return null;
    if (s instanceof Date) return new Date(s.getTime());
    const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(s));
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, m[3] ? +m[3] : 1, m[4] ? +m[4] : 12, m[5] ? +m[5] : 0, m[6] ? +m[6] : 0);
  };
  U.addDias = function (d, n) {
    const r = new Date(d.getTime());
    r.setDate(r.getDate() + n);
    return r;
  };
  U.addMeses = function (d, n) {
    const r = new Date(d.getTime());
    const dia = r.getDate();
    r.setDate(1);
    r.setMonth(r.getMonth() + n);
    const ultimo = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
    r.setDate(Math.min(dia, ultimo));
    return r;
  };
  U.diasEntre = function (a, b) {
    const da = U.parse(a), db = U.parse(b);
    if (!da || !db) return null;
    const ua = Date.UTC(da.getFullYear(), da.getMonth(), da.getDate());
    const ub = Date.UTC(db.getFullYear(), db.getMonth(), db.getDate());
    return Math.round((ub - ua) / 86400000);
  };
  U.anosEntre = (a, b) => U.diasEntre(a, b) / 365.25;
  U.mesesEntre = (a, b) => U.diasEntre(a, b) / 30.4375;
  U.fmtData = function (s) {
    const d = U.parse(s);
    return d ? `${U.dois(d.getDate())}/${U.dois(d.getMonth() + 1)}/${d.getFullYear()}` : '—';
  };
  U.fmtDataHora = function (s) {
    const d = U.parse(s);
    return d ? `${U.fmtData(s)} ${U.dois(d.getHours())}:${U.dois(d.getMinutes())}` : '—';
  };
  U.fmtMes = function (s) {
    const d = U.parse(s);
    return d ? `${U.dois(d.getMonth() + 1)}/${d.getFullYear()}` : '—';
  };
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
    'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  U.fmtDataExtenso = function (s) {
    const d = U.parse(s);
    return d ? `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}` : '—';
  };
  U.fmtMesExtenso = function (s) {
    const d = U.parse(s);
    return d ? `${MESES[d.getMonth()]} de ${d.getFullYear()}` : '—';
  };
  U.tempoRelativo = function (s, hoje) {
    const dias = U.diasEntre(s, hoje || U.hoje());
    if (dias == null) return '—';
    if (dias <= 0) return 'hoje';
    if (dias === 1) return 'ontem';
    if (dias < 31) return `há ${dias} dias`;
    const meses = Math.round(dias / 30.4375);
    if (meses < 12) return meses === 1 ? 'há 1 mês' : `há ${meses} meses`;
    const anos = Math.floor(meses / 12);
    const resto = meses % 12;
    const txtAnos = anos === 1 ? '1 ano' : `${anos} anos`;
    return resto ? `há ${txtAnos} e ${resto} ${resto === 1 ? 'mês' : 'meses'}` : `há ${txtAnos}`;
  };

  /* --------------------------- Números --------------------------- */
  U.pct = (n, d) => (d > 0 ? (100 * n) / d : null);
  U.fmtNum = function (v, casas = 0) {
    if (v == null || Number.isNaN(v)) return '—';
    return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  };
  U.fmtPct = (v, casas = 0) => (v == null || Number.isNaN(v) ? '—' : `${U.fmtNum(v, casas)}%`);
  U.fmtDuracao = function (seg) {
    if (seg == null) return '—';
    const s = Math.max(0, Math.round(seg));
    const m = Math.floor(s / 60);
    return m ? `${m} min ${U.dois(s % 60)} s` : `${s} s`;
  };
  U.media = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  U.mediana = function (arr) {
    if (!arr.length) return null;
    const v = [...arr].sort((a, b) => a - b);
    const m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  };

  /* ---------------------------- Texto ---------------------------- */
  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
  U.contarPalavras = (s) => (String(s || '').trim().match(/\S+/g) || []).length;
  U.semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
  U.slugArquivo = (s) => U.semAcento(s).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  U.iniciais = function (nome) {
    const partes = String(nome || '').split(/\s+/).filter((p) => p.length > 2 || /^[A-ZÁÉÍÓÚ]/.test(p));
    if (!partes.length) return '?';
    const ult = partes.length > 1 ? partes[partes.length - 1] : '';
    return (partes[0][0] + (ult ? ult[0] : '')).toUpperCase();
  };
  U.primeiroNome = (nome) => String(nome || '').trim().split(/\s+/)[0] || '';
  U.plural = (n, um, varios) => `${U.fmtNum(n)} ${n === 1 ? um : varios}`;

  /* -------------------------- Validações -------------------------- */
  // ORCID: dígito verificador ISO 7064 MOD 11-2 (documentação oficial do ORCID)
  U.orcidValido = function (id) {
    if (!/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(String(id || ''))) return false;
    const d = id.replace(/-/g, '');
    let total = 0;
    for (let i = 0; i < 15; i++) total = (total + parseInt(d[i], 10)) * 2;
    const resultado = (12 - (total % 11)) % 11;
    return (resultado === 10 ? 'X' : String(resultado)) === d[15];
  };
  U.lattesValido = (id) => /^\d{16}$/.test(String(id || ''));
  U.linkLattes = (id) => (id ? `http://lattes.cnpq.br/${id}` : '');
  // Link do currículo Lattes ("Endereço para acessar este CV") -> ID de 16 dígitos.
  // Retorna '' se vazio e null se não reconhecer o formato.
  U.idDoLinkLattes = function (txt) {
    const s = String(txt || '').trim();
    if (!s) return '';
    let m = /^(?:https?:\/\/)?(?:www\.)?lattes\.cnpq\.br\/(\d{16})\/?(?:[?#].*)?$/i.exec(s);
    if (m) return m[1];
    m = /^(\d{16})$/.exec(s.replace(/\s/g, ''));
    return m ? m[1] : null;
  };
  // Endereço do perfil do LinkedIn -> https://www.linkedin.com/in/<perfil>.
  // Aceita com ou sem https://, www ou subdomínio de país; retorna '' se vazio e null se inválido.
  U.normalizarLinkedin = function (txt) {
    const s = String(txt || '').trim();
    if (!s) return '';
    const m = /^(?:https?:\/\/)?(?:[a-z]{2,3}\.|www\.)?linkedin\.com\/in\/([^\s/?#]+)\/?(?:[?#].*)?$/i.exec(s);
    return m ? `https://www.linkedin.com/in/${m[1]}` : null;
  };
  U.emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());
  U.emailInstitucional = (e) => /@([a-z0-9-]+\.)*ufsc\.br$/i.test(String(e || '').trim());

  /* ------------------- Sorteio determinístico ------------------- */
  // mulberry32: a mesma semente gera sempre a mesma base fictícia
  U.prng = function (semente) {
    let a = semente >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* --------------------------- Arquivos --------------------------- */
  // CSV com ";" e BOM UTF-8: abre corretamente no Excel em português
  U.csv = function (linhas) {
    const cel = (v) => {
      const s = String(v == null ? '' : v);
      return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return '﻿' + linhas.map((l) => l.map(cel).join(';')).join('\r\n');
  };
  U.baixar = function (nome, conteudo, tipo) {
    const blob = new Blob([conteudo], { type: tipo || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
  };
  U.parametro = function (nome) {
    try { return new URLSearchParams(root.location.search).get(nome); } catch (e) { return null; }
  };

  Obs.U = U;

  /* --------------------------- Configuração --------------------------- */
  // Lê js/config.js e decide o modo: 'demonstracao' (base fictícia, painel de
  // demonstração) ou 'coleta' (site publicado: sem base fictícia, envia à planilha).
  (function () {
    const C = root.OBS_CONFIG || {};
    const loc = root.location;
    const local = !loc || loc.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(loc.hostname || '');
    let modo = ['demonstracao', 'coleta'].includes(C.modo) ? C.modo : 'auto';
    if (local && loc) {
      // no próprio computador, ?modo=coleta permite testar a coleta (vale para a aba inteira)
      let pedido = null;
      try { pedido = new URLSearchParams(loc.search).get('modo'); } catch (e) { /* ignora */ }
      try {
        if (pedido === 'coleta' || pedido === 'demonstracao') root.sessionStorage.setItem('observatorio-egressos-v2:modo', pedido);
        pedido = root.sessionStorage.getItem('observatorio-egressos-v2:modo') || pedido;
      } catch (e) { /* sessionStorage indisponível */ }
      if (pedido === 'coleta' || pedido === 'demonstracao') modo = pedido;
    }
    if (modo === 'auto') modo = local ? 'demonstracao' : 'coleta';
    Obs.config = {
      modo,
      coleta: modo === 'coleta',
      urlColeta: String(C.urlColeta || '').trim(),
      responsavel: String(C.responsavel || 'Coordenação do PPGTIC/UFSC'),
      contato: String(C.contato || '').trim(),
    };
  })();

  /* ===================== Referências do projeto ===================== */
  const orientadores = [
    ['A', 'Prof.ª Orientadora A', 'Tecnologia Educacional'],
    ['B', 'Prof. Orientador B', 'Tecnologia, Gestão e Inovação'],
    ['C', 'Prof. Orientador C', 'Tecnologia Computacional'],
    ['D', 'Prof.ª Orientadora D', 'Tecnologia Educacional'],
    ['E', 'Prof. Orientador E', 'Tecnologia, Gestão e Inovação'],
    ['F', 'Prof.ª Orientadora F', 'Tecnologia Computacional'],
    ['G', 'Prof. Orientador G', 'Tecnologia Educacional'],
    ['H', 'Prof.ª Orientadora H', 'Tecnologia, Gestão e Inovação'],
    ['I', 'Prof. Orientador I', 'Tecnologia Computacional'],
    ['J', 'Prof.ª Orientadora J', 'Tecnologia Educacional'],
    ['K', 'Prof. Orientador K', 'Tecnologia, Gestão e Inovação'],
    ['L', 'Prof.ª Orientadora L', 'Tecnologia Computacional'],
    ['M', 'Prof. Orientador M', 'Tecnologia Educacional'],
    ['N', 'Prof.ª Orientadora N', 'Tecnologia, Gestão e Inovação'],
    ['O', 'Prof. Orientador O', 'Tecnologia Computacional'],
    ['P', 'Prof.ª Orientadora P', 'Tecnologia Educacional'],
  ].map(([id, nome, linha]) => ({ id, nome, linha }));

  Obs.REF = {
    versaoDados: 4,
    inicioPrograma: 2014,
    faixas: ['2024–2028', '2019–2023', '2014–2018'],
    metas: { 2026: 60, 2027: 75, 2028: 85 },
    limiteDestaques: 5,
    limitePalavrasImpacto: 150,
    limitePalavrasResumo: 40,
    tempoEstimadoQuestionarioMin: 8,
    pasta: '05_CAPES_2.2_Egressos',
    linhas: ['Tecnologia Educacional', 'Tecnologia, Gestão e Inovação', 'Tecnologia Computacional'],
    orientadores,
    setores: ['Educação básica', 'Ensino superior', 'Empresa privada', 'Outro órgão público', 'Autônomo'],
    naturezaPorSetor: { 'Empresa privada': 'Privada', 'Outro órgão público': 'Pública', 'Autônomo': 'Privada' },
    ufs: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR',
      'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO', 'Exterior'],
    posGrad: ['Não', 'Doutorado em andamento', 'Doutorado concluído', 'Pós-doutorado em andamento'],
    docencia: ['Não', 'Educação básica', 'Ensino técnico', 'Ensino superior'],
    mudancas: [
      { id: 'cargo', rotulo: 'Cargo ou função', mobilidade: true },
      { id: 'instituicao', rotulo: 'Instituição', mobilidade: false },
      { id: 'setor', rotulo: 'Setor de atuação', mobilidade: true },
      { id: 'nivel', rotulo: 'Nível de ensino em que atua', mobilidade: false },
      { id: 'regiao', rotulo: 'Cidade ou região', mobilidade: true },
      { id: 'natureza', rotulo: 'Natureza do vínculo (pública ou privada)', mobilidade: false },
    ],
    escalaImportancia: ['Nada', 'Pouco', 'Importante', 'Muito', 'Decisiva'],
    itensImportancia: [
      { id: 'cientificas', rotulo: 'Habilidades científicas' },
      { id: 'escrita', rotulo: 'Escrita' },
      { id: 'geral', rotulo: 'Formação geral' },
      { id: 'insercao', rotulo: 'Inserção ou progressão profissional' },
    ],
    impactos: ['Acadêmico', 'Social', 'Econômico', 'Profissional'],
    tiposProducao: ['Artigo em periódico', 'Trabalho em evento', 'Livro ou capítulo', 'Produto técnico ou tecnológico',
      'Software ou aplicativo', 'Material didático', 'Patente ou registro'],
    disponibilidade: [
      { id: 'bancas', rotulo: 'Participar de bancas' },
      { id: 'palestras', rotulo: 'Ministrar palestras ou relatos de experiência' },
      { id: 'comissao', rotulo: 'Integrar a Comissão de Autoavaliação' },
    ],
    perfis: {
      publico: 'Visitante',
      egresso: 'Egresso',
      secretaria: 'Secretaria',
      coordenacao: 'Coordenação',
      comissao: 'Comissão de Autoavaliação',
      rt: 'Responsável Temático',
    },
    perfisPainel: ['secretaria', 'coordenacao', 'comissao', 'rt'],
    perfisFicha: ['comissao', 'rt'],
    statusFicha: {
      rascunho: 'Rascunho',
      enviada: 'Enviada à Comissão',
      devolvida: 'Devolvida para ajustes',
      aprovada: 'Aprovada pela Comissão',
      publicada: 'Publicada na vitrine',
    },
    // Quadro 5 do EX08 — matriz de indicadores (fórmula, fonte, validação e meta)
    matriz: [
      { id: 'dadosMinimos', nome: 'Egressos com dados mínimos atualizados',
        formula: '(egressos que cumprem os 3 critérios ÷ titulados 2014–2028) × 100',
        fonte: 'Banco do Observatório; Sucupira',
        validacao: 'E-mail confirmado por link; vínculo ≤ 12 meses; data do Lattes conferida',
        meta: '60% (2026), 75% (2027), 85% (2028)' },
      { id: 'cobertura', nome: 'Cobertura por faixa', formula: 'Mesma fórmula, por faixa',
        fonte: 'Banco do Observatório', validacao: 'Ano da defesa conferido no Sucupira', meta: 'Mesmas metas' },
      { id: 'insercao', nome: 'Inserção profissional',
        formula: '(com vínculo ativo ÷ com dados atualizados) × 100, por natureza e setor',
        fonte: 'Cadastro; questionário', validacao: 'Lattes ou declaração', meta: 'Linha de base em 2026' },
      { id: 'permanencia', nome: 'Permanência', formula: 'Tempo médio no vínculo atual, por faixa',
        fonte: 'Cadastro', validacao: 'Data de início confirmada', meta: 'Descritivo' },
      { id: 'mobilidade', nome: 'Mobilidade', formula: '(mudaram de cargo, setor ou região ÷ respondentes) × 100',
        fonte: 'Questionário', validacao: 'Amostra conferida no Lattes', meta: 'Descritivo' },
      { id: 'relacionada', nome: 'Atuação relacionada à formação', formula: '(respostas 4 ou 5 ÷ respondentes) × 100',
        fonte: 'Questionário', validacao: 'Amostra conferida no Lattes', meta: 'Linha de base' },
      { id: 'docencia', nome: 'Docência e atuação em PPG', formula: '(docentes ou em PPG ÷ com dados atualizados) × 100',
        fonte: 'Questionário; Lattes', validacao: 'Lattes ou declaração', meta: 'Linha de base' },
      { id: 'autores', nome: 'Egressos autores (até 5 anos)',
        formula: '(egressos até 5 anos com produção registrada ÷ egressos até 5 anos) × 100',
        fonte: 'ORCID; Lattes; questionário', validacao: 'Produção com DOI ou registro no Lattes',
        meta: 'Linha de base; apoia o item 2.3' },
      { id: 'captura', nome: 'Captura na defesa', formula: '(defesas com cadastro completo ÷ defesas) × 100',
        fonte: 'Secretaria; Repositório', validacao: 'Cadastro antes do depósito final',
        meta: '100% após aprovação do Colegiado' },
      { id: 'resposta', nome: 'Taxa de resposta', formula: '(questionários completos ÷ enviados) × 100',
        fonte: 'Ferramenta de questionário', validacao: 'Blocos 1 e 2 completos', meta: '50% no 1º ano' },
      { id: 'destaques', nome: 'Destaques por faixa', formula: 'Fichas aprovadas e comprovadas, por faixa',
        fonte: 'Pasta 05_CAPES_2.2_Egressos', validacao: 'Aprovação da Comissão com comprovantes e consentimento',
        meta: '5 por faixa' },
    ],
  };

  Obs.REF.orientadorPorNome = function (nome) {
    return orientadores.find((o) => o.nome === nome) || null;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Obs;
})(typeof window !== 'undefined' ? window : globalThis);

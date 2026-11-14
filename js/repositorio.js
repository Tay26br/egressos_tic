/* =====================================================================
   repositorio.js — camada de dados do protótipo.
   Os dados ficam no localStorage do navegador. No modo coleta (site
   publicado), cada resposta também é enviada à planilha da equipe
   (js/coleta.js); a base fictícia só existe no modo demonstração.
   Também guarda o perfil simulado (egresso, Secretaria, Comissão...) e
   as evidências dos testes de preenchimento (tempo, erros, facilidade).
   ===================================================================== */
(function (root) {
  'use strict';
  const Obs = root.Obs;
  const U = Obs.U;
  const R = Obs.REF;

  const COLETA = !!(Obs.config && Obs.config.coleta);
  // chaves separadas: testar a coleta no mesmo navegador não mistura com a demonstração
  const CHAVE = COLETA ? 'observatorio-egressos-v2:coleta:dados' : 'observatorio-egressos-v2:dados';
  const CHAVE_PERFIL = COLETA ? 'observatorio-egressos-v2:coleta:perfil' : 'observatorio-egressos-v2:perfil';
  const ouvintes = [];
  let cache = null;

  const ler = (k) => { try { return root.localStorage.getItem(k); } catch (e) { return null; } };
  const gravar = (k, v) => { try { root.localStorage.setItem(k, v); return true; } catch (e) { console.error(e); return false; } };

  const DB = {};

  DB.novaBase = function (vazia) {
    const semFicticios = COLETA || !!vazia;
    return {
      versao: R.versaoDados,
      geradaEm: U.iso(U.hoje()),
      egressos: semFicticios ? [] : Obs.gerarBaseFicticia(),
      vazia: semFicticios,
      lembretes: {},
      evidencias: [],
      contadorTestes: 0,
    };
  };

  DB.dados = function () {
    if (cache) return cache;
    const bruto = ler(CHAVE);
    if (bruto) {
      try {
        const d = JSON.parse(bruto);
        if (d && d.versao === R.versaoDados && Array.isArray(d.egressos)) cache = d;
      } catch (e) { cache = null; }
    }
    if (!cache) {
      cache = DB.novaBase();
      DB.salvar(false);
    }
    return cache;
  };

  DB.salvar = function (notificar) {
    const ok = gravar(CHAVE, JSON.stringify(cache));
    if (!ok && Obs.ui) Obs.ui.toast('Não foi possível salvar no navegador (armazenamento cheio ou bloqueado).', 'erro');
    if (notificar !== false) DB.notificar('dados');
    return ok;
  };

  DB.egressos = () => DB.dados().egressos;
  DB.obter = (id) => DB.egressos().find((e) => e.id === id) || null;
  DB.rafael = () => DB.egressos().find((e) => e.papel === 'rafael') || null;

  DB.alterar = function (id, fn) {
    const e = DB.obter(id);
    if (!e) return null;
    fn(e);
    DB.salvar();
    return e;
  };

  // Cria um egresso de TESTE (registro feito por um testador, sem vínculo com a base fictícia)
  DB.criarTeste = function (formacao) {
    const d = DB.dados();
    d.contadorTestes = (d.contadorTestes || 0) + 1;
    const e = Object.assign({
      id: 't' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      origem: 'teste',
      codigoTeste: 'T' + String(d.contadorTestes).padStart(2, '0'),
      cadastro: null, lattes: null, questionarios: [], producoes: [], vinculosAnteriores: [],
      destaque: null, termoMatricula: null,
    }, formacao);
    d.egressos.push(e);
    DB.salvar();
    return e;
  };

  // Novo registro feito pelo próprio egresso: de teste (demonstração) ou real (coleta)
  DB.criarEgresso = function (formacao) {
    if (!COLETA) return DB.criarTeste(formacao);
    const d = DB.dados();
    const aleatorio = root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID().replace(/-/g, '')
      : Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const e = Object.assign({
      id: 'c' + aleatorio.slice(0, 24),
      origem: 'coleta',
      cadastro: null, lattes: null, questionarios: [], producoes: [], vinculosAnteriores: [],
      destaque: null, termoMatricula: null,
    }, formacao);
    d.egressos.push(e);
    DB.salvar();
    return e;
  };

  DB.restaurar = function () {
    cache = DB.novaBase();
    DB.salvar(false);
    gravar(CHAVE_PERFIL, JSON.stringify({ tipo: 'publico' }));
    DB.notificar('dados');
  };

  // Esvazia a base deste navegador: sem egressos fictícios, testes nem evidências
  DB.esvaziar = function () {
    cache = DB.novaBase(true);
    DB.salvar(false);
    gravar(CHAVE_PERFIL, JSON.stringify({ tipo: 'publico' }));
    DB.notificar('dados');
  };

  // Respostas reais trazidas da planilha (coluna dados_json): atualiza pelo id
  DB.importarRespostas = function (registros) {
    const d = DB.dados();
    let novos = 0;
    let atualizados = 0;
    registros.forEach((e) => {
      e.origem = 'coleta';
      const i = d.egressos.findIndex((x) => x.id === e.id);
      if (i >= 0) { d.egressos[i] = e; atualizados++; } else { d.egressos.push(e); novos++; }
    });
    d.vazia = !d.egressos.some((e) => e.origem === 'base');
    DB.salvar();
    return { novos, atualizados };
  };

  /* ---------------------- evidências de teste ---------------------- */
  DB.codigoSessao = function (e) {
    if (!e) return '—';
    if (e.codigoTeste) return e.codigoTeste;
    if (e.papel === 'rafael') return 'Roteiro EX08';
    return `Base ${e.id}`;
  };
  DB.registrarEvidencia = function (ev) {
    const d = DB.dados();
    ev.id = 'ev' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    d.evidencias.push(ev);
    DB.salvar();
    return ev;
  };
  DB.atualizarEvidencia = function (id, campos) {
    const ev = DB.dados().evidencias.find((x) => x.id === id);
    if (ev) { Object.assign(ev, campos); DB.salvar(); }
    return ev;
  };
  DB.evidencias = () => DB.dados().evidencias || [];

  DB.registrarLembrete = function (orientador, info) {
    DB.dados().lembretes[orientador] = info;
    DB.salvar();
  };

  /* -------------------------- perfil simulado -------------------------- */
  DB.perfil = function () {
    try {
      const p = JSON.parse(ler(CHAVE_PERFIL));
      if (p && p.tipo) return p;
    } catch (e) { /* ignora */ }
    return { tipo: 'publico' };
  };
  DB.definirPerfil = function (p) {
    gravar(CHAVE_PERFIL, JSON.stringify(p));
    DB.notificar('perfil');
  };
  DB.egressoLogado = function () {
    const p = DB.perfil();
    return p.tipo === 'egresso' && p.egressoId ? DB.obter(p.egressoId) : null;
  };
  DB.podeVerPainelCompleto = () => R.perfisPainel.includes(DB.perfil().tipo);
  DB.podeEditarFicha = () => R.perfisFicha.includes(DB.perfil().tipo);

  /* ------------- exportação / importação dos registros de teste ------------- */
  DB.exportarTestes = function () {
    return {
      formato: 'observatorio-egressos-v2/testes',
      exportadoEm: U.agora(),
      egressos: DB.egressos().filter((e) => e.origem === 'teste'),
      evidencias: DB.evidencias(),
    };
  };
  DB.importarTestes = function (pacote) {
    if (!pacote || pacote.formato !== 'observatorio-egressos-v2/testes') throw new Error('Arquivo não reconhecido: use um JSON exportado por este protótipo.');
    const d = DB.dados();
    let novos = 0;
    let atualizados = 0;
    const codigos = new Set(d.egressos.filter((e) => e.codigoTeste).map((e) => e.codigoTeste));
    (pacote.egressos || []).forEach((e) => {
      if (e.origem !== 'teste') return;
      const i = d.egressos.findIndex((x) => x.id === e.id);
      if (i >= 0) { d.egressos[i] = e; atualizados++; return; }
      if (codigos.has(e.codigoTeste)) {
        // mesmo código vindo de outro computador: renumera para não confundir as sessões
        d.contadorTestes = (d.contadorTestes || 0) + 1;
        const novoCodigo = 'T' + String(d.contadorTestes).padStart(2, '0');
        (pacote.evidencias || []).forEach((ev) => { if (ev.egressoId === e.id) ev.codigo = novoCodigo; });
        e.codigoTeste = novoCodigo;
      } else {
        const num = parseInt(String(e.codigoTeste || '').slice(1), 10);
        if (num > (d.contadorTestes || 0)) d.contadorTestes = num;
      }
      codigos.add(e.codigoTeste);
      d.egressos.push(e);
      novos++;
    });
    const idsEv = new Set(d.evidencias.map((x) => x.id));
    let ev = 0;
    (pacote.evidencias || []).forEach((x) => { if (!idsEv.has(x.id)) { d.evidencias.push(x); ev++; } });
    DB.salvar();
    return { novos, atualizados, evidencias: ev };
  };

  /* ------------------------------ eventos ------------------------------ */
  DB.aoMudar = (fn) => { ouvintes.push(fn); };
  DB.notificar = (tipo) => ouvintes.forEach((fn) => { try { fn(tipo); } catch (e) { console.error(e); } });
  if (root.addEventListener) {
    // mantém várias abas sincronizadas (ex.: questionário numa aba, painel na outra)
    root.addEventListener('storage', (ev) => {
      if (ev.key === CHAVE) { cache = null; DB.notificar('dados'); }
      if (ev.key === CHAVE_PERFIL) DB.notificar('perfil');
    });
  }

  Obs.DB = DB;
})(typeof window !== 'undefined' ? window : globalThis);

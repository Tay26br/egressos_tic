/* =====================================================================
   coleta.js — envio das respostas para a planilha da equipe (modo coleta)
   e importação da planilha baixada em CSV (painel, modo demonstração).

   Envio: a cada cadastro salvo e a cada etapa do questionário concluída,
   o registro completo do egresso vai para o Apps Script da planilha
   (js/config.js > urlColeta), que cria ou atualiza a linha pelo id.
   Sem conexão, o envio fica numa fila neste aparelho e é repetido depois.
   ===================================================================== */
(function (root) {
  'use strict';
  const Obs = root.Obs;
  const U = Obs.U;
  const R = Obs.REF;
  const DB = Obs.DB;
  const CFG = Obs.config;
  const CHAVE_FILA = 'observatorio-egressos-v2:coleta:fila';
  const C = {};

  C.ativo = () => !!CFG.coleta;
  C.configurado = () => /^https:\/\/script\.google\.com\/macros\/s\/[\w-]{20,}\/exec$/.test(CFG.urlColeta);

  /* ------------------------------ fila ------------------------------ */
  function lerFila() {
    try { return JSON.parse(root.localStorage.getItem(CHAVE_FILA)) || {}; } catch (e) { return {}; }
  }
  function gravarFila(f) {
    try { root.localStorage.setItem(CHAVE_FILA, JSON.stringify(f)); } catch (e) { /* armazenamento cheio */ }
  }
  C.pendentes = () => Object.keys(lerFila()).length;

  /* --------------------- linha da planilha (colunas) --------------------- */
  const simNao = (v) => (v ? 'sim' : 'não');
  const rotulo = (lista, id) => ((lista || []).find((x) => x.id === id) || { rotulo: id === 'nenhuma' ? 'Nada mudou' : id }).rotulo;

  C.linha = function (e, evento) {
    const c = e.cadastro || {};
    const q = (e.questionarios || []).slice(-1)[0] || null;
    const b = (q && q.blocos) || {};
    const b0 = b.b0 || {};
    const b1 = b.b1 || {};
    const b2 = b.b2 || {};
    const b3 = b.b3 || {};
    const b4 = b.b4 || {};
    const imp = b2.importancia || {};
    const escala = (i) => (i == null ? '' : R.escalaImportancia[i] || '');
    const iniciado = q && ((q.validados || []).length || Object.keys(b).length);
    const situacao = !iniciado ? 'não iniciado' : q.finalizadoEm ? 'enviado' : q.completo ? 'completo (blocos 1 e 2)' : 'em andamento';
    const etapas = q ? (q.validados || []).slice().sort().map((k) => (k === 0 ? 'perfis' : `bloco ${k}`)).join(', ') : '';
    const linkedin = b0.linkedin != null ? b0.linkedin : c.linkedin;
    const lattesId = b0.lattesId != null ? b0.lattesId : c.lattesId;
    return {
      id: e.id,
      enviado_em: U.agora(),
      evento,
      nome: e.nome || '',
      email: c.email || '',
      nivel: e.nivel === 'DO' ? 'Doutorado' : e.nivel === 'ME' ? 'Mestrado' : e.nivel || '',
      ano_defesa: e.anoDefesa || '',
      linha_pesquisa: e.linha || '',
      orientador: e.orientador || '',
      titulo_trabalho: e.titulo || '',
      sem_vinculo: simNao(c.semVinculo),
      instituicao: c.instituicao || '',
      cargo: c.cargo || '',
      setor: c.setor || '',
      natureza: c.natureza || '',
      inicio_vinculo: c.inicioVinculo || '',
      cidade: c.cidade || '',
      uf: c.uf || '',
      pais: c.pais || '',
      vinculo_ingresso: c.vinculoIngresso || '',
      pos_graduacao: c.posGrad || '',
      atua_ppg: simNao(c.atuaPPG),
      docente: c.docente || '',
      linkedin: linkedin || '',
      lattes: U.linkLattes(lattesId),
      orcid: c.orcid || '',
      autoriza_acompanhamento: simNao(c.consentAcompanhamento),
      autoriza_divulgacao: simNao(c.consentDivulgacao),
      questionario_ciclo: q ? Obs.Ind.rotuloCiclo(q.ciclo) : '',
      questionario_situacao: situacao,
      questionario_etapas: etapas,
      vinculo_mesmo: { sim: 'continua o mesmo', mudou: 'mudou', sem: 'sem vínculo' }[b1.mesmoVinculo] || '',
      mudancas: (b1.mudancas || []).map((m) => rotulo(R.mudancas, m)).join('; '),
      progressao: { sim: 'sim', nao: 'não' }[b1.progressao] || '',
      relacao_formacao: b2.relacao || '',
      importancia_cientificas: escala(imp.cientificas),
      importancia_escrita: escala(imp.escrita),
      importancia_geral: escala(imp.geral),
      importancia_insercao: escala(imp.insercao),
      producoes: b3.semProducao ? 'nenhuma' : (b3.producoes || []).map((p) => `${p.tipo}: ${p.titulo} (${p.ano})${p.link ? ` ${p.link}` : ''}`).join(' | '),
      impactos: (b3.impactos || []).join('; '),
      impactos_texto: b3.impactosTexto || '',
      premios: b3.premios || '',
      manter: b4.manter || '',
      mudar: b4.mudar || '',
      incluir: b4.incluir || '',
      disponibilidade: (b4.disponibilidade || []).map((d) => rotulo(R.disponibilidade, d)).join('; '),
      tempo_resposta_min: q && q.duracaoSeg ? Math.round(q.duracaoSeg / 6) / 10 : '',
      dados_json: JSON.stringify(e),
    };
  };

  /* ------------------------------- envio ------------------------------- */
  // Guarda o estado atual do egresso na fila (só o mais recente por id) e tenta enviar.
  C.registrar = function (egressoId, evento) {
    if (!C.ativo()) return Promise.resolve(0);
    const e = DB.obter(egressoId);
    if (!e) return Promise.resolve(C.pendentes());
    const fila = lerFila();
    // marca única: distingue versões do mesmo egresso salvas no mesmo segundo
    fila[e.id] = { versao: 1, marca: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), linha: C.linha(e, evento) };
    gravarFila(fila);
    return C.descarregar();
  };

  let enviando = null;
  C.descarregar = function () {
    if (!C.ativo() || !C.configurado() || typeof root.fetch !== 'function') { C.atualizarStatus(); return Promise.resolve(C.pendentes()); }
    if (enviando) return enviando;
    const tarefa = (async () => {
      await Promise.resolve(); // garante que "enviando" já aponta para esta tarefa
      try {
        let semConexao = false;
        // várias voltas: o que for salvo durante um envio entra na volta seguinte
        for (let volta = 0; volta < 5 && !semConexao; volta++) {
          const fila = lerFila();
          const ids = Object.keys(fila);
          if (!ids.length) break;
          for (const id of ids) {
            const item = fila[id];
            try {
              // text/plain e no-cors: o Apps Script recebe sem bloqueio de CORS (a resposta não é lida)
              await root.fetch(CFG.urlColeta, { method: 'POST', mode: 'no-cors', keepalive: true, body: JSON.stringify(item) });
              const atual = lerFila();
              if (atual[id] && atual[id].marca === item.marca) { delete atual[id]; gravarFila(atual); }
            } catch (err) {
              semConexao = true; // sem conexão: tenta de novo mais tarde
              break;
            }
          }
        }
      } finally {
        enviando = null;
      }
      C.atualizarStatus();
      return C.pendentes();
    })();
    enviando = tarefa;
    C.atualizarStatus();
    return tarefa;
  };

  // Mensagem sobre o envio, em qualquer elemento com data-status-envio
  C.htmlStatus = function () {
    const ic = (n) => (Obs.ui ? Obs.ui.icone(n) : '');
    if (!C.configurado()) {
      return `<div class="caixa-info amarela">${ic('alerta')}<span><strong>Coleta não configurada:</strong> falta o endereço da planilha em js/config.js. As respostas ficam só neste aparelho.</span></div>`;
    }
    const n = C.pendentes();
    if (enviando) return `<div class="caixa-info">${ic('relogio')}<span>Enviando suas respostas…</span></div>`;
    if (n) return `<div class="caixa-info amarela">${ic('relogio')}<span>Sem conexão no momento: suas respostas estão guardadas neste aparelho e serão enviadas automaticamente quando a internet voltar (basta abrir esta página de novo).</span></div>`;
    return `<div class="caixa-info verde">${ic('check')}<span>Respostas enviadas à equipe do Observatório.</span></div>`;
  };
  C.atualizarStatus = function () {
    if (!root.document) return;
    root.document.querySelectorAll('[data-status-envio]').forEach((el) => { el.innerHTML = C.htmlStatus(); });
  };

  /* ------------------- importação da planilha (CSV) ------------------- */
  // CSV no formato do Google Planilhas (vírgula; aspas duplas; quebras de linha dentro de aspas)
  C.lerCsv = function (texto) {
    const s = String(texto || '').replace(/^﻿/, '');
    const sep = (() => {
      const l = s.slice(0, s.indexOf('\n') > 0 ? s.indexOf('\n') : s.length);
      return (l.match(/;/g) || []).length > (l.match(/,/g) || []).length ? ';' : ',';
    })();
    const linhas = [];
    let campo = '';
    let linha = [];
    let aspas = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (aspas) {
        if (ch === '"') {
          if (s[i + 1] === '"') { campo += '"'; i++; } else aspas = false;
        } else campo += ch;
      } else if (ch === '"') aspas = true;
      else if (ch === sep) { linha.push(campo); campo = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && s[i + 1] === '\n') i++;
        linha.push(campo); campo = '';
        if (linha.some((x) => x !== '')) linhas.push(linha);
        linha = [];
      } else campo += ch;
    }
    if (campo !== '' || linha.length) { linha.push(campo); if (linha.some((x) => x !== '')) linhas.push(linha); }
    return linhas;
  };

  // As respostas vêm de um formulário público: limpa textos e confere o formato de cada campo
  function limparTexto(v, max) {
    return String(v == null ? '' : v).replace(/[<>\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, max || 2000);
  }
  function limparTudo(x, prof) {
    if (prof > 8) return null;
    if (typeof x === 'string') return limparTexto(x);
    if (typeof x === 'number') return Number.isFinite(x) ? x : null;
    if (typeof x === 'boolean' || x == null) return x;
    if (Array.isArray(x)) return x.slice(0, 200).map((y) => limparTudo(y, prof + 1));
    if (typeof x === 'object') {
      const o = {};
      Object.keys(x).slice(0, 120).forEach((k) => { if (/^[\w-]{1,60}$/.test(k)) o[k] = limparTudo(x[k], prof + 1); });
      return o;
    }
    return null;
  }
  function registroValido(bruto) {
    if (!bruto || typeof bruto !== 'object' || !/^[A-Za-z0-9_-]{8,64}$/.test(String(bruto.id || ''))) return null;
    const e = limparTudo(bruto, 0);
    if (!e.nome || typeof e.nome !== 'string') return null;
    e.anoDefesa = parseInt(e.anoDefesa, 10) || null;
    e.questionarios = Array.isArray(e.questionarios) ? e.questionarios.filter((q) => q && typeof q === 'object') : [];
    e.producoes = Array.isArray(e.producoes) ? e.producoes.filter((p) => p && typeof p === 'object') : [];
    e.vinculosAnteriores = Array.isArray(e.vinculosAnteriores) ? e.vinculosAnteriores : [];
    const seguro = (l) => (/^https?:\/\/\S+$/i.test(String(l || '')) ? l : '');
    e.producoes.forEach((p) => { p.link = seguro(p.link); });
    e.questionarios.forEach((q) => {
      q.blocos = q.blocos && typeof q.blocos === 'object' ? q.blocos : {};
      const b3 = q.blocos.b3;
      if (b3 && Array.isArray(b3.producoes)) b3.producoes.forEach((p) => { p.link = seguro(p.link); });
      if (q.blocos.b0) {
        q.blocos.b0.linkedin = U.normalizarLinkedin(q.blocos.b0.linkedin) || '';
        q.blocos.b0.lattesId = U.idDoLinkLattes(q.blocos.b0.lattesId) || '';
      }
    });
    if (e.cadastro && typeof e.cadastro === 'object') {
      e.cadastro.linkedin = U.normalizarLinkedin(e.cadastro.linkedin) || '';
      e.cadastro.lattesId = U.lattesValido(e.cadastro.lattesId) ? e.cadastro.lattesId : '';
      if (e.cadastro.orcid && !U.orcidValido(e.cadastro.orcid)) e.cadastro.orcid = '';
    } else {
      e.cadastro = null;
    }
    delete e.papel;
    delete e.codigoTeste;
    return e;
  }

  // Lê o CSV baixado da planilha e devolve os registros prontos para o painel
  C.registrosDoCsv = function (texto) {
    const linhas = C.lerCsv(texto);
    if (!linhas.length) throw new Error('O arquivo está vazio.');
    const cab = linhas[0].map((h) => h.trim());
    const iJson = cab.indexOf('dados_json');
    if (iJson < 0) throw new Error('Não encontrei a coluna dados_json. Baixe a aba "Respostas" da planilha em CSV (Arquivo > Fazer download > Valores separados por vírgula).');
    const registros = [];
    let ignorados = 0;
    linhas.slice(1).forEach((l) => {
      let e = null;
      try { e = registroValido(JSON.parse(l[iJson] || '')); } catch (err) { e = null; }
      if (e) registros.push(e); else ignorados++;
    });
    return { registros, ignorados };
  };

  Obs.coleta = C;

  if (C.ativo() && root.addEventListener) {
    root.addEventListener('online', () => C.descarregar());
    root.addEventListener('load', () => setTimeout(() => C.descarregar(), 800));
  }
})(typeof window !== 'undefined' ? window : globalThis);

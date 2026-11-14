/* =====================================================================
   Tela 2 — Questionário de acompanhamento (E3 do EX08, seção 4.2)
   Etapa inicial obrigatória (link do LinkedIn, do currículo Lattes ou os
   dois) e quatro blocos. O bloco 1 vem pré-preenchido com o cadastro.
   Ao completar os blocos 1 e 2 (critério de "questionário completo" da
   matriz), o cadastro é atualizado e o vínculo passa a contar como
   informado nos últimos 12 meses. O tempo total de resposta é medido.
   ===================================================================== */
(function (root) {
  'use strict';
  const Obs = root.Obs;
  const U = Obs.U;
  const R = Obs.REF;
  const DB = Obs.DB;
  const ui = Obs.ui;
  const I = Obs.Ind;
  const $ = (id) => document.getElementById(id);
  const form = $('form-q');
  const BLOCOS = ['Inserção e mobilidade', 'Relação com a formação', 'Impactos', 'Avaliação do programa'];
  // etapa 0 = perfis on-line (LinkedIn/Lattes); etapas 1 a 4 = blocos do EX08
  const ETAPAS = [0, 1, 2, 3, 4];
  const nomeEtapa = (k) => (k === 0 ? 'Perfis on-line' : BLOCOS[k - 1]);
  const COLETA = !!Obs.config.coleta;
  const CAMPOS_VINCULO = ['semVinculo', 'instituicao', 'cargo', 'setor', 'natureza', 'inicioVinculo', 'cidade', 'uf', 'pais',
    'posGrad', 'docente', 'atuaPPG', 'vinculoInformadoEm', 'atualizadoEm'];

  let egresso = null;
  let qid = null;
  let ciclo = null;
  let etapa = 0;
  let validados = [];
  let producoes = [];
  let salvando = false;
  let editando = false;
  let relogio = null;
  const sessao = { inicioMs: null, inicioIso: null, checkpointMs: null, erros: {}, tentativas: 0, automatico: false };

  /* ----------------------------- auxiliares ----------------------------- */
  const val = (id) => String(($(id) && $(id).value) || '').trim();
  const radio = (nome) => { const r = form.querySelector(`input[name="${nome}"]:checked`); return r ? r.value : ''; };
  const marcarRadio = (nome, v) => { form.querySelectorAll(`input[name="${nome}"]`).forEach((r) => { r.checked = String(r.value) === String(v); }); };
  const marcados = (nome) => [...form.querySelectorAll(`input[name="${nome}"]:checked`)].map((x) => x.value);
  const marcarVarios = (nome, lista) => { form.querySelectorAll(`input[name="${nome}"]`).forEach((x) => { x.checked = (lista || []).includes(x.value); }); };
  const set = (id, v) => { if ($(id)) $(id).value = v == null ? '' : v; };
  const mesParaTexto = (ym) => (ym ? `${ym.slice(5, 7)}/${ym.slice(0, 4)}` : '');
  function textoParaMes(txt) {
    const m = /^(\d{2})\/(\d{4})$/.exec(String(txt || '').trim());
    if (!m || +m[1] < 1 || +m[1] > 12 || +m[2] < 1950) return null;
    return `${m[2]}-${m[1]}`;
  }
  function opcoes(sel, lista, vazio) {
    sel.innerHTML = (vazio ? `<option value="">${vazio}</option>` : '') + lista.map((o) => (typeof o === 'string'
      ? `<option>${U.esc(o)}</option>` : `<option value="${U.esc(o.v)}">${U.esc(o.t)}</option>`)).join('');
  }
  function marcarInicio() {
    if (!sessao.inicioMs) {
      sessao.inicioMs = Date.now();
      sessao.checkpointMs = sessao.inicioMs;
      sessao.inicioIso = U.agora();
      relogio = setInterval(atualizarRelogio, 1000);
    }
  }
  function questionario() {
    const e = egresso && DB.obter(egresso.id);
    return e && qid ? e.questionarios.find((q) => q.id === qid) : null;
  }
  function segundosAcumulados() {
    const q = questionario();
    const base = (q && q.duracaoSeg) || 0;
    return base + (sessao.checkpointMs ? (Date.now() - sessao.checkpointMs) / 1000 : 0);
  }
  function atualizarRelogio() {
    const s = Math.round(segundosAcumulados());
    $('tempo-q').innerHTML = s ? `${ui.icone('relogio')} ${Math.floor(s / 60)}:${U.dois(s % 60)}` : '';
  }

  /* ------------------------------ montagem ------------------------------ */
  function montar() {
    const anoAtual = U.hoje().getFullYear();
    opcoes($('nv-setor'), R.setores, 'Selecione');
    opcoes($('nv-uf'), R.ufs, 'UF');
    opcoes($('q-posGrad'), R.posGrad.map((p) => ({ v: p, t: p === 'Não' ? 'Não' : p })));
    const anos = [];
    for (let a = anoAtual; a >= anoAtual - 12; a--) anos.push(String(a));
    opcoes($('q-anoPos'), anos);
    opcoes($('q-docente'), R.docencia.map((d) => ({ v: d, t: d === 'Não' ? 'Não' : `Sim, ${d.toLowerCase()}` })), 'Selecione');
    opcoes($('p-tipo'), R.tiposProducao);
    $('opcoes-mudancas').innerHTML = R.mudancas.map((m) => `<label class="checagem"><input type="checkbox" name="mud" value="${m.id}"> ${m.rotulo}</label>`).join('')
      + '<label class="checagem"><input type="checkbox" name="mud" value="nenhuma"> Nada mudou</label>';
    $('tabela-importancia').innerHTML = `<thead><tr><th scope="col"><span class="sr">Item</span></th>${R.escalaImportancia.map((n) => `<th scope="col">${n}</th>`).join('')}</tr></thead>
      <tbody>${R.itensImportancia.map((it) => `<tr><th scope="row" style="font-weight:normal;text-align:left">${it.rotulo}</th>
        ${R.escalaImportancia.map((n, i) => `<td><input type="radio" name="imp-${it.id}" value="${i}" aria-label="${it.rotulo}: ${n}"></td>`).join('')}</tr>`).join('')}</tbody>`;
    $('opcoes-impactos').innerHTML = R.impactos.map((x) => `<label class="checagem"><input type="checkbox" name="imp" value="${x}"> ${x}</label>`).join('');
    $('opcoes-disponibilidade').innerHTML = R.disponibilidade.map((x) => `<label class="checagem"><input type="checkbox" name="disp" value="${x.id}"> ${x.rotulo}</label>`).join('');
  }

  /* ------------------------------- estados ------------------------------- */
  function mostrarEstado(html) {
    form.hidden = true;
    $('concluido').hidden = true;
    $('estado').innerHTML = html;
    editando = false;
  }
  function estadoVazio(tipo) {
    $('titulo-q').textContent = 'Questionário de acompanhamento';
    $('lead-q').textContent = 'Leva cerca de 8 minutos. As respostas confirmadas aqui atualizam seu cadastro.';
    const textos = {
      login: COLETA
        ? ['lapis', 'Comece pelo cadastro', 'O questionário é respondido depois do cadastro, que leva cerca de 4 minutos. Se você já fez o cadastro em outro aparelho, preencha de novo aqui: a equipe junta os registros.',
          '<a class="btn btn-primario" href="cadastro.html">Ir para o cadastro</a>']
        : ['usuario', 'Entre para responder', 'O questionário é respondido pelo próprio egresso, identificado pelo idUFSC. Neste protótipo, o login é simulado com egressos fictícios.',
          '<button type="button" class="btn btn-primario" data-login>Entrar com idUFSC (simulado)</button><a class="btn btn-secundario" href="cadastro.html">Ainda não tenho cadastro</a>'],
      cadastro: ['lapis', 'Complete seu cadastro primeiro', `Olá, ${U.esc(U.primeiroNome(egresso && egresso.nome))}. O questionário parte dos dados do seu cadastro, que ainda não foi preenchido.`,
        '<a class="btn btn-primario" href="cadastro.html">Ir para o cadastro</a>'],
      consentimento: ['cadeado', 'Acompanhamento não autorizado', 'Você não autorizou o acompanhamento por questionários. Se mudar de ideia, revise a autorização no seu cadastro.',
        '<a class="btn btn-primario" href="cadastro.html">Revisar autorizações</a>'],
    }[tipo];
    mostrarEstado(`<section class="cartao vazio">${ui.icone(textos[0])}<h2>${textos[1]}</h2><p>${textos[2]}</p><div class="acoes">${textos[3]}</div></section>`);
  }
  function textoPerfis(q) {
    const b0 = (q && q.blocos.b0) || {};
    const c = egresso.cadastro || {};
    const li = b0.linkedin != null ? b0.linkedin : c.linkedin;
    const la = b0.lattesId != null ? b0.lattesId : c.lattesId;
    const partes = [];
    if (li) partes.push(`<a href="${U.esc(li)}" target="_blank" rel="noopener">LinkedIn</a>`);
    if (la) partes.push(`<a href="${U.esc(U.linkLattes(la))}" target="_blank" rel="noopener">Currículo Lattes</a>`);
    return partes.join(' · ') || '—';
  }
  function estadoRespondido(q) {
    const b1 = q.blocos.b1 || {};
    const b2 = q.blocos.b2 || {};
    const b3 = q.blocos.b3 || {};
    const c = egresso.cadastro;
    $('titulo-q').textContent = COLETA ? 'Questionário de acompanhamento de egressos' : `Questionário de acompanhamento: ${I.rotuloCiclo(q.ciclo)}`;
    $('lead-q').textContent = COLETA ? `Respondido em ${U.fmtData(q.respondidoEm)}.` : `Respondido em ${U.fmtData(q.respondidoEm)}. As respostas já entram no painel de indicadores.`;
    mostrarEstado(`
      <section class="cartao painel-sucesso">
        <h2>${ui.icone('check')} Você já respondeu este questionário</h2>
        <table class="tabela tabela-chave" style="margin-top:10px">
          <tr><td>Vínculo atual</td><td>${c.semVinculo ? 'Sem vínculo no momento' : `${U.esc(c.cargo)} · ${U.esc(c.instituicao)} (${U.esc(c.natureza)}, ${U.esc(c.setor)}) · ${U.esc(c.cidade)}/${U.esc(c.uf)} · desde ${U.fmtMes(c.inicioVinculo)}`}</td></tr>
          <tr><td>Mudou desde a titulação</td><td>${(b1.mudancas || []).map((m) => (R.mudancas.find((x) => x.id === m) || { rotulo: 'Nada mudou' }).rotulo).join(', ') || '—'}</td></tr>
          <tr><td>Perfis on-line</td><td>${textoPerfis(q)}</td></tr>
          <tr><td>Relação com a formação</td><td>${b2.relacao ? `${b2.relacao} de 5` : '—'}</td></tr>
          <tr><td>Produções registradas</td><td>${b3.semProducao ? 'Nenhuma' : U.plural((b3.producoes || []).length, 'produção', 'produções')}</td></tr>
          <tr><td>Tempo de resposta</td><td>${q.duracaoSeg ? U.fmtDuracao(q.duracaoSeg) : '—'}</td></tr>
        </table>
        <div class="acoes" style="margin-top:14px">
          <a class="btn btn-secundario" href="cadastro.html">Ver meu cadastro</a>
          <button type="button" class="btn btn-texto" data-novo-questionario>Responder novamente (atualização voluntária)</button>
        </div>
      </section>`);
  }

  /* ---------------------------- formulário ---------------------------- */
  function preencherDeRascunho(q) {
    const c = egresso.cadastro;
    const b0 = (q && q.blocos.b0) || {};
    const b1 = (q && q.blocos.b1) || {};
    const b2 = (q && q.blocos.b2) || {};
    const b3 = (q && q.blocos.b3) || {};
    const b4 = (q && q.blocos.b4) || {};
    form.reset();
    // etapa inicial: parte dos links já informados no cadastro
    set('q-linkedin', b0.linkedin != null ? b0.linkedin : c.linkedin || '');
    const lattes = b0.lattesId != null ? b0.lattesId : c.lattesId;
    set('q-lattes', U.linkLattes(lattes));
    marcarRadio('mesmoVinculo', b1.mesmoVinculo || '');
    const nv = b1.novo || {};
    set('nv-instituicao', nv.instituicao);
    set('nv-cargo', nv.cargo);
    set('nv-setor', nv.setor);
    set('nv-natureza', nv.natureza);
    set('nv-inicio', mesParaTexto(nv.inicioVinculo));
    set('nv-cidade', nv.cidade);
    set('nv-uf', nv.uf || c.uf);
    marcarVarios('mud', b1.mudancas);
    marcarRadio('progressao', b1.progressao || '');
    // o bloco 1 parte do que já está no cadastro
    const antes = q && q.vinculoAntes ? q.vinculoAntes.campos : c;
    set('q-posGrad', b1.posGrad || antes.posGrad || 'Não');
    set('q-anoPos', b1.anoPos || String(U.hoje().getFullYear()));
    set('q-docente', b1.docente || antes.docente || '');
    set('q-atuaPPG', b1.atuaPPG || (antes.atuaPPG ? 'sim' : 'nao'));
    marcarRadio('relacao', b2.relacao || '');
    R.itensImportancia.forEach((it) => marcarRadio(`imp-${it.id}`, b2.importancia && b2.importancia[it.id] != null ? b2.importancia[it.id] : ''));
    producoes = (b3.producoes || []).slice();
    $('semProducao').checked = !!b3.semProducao;
    marcarVarios('imp', b3.impactos);
    set('impactosTexto', b3.impactosTexto);
    set('premios', b3.premios);
    set('manter', b4.manter);
    set('mudar', b4.mudar);
    set('incluir', b4.incluir);
    marcarVarios('disp', b4.disponibilidade);
    const v = antes;
    $('vinculo-atual').innerHTML = `${ui.icone('info')}<span>${v.semVinculo
      ? 'Seu cadastro indica que você está <strong>sem vínculo profissional</strong>.'
      : `Vínculo registrado no seu cadastro: <strong>${U.esc(v.cargo)}</strong> · ${U.esc(v.instituicao)} (${U.esc(v.natureza)}, ${U.esc(v.setor)}) · ${U.esc(v.cidade)}/${U.esc(v.uf)} · desde ${U.fmtMes(v.inicioVinculo)}.`}
      Informado em ${U.fmtData(v.vinculoInformadoEm)}.</span>`;
    const anoMin = Math.max(R.inicioPrograma, egresso.anoDefesa || R.inicioPrograma);
    const anos = [];
    for (let a = U.hoje().getFullYear(); a >= anoMin; a--) anos.push(String(a));
    opcoes($('p-ano'), anos);
    aplicarVisibilidade();
    renderProducoes();
    contarPalavras();
  }

  function iniciarFormulario(q) {
    const anoAtual = U.hoje().getFullYear();
    qid = q ? q.id : null;
    ciclo = q ? q.ciclo : egresso.anoDefesa >= anoAtual ? 'Atualização' : I.cicloDoQuestionario(egresso.anoDefesa, anoAtual);
    validados = (q && q.validados) || [];
    etapa = ETAPAS.find((k) => !validados.includes(k));
    if (etapa == null) etapa = 4;
    // na coleta real, o ciclo fica só nos dados (o egresso não recebeu um convite por ciclo)
    $('titulo-q').textContent = COLETA ? 'Questionário de acompanhamento de egressos' : `Questionário de acompanhamento: ${I.rotuloCiclo(ciclo)}`;
    $('lead-q').textContent = `Leva cerca de ${R.tempoEstimadoQuestionarioMin} minutos. As respostas confirmadas aqui atualizam seu cadastro.${q && !COLETA ? ` Convite enviado em ${U.fmtData(q.enviadoEm)}.` : ''}`;
    $('estado').innerHTML = validados.length
      ? `<div class="caixa-info mb" style="margin-top:0">${ui.icone('relogio')}<span>Você salvou este questionário antes. Continuando de: ${nomeEtapa(etapa)}.</span></div>` : '';
    preencherDeRascunho(q);
    $('concluido').hidden = true;
    form.hidden = false;
    editando = true;
    mostrarEtapa();
    atualizarRelogio();
  }

  function aplicarVisibilidade() {
    $('novo-vinculo').hidden = radio('mesmoVinculo') !== 'mudou';
    const pos = val('q-posGrad');
    $('grupo-anoPos').hidden = !(pos === 'Doutorado em andamento' || pos === 'Pós-doutorado em andamento');
    $('semProducao').disabled = producoes.length > 0;
    if (producoes.length) $('semProducao').checked = false;
    const orcid = egresso && egresso.cadastro && egresso.cadastro.orcid;
    $('btn-importar-orcid').disabled = !orcid;
    $('btn-importar-orcid').title = orcid ? 'Busca produções no registro público do ORCID (simulação)' : 'Conecte seu ORCID no cadastro para importar';
  }

  function mostrarEtapa() {
    form.querySelectorAll('.bloco').forEach((s) => { s.hidden = +s.dataset.bloco !== etapa; });
    $('etapas').innerHTML = ETAPAS.map((k) => {
      const cls = k === etapa ? 'atual' : validados.includes(k) ? 'feita' : '';
      return `<li class="${cls}" data-etapa="${k}" ${k === etapa ? 'aria-current="step"' : ''}>${cls === 'feita' ? ui.icone('check') : ''}${k ? `${k}. ` : ''}${nomeEtapa(k)}</li>`;
    }).join('');
    $('progresso-q').textContent = etapa === 0 ? 'Perfis on-line' : `Bloco ${etapa} de 4`;
    $('barra-q').style.width = `${(validados.filter((k) => ETAPAS.includes(k)).length / ETAPAS.length) * 100}%`;
    $('btn-voltar').hidden = etapa === 0;
    $('btn-avancar').textContent = etapa < 4 ? `Continuar para ${nomeEtapa(etapa + 1)}` : 'Enviar respostas';
    $('resumo-erros').hidden = true;
  }

  /* ----------------------------- produções ----------------------------- */
  function renderProducoes() {
    $('lista-producoes').innerHTML = producoes.length
      ? `<div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Tipo</th><th>Título</th><th>Ano</th><th>Link</th><th><span class="sr">Remover</span></th></tr></thead>
        <tbody>${producoes.map((p, i) => `<tr><td>${U.esc(p.tipo)}</td><td>${U.esc(p.titulo)}</td><td>${p.ano}</td>
          <td>${p.link ? `<a href="${U.esc(p.link)}" target="_blank" rel="noopener">${/doi\.org/.test(p.link) ? 'DOI' : 'link'}</a>` : '—'} ${p.fonte === 'ORCID' ? '<span class="chip chip-verde">ORCID</span>' : ''}</td>
          <td><button type="button" class="btn-icone" data-remover="${i}" aria-label="Remover ${U.esc(p.titulo)}">${ui.icone('x')}</button></td></tr>`).join('')}</tbody></table></div>`
      : '<p class="texto-apoio">Nenhuma produção adicionada.</p>';
    aplicarVisibilidade();
  }
  function normalizarLink(l) {
    l = String(l || '').trim();
    if (!l) return '';
    if (/^10\.\d{4,9}\/\S+$/.test(l)) return `https://doi.org/${l}`;
    if (/^https?:\/\/\S+\.\S+/.test(l)) return l;
    return null;
  }
  function adicionarProducao() {
    marcarInicio();
    limparErro($('p-titulo'));
    limparErro($('p-link'));
    const titulo = val('p-titulo');
    const link = normalizarLink(val('p-link'));
    const prob = [];
    if (titulo.length < 5) prob.push({ el: $('p-titulo'), msg: 'Informe o título da produção.' });
    if (link === null) prob.push({ el: $('p-link'), msg: 'Use um endereço que comece com https:// ou um DOI (10.xxxx/...).' });
    if (prob.length) { mostrarErros(prob, false); return; }
    producoes.push({ tipo: val('p-tipo'), titulo, ano: +val('p-ano'), link, fonte: 'Questionário' });
    set('p-titulo', '');
    set('p-link', '');
    renderProducoes();
    limparErro($('grupo-producoes'));
  }
  function importarOrcid() {
    marcarInicio();
    const rafael = egresso.papel === 'rafael';
    const ano = U.hoje().getFullYear();
    const novas = rafael ? [
      { tipo: 'Artigo em periódico', titulo: 'Gamificação no ensino de programação: um estudo na rede estadual de Santa Catarina', ano: Math.max(egresso.anoDefesa, ano - 1), link: 'https://doi.org/10.5555/ppgtic.2025.901', fonte: 'ORCID' },
      { tipo: 'Artigo em periódico', titulo: 'Engajamento de estudantes em aulas de programação gamificadas', ano, link: 'https://doi.org/10.5555/ppgtic.2026.902', fonte: 'ORCID' },
    ] : [
      { tipo: 'Trabalho em evento', titulo: `Resultados de: ${egresso.titulo}`.slice(0, 120), ano, link: `https://doi.org/10.5555/ppgtic.${ano}.${Math.floor(Math.random() * 900 + 100)}`, fonte: 'ORCID' },
    ];
    let n = 0;
    novas.forEach((p) => {
      if (!producoes.some((x) => x.titulo.toLowerCase() === p.titulo.toLowerCase())) { producoes.push(p); n++; }
    });
    renderProducoes();
    limparErro($('grupo-producoes'));
    ui.toast(n ? `${U.plural(n, 'produção importada', 'produções importadas')} do registro público do ORCID (simulação).` : 'Nenhuma produção nova encontrada no ORCID.', n ? 'sucesso' : 'info');
  }
  function contarPalavras() {
    const n = U.contarPalavras(val('impactosTexto'));
    const el = $('contador-impactos');
    el.textContent = `${n} de ${R.limitePalavrasImpacto} palavras`;
    el.classList.toggle('excedido', n > R.limitePalavrasImpacto);
  }

  /* ------------------------------ validação ------------------------------ */
  function limparErro(el) {
    if (!el) return;
    el.classList.remove('invalido', 'grupo-invalido');
    el.removeAttribute('aria-invalid');
    const m = document.getElementById(`erro-${el.id}`);
    if (m) m.remove();
  }
  function limparErros() {
    form.querySelectorAll('.invalido, .grupo-invalido').forEach(limparErro);
    $('resumo-erros').hidden = true;
  }
  function mostrarErros(problemas, contar) {
    problemas.forEach(({ el, msg }) => {
      const grupo = el.tagName === 'FIELDSET' || el.classList.contains('pergunta');
      el.classList.add(grupo ? 'grupo-invalido' : 'invalido');
      if (!grupo) el.setAttribute('aria-invalid', 'true');
      const div = document.createElement('div');
      div.className = 'msg-erro';
      div.id = `erro-${el.id}`;
      div.innerHTML = `${ui.icone('alerta')}<span>${U.esc(msg)}</span>`;
      if (grupo) el.appendChild(div);
      else (el.closest('.campo-com-botao') || el).insertAdjacentElement('afterend', div);
      if (contar !== false) {
        const rotulo = el.dataset.rotulo || el.id;
        sessao.erros[rotulo] = (sessao.erros[rotulo] || 0) + 1;
      }
    });
    if (contar !== false) {
      const box = $('resumo-erros');
      box.innerHTML = `${ui.icone('alerta')}<span>Revise ${problemas.length === 1 ? 'a questão destacada' : `as ${problemas.length} questões destacadas`} antes de continuar.</span>`;
      box.hidden = false;
    }
    const alvo = problemas[0].el;
    alvo.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const foco = alvo.matches('input, select, textarea') ? alvo : alvo.querySelector('input, select, textarea');
    if (foco) foco.focus({ preventScroll: true });
  }
  function validarBloco(n) {
    const p = [];
    if (n === 0) {
      const li = U.normalizarLinkedin(val('q-linkedin'));
      const la = U.idDoLinkLattes(val('q-lattes'));
      if (li === null) p.push({ el: $('q-linkedin'), msg: 'Use o endereço do seu perfil: linkedin.com/in/seu-perfil.' });
      if (la === null) p.push({ el: $('q-lattes'), msg: 'Use o "Endereço para acessar este CV": lattes.cnpq.br/ seguido de 16 números.' });
      if (li === '' && la === '') p.push({ el: $('grupo-perfis'), msg: 'Informe pelo menos um: o link do LinkedIn ou o do currículo Lattes.' });
    }
    if (n === 1) {
      const mesmo = radio('mesmoVinculo');
      if (!mesmo) p.push({ el: $('grupo-mesmoVinculo'), msg: 'Escolha uma opção.' });
      if (mesmo === 'mudou') {
        form.querySelectorAll('[data-nv]').forEach((el) => { if (!val(el.id)) p.push({ el, msg: 'Campo obrigatório.' }); });
        const ini = val('nv-inicio');
        if (ini && !textoParaMes(ini)) p.push({ el: $('nv-inicio'), msg: 'Use o formato MM/AAAA.' });
        else if (ini && U.parse(textoParaMes(ini)) > U.hoje()) p.push({ el: $('nv-inicio'), msg: 'A data não pode estar no futuro.' });
      }
      if (!marcados('mud').length) p.push({ el: $('grupo-mudancas'), msg: 'Marque ao menos uma opção (ou "Nada mudou").' });
      if (!radio('progressao')) p.push({ el: $('grupo-progressao'), msg: 'Escolha uma opção.' });
      if (!val('q-docente')) p.push({ el: $('q-docente'), msg: 'Campo obrigatório.' });
      if (!val('q-atuaPPG')) p.push({ el: $('q-atuaPPG'), msg: 'Campo obrigatório.' });
    }
    if (n === 2) {
      if (!radio('relacao')) p.push({ el: $('grupo-relacao'), msg: 'Escolha um valor de 1 a 5.' });
      const faltam = R.itensImportancia.filter((it) => radio(`imp-${it.id}`) === '');
      if (faltam.length) p.push({ el: $('grupo-importancia'), msg: `Responda: ${faltam.map((f) => f.rotulo).join(', ')}.` });
    }
    if (n === 3) {
      if (!producoes.length && !$('semProducao').checked) p.push({ el: $('grupo-producoes'), msg: 'Adicione ao menos uma produção ou marque que não tem produções a registrar.' });
      if (U.contarPalavras(val('impactosTexto')) > R.limitePalavrasImpacto) p.push({ el: $('impactosTexto'), msg: `Use no máximo ${R.limitePalavrasImpacto} palavras.` });
    }
    return p;
  }

  /* ------------------------------ gravação ------------------------------ */
  function coletar(n) {
    if (n === 0) {
      const li = U.normalizarLinkedin(val('q-linkedin'));
      const la = U.idDoLinkLattes(val('q-lattes'));
      return { linkedin: li || '', lattesId: la || '' };
    }
    if (n === 1) {
      const mesmo = radio('mesmoVinculo');
      const pos = val('q-posGrad');
      const b1 = { mesmoVinculo: mesmo, mudancas: marcados('mud'), progressao: radio('progressao'), posGrad: pos,
        anoPos: /andamento/.test(pos) ? val('q-anoPos') : '', docente: val('q-docente'), atuaPPG: val('q-atuaPPG') };
      if (mesmo === 'mudou') {
        b1.novo = { instituicao: val('nv-instituicao'), cargo: val('nv-cargo'), setor: val('nv-setor'), natureza: val('nv-natureza'),
          inicioVinculo: textoParaMes(val('nv-inicio')), cidade: val('nv-cidade'), uf: val('nv-uf') };
      }
      return b1;
    }
    if (n === 2) {
      const imp = {};
      R.itensImportancia.forEach((it) => { const v = radio(`imp-${it.id}`); imp[it.id] = v === '' ? null : +v; });
      return { relacao: +radio('relacao') || null, importancia: imp };
    }
    if (n === 3) {
      return { producoes: producoes.slice(), semProducao: $('semProducao').checked, impactos: marcados('imp'),
        impactosTexto: val('impactosTexto'), premios: val('premios') };
    }
    return { manter: val('manter'), mudar: val('mudar'), incluir: val('incluir'), disponibilidade: marcados('disp') };
  }

  function aplicarNoCadastro(e, q) {
    const c = e.cadastro;
    const b1 = q.blocos.b1;
    const hoje = U.hoje();
    if (q.vinculoAntes) {
      // reaplicação (o egresso voltou ao bloco 1): parte do cadastro original
      Object.assign(c, q.vinculoAntes.campos);
      e.vinculosAnteriores.length = q.vinculoAntes.nAnteriores;
    } else {
      const campos = {};
      CAMPOS_VINCULO.forEach((k) => { campos[k] = c[k]; });
      q.vinculoAntes = { campos, nAnteriores: e.vinculosAnteriores.length };
    }
    const atual = { instituicao: c.instituicao, cargo: c.cargo, setor: c.setor, natureza: c.natureza, cidade: c.cidade, uf: c.uf, inicio: c.inicioVinculo };
    if (b1.mesmoVinculo === 'mudou' && b1.novo) {
      if (!c.semVinculo) e.vinculosAnteriores.push(Object.assign(atual, { fim: b1.novo.inicioVinculo }));
      Object.assign(c, { semVinculo: false, instituicao: b1.novo.instituicao, cargo: b1.novo.cargo, setor: b1.novo.setor,
        natureza: b1.novo.natureza, inicioVinculo: b1.novo.inicioVinculo, cidade: b1.novo.cidade, uf: b1.novo.uf,
        pais: b1.novo.uf === 'Exterior' ? (c.pais && c.pais !== 'Brasil' ? c.pais : 'Exterior') : 'Brasil' });
    } else if (b1.mesmoVinculo === 'sem') {
      if (!c.semVinculo) e.vinculosAnteriores.push(Object.assign(atual, { fim: U.isoMes(hoje) }));
      Object.assign(c, { semVinculo: true, instituicao: '', cargo: '', setor: '', natureza: '', inicioVinculo: '' });
    }
    c.posGrad = b1.posGrad || c.posGrad;
    c.docente = b1.docente || c.docente;
    c.atuaPPG = b1.atuaPPG === 'sim';
    c.vinculoInformadoEm = U.iso(hoje);
    c.atualizadoEm = U.iso(hoje);
  }

  function garantirQuestionario() {
    if (qid) return;
    DB.alterar(egresso.id, (e) => {
      const q = { id: `q-${e.id}-${e.questionarios.length + 1}-${Date.now().toString(36)}`, ciclo, enviadoEm: U.iso(U.hoje()),
        iniciadoEm: U.iso(U.hoje()), respondidoEm: null, finalizadoEm: null, completo: false, etapa: 0, validados: [],
        duracaoSeg: 0, viaPrototipo: true, blocos: {} };
      e.questionarios.push(q);
      qid = q.id;
    });
  }

  function gravarBloco(n, validado) {
    salvando = true;
    garantirQuestionario();
    const dados = coletar(n);
    const agoraMs = Date.now();
    const delta = sessao.checkpointMs ? (agoraMs - sessao.checkpointMs) / 1000 : 0;
    if (sessao.checkpointMs) sessao.checkpointMs = agoraMs;
    DB.alterar(egresso.id, (e) => {
      const q = e.questionarios.find((x) => x.id === qid);
      q.blocos[`b${n}`] = dados;
      q.duracaoSeg = (q.duracaoSeg || 0) + delta;
      if (!q.iniciadoEm) q.iniciadoEm = U.iso(U.hoje());
      if (!q.primeiraInteracao && sessao.inicioIso) q.primeiraInteracao = sessao.inicioIso;
      q.viaPrototipo = true;
      q.validados = q.validados || [];
      if (validado && !q.validados.includes(n)) q.validados.push(n);
      q.etapa = Math.max(q.etapa || 0, validado ? n : 0);
      if (validado && (n === 1 || n === 2) && q.validados.includes(1) && q.validados.includes(2)) {
        q.completo = true;
        q.respondidoEm = U.iso(U.hoje());
        aplicarNoCadastro(e, q);
      }
      if (n === 3) {
        const titulos = new Set();
        e.producoes = (e.producoes || []).filter((p) => p.q !== qid).filter((p) => { titulos.add(p.titulo.toLowerCase()); return true; });
        dados.producoes.forEach((p) => { if (!titulos.has(p.titulo.toLowerCase())) e.producoes.push(Object.assign({}, p, { q: qid })); });
      }
      if (n === 0 && validado) aplicarPerfis(e, dados);
      validados = q.validados.slice();
    });
    egresso = DB.obter(egresso.id);
    salvando = false;
    // envio à planilha a cada etapa concluída (a última é enviada por finalizar(), já com a data de envio)
    if (COLETA && validado && n < 4) Obs.coleta.registrar(egresso.id, `questionário: ${nomeEtapa(n).toLowerCase()}`);
  }

  // Os links da etapa inicial atualizam o cadastro (o ID Lattes novo volta a aguardar conferência)
  function aplicarPerfis(e, dados) {
    const c = e.cadastro;
    c.linkedin = dados.linkedin;
    if (dados.lattesId !== (c.lattesId || '')) {
      c.lattesId = dados.lattesId;
      e.lattes = dados.lattesId ? { atualizadoEm: null, conferidoEm: null, declarado: false } : null;
    }
    c.atualizadoEm = U.iso(U.hoje());
  }

  function finalizar() {
    gravarBloco(4, true);
    salvando = true;
    let total = 0;
    let q = null;
    DB.alterar(egresso.id, (e) => {
      q = e.questionarios.find((x) => x.id === qid);
      q.finalizadoEm = U.agora();
      if (!q.respondidoEm) q.respondidoEm = U.iso(U.hoje());
      total = q.duracaoSeg || 0;
    });
    const dadosEv = {
      egressoId: egresso.id, codigo: DB.codigoSessao(egresso), tela: 'questionario',
      inicio: q.primeiraInteracao || sessao.inicioIso || U.agora(), fim: U.agora(), duracaoSeg: total,
      erros: Object.assign({}, sessao.erros), totalErros: Object.values(sessao.erros).reduce((a, b) => a + b, 0),
      tentativas: sessao.tentativas, automatico: sessao.automatico, concluido: true, seq: null, comentario: '', ciclo,
    };
    // na coleta real, o tempo fica no próprio questionário; as evidências são dos testes de usabilidade
    const ev = COLETA ? dadosEv : DB.registrarEvidencia(dadosEv);
    clearInterval(relogio);
    relogio = null;
    Object.assign(sessao, { inicioMs: null, inicioIso: null, checkpointMs: null, erros: {}, tentativas: 0, automatico: false });
    salvando = false;
    egresso = DB.obter(egresso.id);
    if (COLETA) Obs.coleta.registrar(egresso.id, 'questionário enviado');
    mostrarConcluido(q, ev);
  }

  function mostrarConcluido(q, ev) {
    editando = false;
    form.hidden = true;
    $('estado').innerHTML = '';
    const e = egresso;
    const c = e.cadastro;
    const b1 = q.blocos.b1 || {};
    const crit = I.criterios(e, U.hoje());
    const lat = I.situacaoLattes(e, U.hoje());
    const dentro = ev.duracaoSeg <= R.tempoEstimadoQuestionarioMin * 60;
    const box = $('concluido');
    box.hidden = false;
    if (COLETA) {
      box.innerHTML = `
      <section class="cartao painel-sucesso" aria-live="polite">
        <h2>${ui.icone('check')} Respostas registradas. Obrigado, ${U.esc(U.primeiroNome(e.nome))}!</h2>
        <p>${b1.mesmoVinculo === 'mudou' ? `Seu cadastro foi atualizado com o novo vínculo: <strong>${U.esc(c.cargo)}</strong> · ${U.esc(c.instituicao)}.`
          : b1.mesmoVinculo === 'sem' ? 'Seu cadastro foi atualizado: sem vínculo profissional no momento.' : 'Seu vínculo foi confirmado.'}
          Tempo de resposta: <strong>${U.fmtDuracao(ev.duracaoSeg)}</strong>.</p>
        <div data-status-envio>${Obs.coleta.htmlStatus()}</div>
        <p class="texto-apoio" style="margin-top:12px">Você pode fechar esta página. Se algo mudar na sua trajetória, volte a este endereço neste aparelho para atualizar.</p>
      </section>`;
      root.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    box.innerHTML = `
      <section class="cartao painel-sucesso" aria-live="polite">
        <h2>${ui.icone('check')} Respostas registradas. Obrigado, ${U.esc(U.primeiroNome(e.nome))}!</h2>
        <p>${b1.mesmoVinculo === 'mudou' ? `Seu cadastro foi atualizado com o novo vínculo: <strong>${U.esc(c.cargo)}</strong> · ${U.esc(c.instituicao)} (desde ${U.fmtMes(c.inicioVinculo)}).`
          : b1.mesmoVinculo === 'sem' ? 'Seu cadastro foi atualizado: sem vínculo profissional no momento.'
            : 'Seu vínculo foi confirmado e o cadastro ficou marcado como atualizado hoje.'}</p>
        <p>Tempo de resposta: <strong>${U.fmtDuracao(ev.duracaoSeg)}</strong> (estimativa da V1: ${R.tempoEstimadoQuestionarioMin} min)
          ${ev.automatico ? '<span class="chip chip-cinza">preenchimento automático</span>' : dentro ? `<span class="chip chip-verde">${ui.icone('check')} dentro da estimativa</span>` : '<span class="chip chip-amarelo-claro">acima da estimativa</span>'}</p>
        <div class="criterios" style="margin:14px 0">
          ${[['E-mail confirmado', crit.email], ['Vínculo informado (12 meses)', crit.vinculo], ['Lattes conferido', crit.lattes]].map(([t, ok]) => `
            <div class="criterio ${ok ? 'ok' : 'pendente'}"><span class="criterio-marca">${ui.icone(ok ? 'check' : 'relogio')}</span><div><strong>${t}</strong>
            <span>${ok ? 'Atendido' : t === 'Lattes conferido' ? U.esc(lat.texto) : 'Pendente'}</span></div></div>`).join('')}
        </div>
        <form id="form-seq" class="pergunta" style="border-top:1px solid var(--borda);padding-top:16px">
          <fieldset>
            <legend><strong>Avalie o preenchimento</strong> <span class="opcional">(opcional, usado nos testes do EX09)</span></legend>
            <p class="texto-apoio">No geral, quão fácil foi responder este questionário?</p>
            <div class="escala">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<label><input type="radio" name="seq" value="${n}"><span>${n}</span></label>`).join('')}</div>
            <div class="escala-rotulos" style="max-width:520px"><span>1 = muito difícil</span><span>7 = muito fácil</span></div>
          </fieldset>
          <label class="rotulo" for="seq-comentario" style="margin-top:12px">Comentário <span class="opcional">(opcional)</span></label>
          <textarea class="campo" id="seq-comentario" style="min-height:56px" placeholder="O que foi confuso ou poderia melhorar?"></textarea>
          <div class="acoes" style="margin-top:12px">
            <button type="submit" class="btn btn-primario">Enviar avaliação</button>
            <a class="btn btn-secundario" href="cadastro.html">Ver meu cadastro</a>
            <a class="btn btn-texto" href="indicadores.html">Ver o painel de indicadores</a>
          </div>
        </form>
      </section>`;
    $('form-seq').addEventListener('submit', (evt) => {
      evt.preventDefault();
      const seq = (box.querySelector('input[name="seq"]:checked') || {}).value;
      if (!seq) { ui.toast('Escolha um valor de 1 a 7.', 'erro'); return; }
      DB.atualizarEvidencia(ev.id, { seq: +seq, comentario: $('seq-comentario').value.trim() });
      $('form-seq').innerHTML = `<div class="caixa-info verde">${ui.icone('check')}<span>Avaliação registrada (facilidade ${seq} de 7). Obrigado!</span></div>`;
    });
    root.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ------------------------------ exemplo ------------------------------ */
  Obs.tela.preencherExemplo = function () {
    if (!editando) { ui.toast('Entre como egresso com cadastro para preencher o questionário.', 'info'); return; }
    sessao.automatico = true;
    marcarInicio();
    const rafael = egresso.papel === 'rafael';
    const ano = U.hoje().getFullYear();
    if (!val('q-linkedin') && !val('q-lattes')) {
      const perfil = U.semAcento(egresso.nome || 'egresso').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      set('q-linkedin', `https://www.linkedin.com/in/${perfil}-exemplo`);
    }
    if (rafael) {
      marcarRadio('mesmoVinculo', 'mudou');
      set('nv-instituicao', 'Instituto Federal de Santa Catarina');
      set('nv-cargo', 'Professor substituto');
      set('nv-setor', 'Ensino superior');
      set('nv-natureza', 'Pública');
      set('nv-inicio', `02/${ano}`);
      set('nv-cidade', 'Araranguá');
      set('nv-uf', 'SC');
      marcarVarios('mud', ['cargo', 'nivel', 'regiao']);
      marcarRadio('progressao', 'sim');
      set('q-posGrad', 'Doutorado em andamento');
      set('q-anoPos', String(ano));
      set('q-docente', 'Ensino superior');
      set('q-atuaPPG', 'nao');
      marcarRadio('relacao', 5);
      marcarRadio('imp-cientificas', 4);
      marcarRadio('imp-escrita', 3);
      marcarRadio('imp-geral', 3);
      marcarRadio('imp-insercao', 4);
      if (!producoes.length) {
        producoes = [
          { tipo: 'Artigo em periódico', titulo: 'Gamificação no ensino de programação: um estudo na rede estadual de Santa Catarina', ano: Math.max(egresso.anoDefesa, ano - 1), link: 'https://doi.org/10.5555/ppgtic.2025.901', fonte: 'ORCID' },
          { tipo: 'Artigo em periódico', titulo: 'Engajamento de estudantes em aulas de programação gamificadas', ano, link: 'https://doi.org/10.5555/ppgtic.2026.902', fonte: 'ORCID' },
        ];
      }
      marcarVarios('imp', ['Acadêmico', 'Profissional', 'Social']);
      set('impactosTexto', 'A metodologia foi adotada em 6 escolas da rede estadual, alcançando cerca de 900 estudantes. Publicou 2 artigos com a orientadora. Passou da educação básica para o ensino superior um ano após a titulação.');
      set('manter', 'As disciplinas de metodologia de pesquisa e o acompanhamento próximo da orientação.');
      set('mudar', 'Mais disciplinas no período noturno, para quem trabalha.');
      set('incluir', 'Uma disciplina de docência no ensino superior.');
      marcarVarios('disp', ['bancas', 'palestras']);
    } else {
      marcarRadio('mesmoVinculo', 'sim');
      marcarVarios('mud', ['nenhuma']);
      marcarRadio('progressao', 'nao');
      set('q-posGrad', 'Não');
      if (!val('q-docente')) set('q-docente', 'Não');
      set('q-atuaPPG', 'nao');
      marcarRadio('relacao', 4);
      marcarRadio('imp-cientificas', 3);
      marcarRadio('imp-escrita', 3);
      marcarRadio('imp-geral', 2);
      marcarRadio('imp-insercao', 3);
      if (!producoes.length) $('semProducao').checked = true;
      marcarVarios('imp', ['Profissional']);
      set('impactosTexto', 'Aplico no trabalho os métodos de pesquisa e de análise de dados aprendidos no mestrado.');
      set('incluir', 'Mais disciplinas com projetos aplicados em parceria com empresas da região.');
      marcarVarios('disp', ['palestras']);
    }
    limparErros();
    aplicarVisibilidade();
    renderProducoes();
    contarPalavras();
    ui.toast('Questionário preenchido com o exemplo do EX08. Avance pelos blocos com "Continuar".', 'info');
  };

  /* ------------------------------- eventos ------------------------------- */
  function ligarEventos() {
    form.addEventListener('input', (ev) => {
      marcarInicio();
      const el = ev.target;
      if (el.hasAttribute('data-mes')) {
        const d = el.value.replace(/\D/g, '').slice(0, 6);
        el.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
      }
      if (el.id === 'impactosTexto') contarPalavras();
      if (el.classList.contains('invalido')) limparErro(el);
    });
    form.addEventListener('change', (ev) => {
      marcarInicio();
      const el = ev.target;
      if (el.name === 'mud') {
        if (el.value === 'nenhuma' && el.checked) marcarVarios('mud', ['nenhuma']);
        else if (el.checked) form.querySelector('input[name="mud"][value="nenhuma"]').checked = false;
      }
      if (el.id === 'nv-setor') { const n = R.naturezaPorSetor[el.value]; if (n) set('nv-natureza', n); }
      if (el.id === 'semProducao' && el.checked) limparErro($('grupo-producoes'));
      const grupo = el.closest('.grupo-invalido');
      if (grupo) limparErro(grupo);
      if (el.classList.contains('invalido')) limparErro(el);
      aplicarVisibilidade();
    });
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      marcarInicio();
      sessao.tentativas++;
      limparErros();
      const prob = validarBloco(etapa);
      if (prob.length) { mostrarErros(prob); return; }
      if (etapa < 4) {
        gravarBloco(etapa, true);
        etapa++;
        mostrarEtapa();
        $('etapas').scrollIntoView({ block: 'start', behavior: 'smooth' });
        if (etapa === 3 && validados.includes(2) && !COLETA) ui.toast('Blocos 1 e 2 completos: seu cadastro já foi atualizado.', 'sucesso');
      } else {
        finalizar();
      }
    });
    $('btn-voltar').addEventListener('click', () => {
      if (etapa > 0) { gravarBloco(etapa, false); etapa--; mostrarEtapa(); }
    });
    $('btn-depois').addEventListener('click', () => {
      gravarBloco(etapa, false);
      ui.toast('Respostas salvas. Você pode continuar depois, do mesmo ponto.', 'sucesso');
    });
    $('etapas').addEventListener('click', (ev) => {
      const li = ev.target.closest('li.feita');
      if (!li) return;
      const k = +li.dataset.etapa;
      gravarBloco(etapa, false);
      etapa = k;
      mostrarEtapa();
    });
    $('btn-add-producao').addEventListener('click', adicionarProducao);
    $('p-titulo').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); adicionarProducao(); } });
    $('btn-importar-orcid').addEventListener('click', importarOrcid);
    $('lista-producoes').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-remover]');
      if (!b) return;
      producoes.splice(+b.dataset.remover, 1);
      renderProducoes();
    });
    document.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-login]')) ui.abrirLogin();
      if (ev.target.closest('[data-novo-questionario]')) {
        qid = null;
        iniciarFormulario(null);
        ciclo = 'Atualização';
        if (!COLETA) $('titulo-q').textContent = `Questionário de acompanhamento: ${I.rotuloCiclo(ciclo)}`;
      }
    });
  }

  function render() {
    egresso = DB.egressoLogado();
    if (relogio) { clearInterval(relogio); relogio = null; }
    Object.assign(sessao, { inicioMs: null, inicioIso: null, checkpointMs: null, erros: {}, tentativas: 0, automatico: false });
    if (!egresso) { estadoVazio('login'); return; }
    if (!egresso.cadastro) { estadoVazio('cadastro'); return; }
    if (!egresso.cadastro.consentAcompanhamento) { estadoVazio('consentimento'); return; }
    const hoje = U.hoje();
    const qs = egresso.questionarios || [];
    const aberto = qs.filter((q) => !q.finalizadoEm && q.enviadoEm && I.dentroDe12Meses(q.enviadoEm, hoje)).pop();
    if (aberto) { iniciarFormulario(aberto); return; }
    const feito = qs.filter((q) => q.finalizadoEm && I.dentroDe12Meses(String(q.finalizadoEm).slice(0, 10), hoje)).pop();
    if (feito) { estadoRespondido(feito); return; }
    iniciarFormulario(null);
  }
  function aoMudar(tipo) {
    if (salvando) return;
    if (tipo === 'perfil') { render(); return; }
    if (!editando && $('concluido').hidden) render();
  }

  montar();
  ligarEventos();
  ui.iniciar({ tela: 'questionario', render, aoMudar });
})(window);

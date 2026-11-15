/* =====================================================================
   Tela 1 — Cadastro do egresso (E2 do EX08, seção 4.1)
   Novidades da V2: validação campo a campo, faixa calculada na hora,
   formação vinda da Secretaria (login idUFSC simulado), caso "sem
   vínculo", ORCID com dígito verificador e conexão simulada, situação
   dos três critérios de dados mínimos e medição do tempo de preenchimento.
   No modo coleta (site publicado), o novo cadastro é real: vai para a
   planilha da equipe, sem login simulado, ORCID simulado nem evidências.
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
  const form = $('form-cadastro');
  const COLETA = !!Obs.config.coleta;
  const coleta = Obs.coleta;

  const sessao = { inicioMs: null, inicioIso: null, erros: {}, tentativas: 0, automatico: false };
  let modo = 'novo'; // novo | primeiro | atualizar
  let egresso = null;
  let orcidVerificado = false;
  let mostrandoSucesso = false;
  let salvando = false;
  let idSucesso = null;
  let ultimaEvidencia = null;
  let foiNovo = false;

  const EXEMPLO_RAFAEL = {
    email: 'rafael.clima@email.com',
    instituicao: 'Secretaria de Estado da Educação de SC', cargo: 'Professor de informática', setor: 'Educação básica',
    natureza: 'Pública', inicio: '03/2020', cidade: 'Criciúma', uf: 'SC', pais: 'Brasil',
    vinculoIngresso: 'Professor de informática na rede estadual', orcid: '0000-0002-1825-0097', orcidConectado: true,
    lattesId: '4721839560123478', lattesMesesAtras: 2,
  };
  const PERSONAS = [
    { nome: 'Carla Nunes Teixeira', email: 'carla.teixeira@example.com', nivel: 'ME', ano: '2023',
      linha: 'Tecnologia Computacional', orientador: 'Prof.ª Orientadora L', titulo: 'Detecção de anomalias em redes de sensores com aprendizado de máquina',
      instituicao: 'Empresa de análise de dados', cargo: 'Cientista de dados', setor: 'Empresa privada', natureza: 'Privada', inicio: '08/2023',
      cidade: 'Florianópolis', uf: 'SC', lattesId: '0000531907246815', lattesMesesAtras: 3 },
    { nome: 'Diego Martins Colombo', email: 'diego.colombo@example.com', nivel: 'ME', ano: '2022',
      linha: 'Tecnologia, Gestão e Inovação', orientador: 'Prof. Orientador K', titulo: 'Gestão ágil de projetos em uma cooperativa de crédito do sul catarinense',
      instituicao: 'Cooperativa de crédito', cargo: 'Gerente de projetos', setor: 'Empresa privada', natureza: 'Privada', inicio: '02/2021',
      cidade: 'Criciúma', uf: 'SC', lattesId: '0000874120956321', lattesMesesAtras: 6 },
    { nome: 'Luana Back Pereira', email: 'luana.pereira@example.com', nivel: 'ME', ano: '2021',
      linha: 'Tecnologia Educacional', orientador: 'Prof. Orientador M', titulo: 'Realidade aumentada no ensino de geografia nos anos finais do ensino fundamental',
      instituicao: 'Rede municipal de ensino de Araranguá', cargo: 'Professora de geografia', setor: 'Educação básica', natureza: 'Pública', inicio: '03/2018',
      cidade: 'Araranguá', uf: 'SC', lattesId: '0000312478965102', lattesMesesAtras: 1 },
  ];
  let iPersona = 0;

  /* ----------------------------- auxiliares ----------------------------- */
  const mesParaTexto = (ym) => (ym ? `${ym.slice(5, 7)}/${ym.slice(0, 4)}` : '');
  function textoParaMes(txt) {
    const m = /^(\d{2})\/(\d{4})$/.exec(String(txt || '').trim());
    if (!m) return null;
    const mes = +m[1];
    const ano = +m[2];
    if (mes < 1 || mes > 12 || ano < 1950) return null;
    return `${m[2]}-${m[1]}`;
  }
  const val = (id) => String(($(id) && $(id).value) || '').trim();
  function set(id, v) {
    const el = $(id);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v == null ? '' : v;
  }
  function opcoes(sel, lista, vazio) {
    sel.innerHTML = (vazio ? `<option value="">${vazio}</option>` : '') + lista.map((o) => (typeof o === 'string'
      ? `<option>${U.esc(o)}</option>` : `<option value="${U.esc(o.v)}">${U.esc(o.t)}</option>`)).join('');
  }
  function orcidFicticio() {
    const corpo = '00000000' + String(1000000 + Math.floor(Math.random() * 8999999));
    let total = 0;
    for (let i = 0; i < 15; i++) total = (total + parseInt(corpo[i], 10)) * 2;
    const r = (12 - (total % 11)) % 11;
    const d = corpo + (r === 10 ? 'X' : String(r));
    return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8, 12)}-${d.slice(12)}`;
  }
  function marcarInicio() {
    if (!sessao.inicioMs) { sessao.inicioMs = Date.now(); sessao.inicioIso = U.agora(); }
  }

  /* ------------------------------ montagem ------------------------------ */
  function montarSelects() {
    const anoAtual = U.hoje().getFullYear();
    const anos = [];
    for (let a = anoAtual; a >= R.inicioPrograma; a--) anos.push(String(a));
    opcoes($('anoDefesa'), anos, 'Selecione');
    opcoes($('linha'), R.linhas, 'Selecione');
    filtrarOrientadores();
    opcoes($('setor'), R.setores, 'Selecione');
    opcoes($('uf'), R.ufs, 'Selecione');
    opcoes($('posGrad'), R.posGrad.map((p) => ({ v: p, t: p })));
  }
  // No modo coleta (site oficial), o egresso escreve o nome do(a) orientador(a);
  // na demonstração, a lista fictícia (A a P) continua, porque a base e o painel dependem dela.
  function campoOrientadorLivre() {
    if (!COLETA) return;
    const lista = $('orientador');
    const campo = document.createElement('input');
    campo.className = 'campo';
    campo.id = 'orientador';
    campo.name = 'orientador';
    campo.type = 'text';
    campo.autocomplete = 'off';
    campo.maxLength = 120;
    campo.placeholder = 'Nome e sobrenome do(a) professor(a)';
    campo.setAttribute('data-obrigatorio', '');
    campo.setAttribute('data-rotulo', 'Orientador(a)');
    campo.setAttribute('data-formacao', '');
    campo.setAttribute('aria-describedby', 'ajuda-orientador');
    lista.replaceWith(campo);
    const ajuda = document.createElement('div');
    ajuda.className = 'msg-ajuda';
    ajuda.id = 'ajuda-orientador';
    ajuda.textContent = 'Escreva o nome do(a) professor(a) que orientou seu trabalho de conclusão.';
    campo.insertAdjacentElement('afterend', ajuda);
  }
  function filtrarOrientadores() {
    if (COLETA) return;
    const linha = val('linha');
    const atual = val('orientador');
    const lista = R.orientadores.filter((o) => !linha || o.linha === linha);
    opcoes($('orientador'), lista.map((o) => ({ v: o.nome, t: linha ? o.nome : `${o.nome} · ${o.linha}` })), 'Selecione');
    if (lista.some((o) => o.nome === atual)) $('orientador').value = atual;
  }

  function determinarModo() {
    egresso = DB.egressoLogado();
    if (egresso && egresso.cadastro) modo = 'atualizar';
    else if (egresso) modo = 'primeiro';
    else modo = 'novo';
  }

  /* ---------------------- contexto e situação do egresso ---------------------- */
  function criterio(ok, titulo, texto, extra, estado) {
    const cls = ok ? 'ok' : estado || 'falta';
    const icone = ok ? 'check' : cls === 'pendente' ? 'relogio' : 'x';
    return `<div class="criterio ${cls}"><span class="criterio-marca">${ui.icone(icone)}</span>
      <div><strong>${titulo}</strong><span>${texto}</span>${extra ? `<div style="margin-top:8px">${extra}</div>` : ''}</div></div>`;
  }
  function textoQuestionario(e) {
    const hoje = U.hoje();
    const qs = e.questionarios || [];
    const feito = qs.filter((q) => q.completo && q.respondidoEm && I.dentroDe12Meses(q.respondidoEm, hoje)).pop();
    if (feito) return `Questionário de ${I.rotuloCiclo(feito.ciclo)} respondido em ${U.fmtData(feito.respondidoEm)}.`;
    const aberto = qs.filter((q) => !q.completo && q.enviadoEm && I.dentroDe12Meses(q.enviadoEm, hoje)).pop();
    if (aberto) return `Questionário de ${I.rotuloCiclo(aberto.ciclo)} disponível desde ${U.fmtData(aberto.enviadoEm)}. <a href="questionario.html">Responder agora</a>`;
    if (!e.cadastro.consentAcompanhamento) return 'Você não autorizou o acompanhamento por questionários.';
    return 'Você pode responder o questionário de acompanhamento quando quiser. <a href="questionario.html">Abrir questionário</a>';
  }
  function cartaoSituacao(e) {
    const hoje = U.hoje();
    const c = I.criterios(e, hoje);
    const lat = I.situacaoLattes(e, hoje);
    const n = [c.email, c.vinculo, c.lattes].filter(Boolean).length;
    const vale = U.addDias(U.parse(e.cadastro.vinculoInformadoEm), 365);
    return `
      <section class="cartao" aria-labelledby="titulo-situacao">
        <div class="cartao-cab">
          <h2 id="titulo-situacao">Seus dados mínimos atualizados</h2>
          ${c.todos ? `<span class="chip chip-verde">${ui.icone('check')} Completos: você conta no indicador do PPGTIC</span>`
            : `<span class="chip chip-amarelo-claro">${n} de 3 critérios atendidos</span>`}
        </div>
        <div class="criterios">
          ${criterio(c.email, 'E-mail confirmado',
            c.email ? `Confirmado em ${U.fmtData(e.cadastro.emailConfirmadoEm)}` : `Link de confirmação enviado para ${U.esc(e.cadastro.email)}`,
            c.email ? '' : '<button type="button" class="btn btn-mini" data-confirmar-email>Simular clique no link</button>', 'pendente')}
          ${criterio(c.vinculo, 'Vínculo informado nos últimos 12 meses',
            c.vinculo ? `Informado em ${U.fmtData(e.cadastro.vinculoInformadoEm)}; vale até ${U.fmtData(U.iso(vale))}`
              : `Último registro em ${U.fmtData(e.cadastro.vinculoInformadoEm)}. Salve o cadastro ou responda o questionário.`)}
          ${criterio(c.lattes, 'Lattes atualizado e conferido', U.esc(lat.texto), '', lat.codigo === 'nao-conferido' ? 'pendente' : 'falta')}
        </div>
        <div class="caixa-info">${ui.icone('envelope')}<span>${textoQuestionario(e)}</span></div>
      </section>`;
  }
  function cartaoColeta(e) {
    return `
      <section class="cartao" aria-labelledby="titulo-situacao">
        <h2 id="titulo-situacao">Seu cadastro</h2>
        <p class="texto-apoio">Salvo em ${U.fmtData(e.cadastro.atualizadoEm)}. Se algo mudou, corrija abaixo e salve de novo.</p>
        <div class="caixa-info">${ui.icone('envelope')}<span>${textoQuestionario(e)}</span></div>
        <div data-status-envio style="margin-top:10px">${coleta.htmlStatus()}</div>
      </section>`;
  }
  function renderContexto() {
    const p = DB.perfil();
    let html = '';
    if (COLETA) {
      html = modo === 'atualizar' ? cartaoColeta(egresso)
        : `<div class="caixa-info mb" style="margin-top:0">${ui.icone('info')}<span>A pesquisa tem duas partes: este <strong>cadastro</strong> (cerca de 4 minutos) e o <strong>questionário</strong> (cerca de 8 minutos). As respostas vão para a equipe do Observatório de Egressos do PPGTIC.</span></div>`;
      $('contexto').innerHTML = html;
      return;
    }
    if (modo === 'atualizar') {
      html = cartaoSituacao(egresso);
    } else if (modo === 'primeiro') {
      html = `<div class="caixa-info verde mb" style="margin-top:0">${ui.icone('check')}<span>Você entrou como <strong>${U.esc(egresso.nome)}</strong> (idUFSC simulado). Os dados de formação vieram dos registros da Secretaria e não precisam ser digitados.</span></div>`;
    } else {
      const equipe = R.perfisPainel.includes(p.tipo);
      html = `<div class="caixa-info amarela mb" style="margin-top:0">${ui.icone('info')}<span>${equipe
        ? `Você está como <strong>${R.perfis[p.tipo]}</strong>. O cadastro é preenchido pelo próprio egresso; o que for salvo aqui vira um <strong>registro de teste</strong>.`
        : 'Novo egresso: o que você salvar aqui vira um <strong>registro de teste</strong>, separado dos 212 egressos fictícios da base.'}
        Já é titulado(a)? <button type="button" class="btn btn-texto" data-login>Entrar com idUFSC (simulado)</button></span></div>`;
    }
    $('contexto').innerHTML = html;
  }

  /* ---------------------------- formulário ---------------------------- */
  function carregarFormulario() {
    form.reset();
    limparErros();
    filtrarOrientadores();
    const travar = modo !== 'novo' && egresso && egresso.origem === 'base';
    if (egresso) {
      set('nome', egresso.nome);
      set('nivel', egresso.nivel);
      set('anoDefesa', String(egresso.anoDefesa));
      set('linha', egresso.linha);
      filtrarOrientadores();
      set('orientador', egresso.orientador);
      set('titulo', egresso.titulo);
    }
    form.querySelectorAll('[data-formacao]').forEach((el) => { el.disabled = !!travar; });
    $('aviso-secretaria').innerHTML = travar
      ? `<div class="caixa-info mb" style="margin-top:0">${ui.icone('cadeado')}<span>Dados dos registros acadêmicos da Secretaria. Algo errado? <button type="button" class="btn btn-texto" data-correcao>Solicitar correção</button></span></div>`
      : '';
    const c = egresso && egresso.cadastro;
    if (c) {
      set('email', c.email);
      set('semVinculo', c.semVinculo);
      set('instituicao', c.instituicao);
      set('cargo', c.cargo);
      set('setor', c.setor);
      set('natureza', c.natureza);
      set('inicioVinculo', mesParaTexto(c.inicioVinculo));
      set('cidade', c.cidade);
      set('uf', c.uf);
      set('pais', c.pais || 'Brasil');
      set('vinculoIngresso', c.vinculoIngresso);
      set('posGrad', c.posGrad || 'Não');
      set('atuaPPG', c.atuaPPG ? 'sim' : 'nao');
      set('orcid', c.orcid);
      orcidVerificado = !!(c.orcid && c.orcidVerificado);
      set('lattesId', c.lattesId);
      set('lattesAtualizadoEm', egresso.lattes && egresso.lattes.atualizadoEm ? mesParaTexto(egresso.lattes.atualizadoEm.slice(0, 7)) : '');
      set('linkedin', c.linkedin);
      set('consentAcompanhamento', c.consentAcompanhamento);
      set('consentDivulgacao', c.consentDivulgacao);
    } else {
      orcidVerificado = false;
      const t = egresso && egresso.termoMatricula;
      set('consentAcompanhamento', t && t.acompanhamento);
      set('consentDivulgacao', t && t.divulgacao);
    }
    const t = egresso && egresso.termoMatricula;
    $('texto-termo').textContent = COLETA
      ? 'As duas autorizações são independentes. Para revisá-las ou revogá-las depois, fale com o responsável pelos dados.'
      : t ? `Termo assinado na matrícula em ${U.fmtMes(t.assinadoEm)}. Você pode revisar ou revogar estas autorizações a qualquer momento nesta página.`
        : c ? `Autorizações revisadas em ${U.fmtData(c.consentRevisadoEm)}. Você pode alterá-las ou revogá-las a qualquer momento.`
          : 'As duas autorizações são independentes e podem ser revisadas ou revogadas a qualquer momento nesta página.';
    $('titulo-cadastro').textContent = modo === 'atualizar' ? 'Atualize seus dados' : 'Cadastro do egresso';
    $('btn-salvar').textContent = modo === 'atualizar' ? 'Salvar alterações' : 'Salvar cadastro';
    $('btn-exclusao').hidden = modo !== 'atualizar' && !COLETA;
    aplicarSemVinculo();
    aplicarOrcid();
    atualizarFaixa();
    atualizarProgresso();
  }

  function atualizarFaixa() {
    const ano = +val('anoDefesa');
    const f = I.faixaDe(ano);
    $('texto-faixa').innerHTML = !ano ? 'Informe o ano da defesa para calcular a faixa de titulação.'
      : f ? `Faixa de titulação calculada automaticamente: <strong>${f}</strong> (Ficha de Avaliação CAPES, subitem 2.2.2).`
        : `Defesas anteriores a ${R.inicioPrograma} ficam fora das faixas da quadrienal 2025–2028.`;
  }
  function aplicarSemVinculo() {
    const sem = $('semVinculo').checked;
    form.querySelectorAll('[data-vinculo]').forEach((el) => {
      el.disabled = sem;
      if (sem) limparErro(el);
    });
  }
  function aplicarOrcid() {
    const v = val('orcid');
    const ajuda = $('ajuda-orcid');
    if (COLETA) {
      // sem a conexão simulada: o egresso digita o identificador, conferido pelo dígito verificador
      $('btn-orcid').hidden = true;
      $('orcid').readOnly = false;
      if (v && U.orcidValido(v)) ajuda.textContent = 'Número válido.';
      else ajuda.innerHTML = '<strong>Cole somente os números, não o link.</strong> Exemplo: no link https://orcid.org/<strong>0000-0002-1825-0097</strong>, cole só <strong>0000-0002-1825-0097</strong> (16 caracteres; o último pode ser X).';
      return;
    }
    if (orcidVerificado && v) {
      $('orcid').readOnly = true;
      $('btn-orcid').textContent = 'Desconectar';
      ajuda.innerHTML = `<span class="chip chip-verde">${ui.icone('check')} Conectado</span> verificado pelo login no ORCID (simulação)`;
    } else {
      $('orcid').readOnly = false;
      $('btn-orcid').textContent = 'Conectar ORCID';
      if (v && U.orcidValido(v)) ajuda.textContent = 'Número válido, mas não verificado. Use "Conectar ORCID" para confirmar que é seu.';
      else ajuda.innerHTML = '<strong>Cole somente os números, não o link.</strong> Exemplo: no link https://orcid.org/<strong>0000-0002-1825-0097</strong>, cole só <strong>0000-0002-1825-0097</strong> (16 caracteres; o último pode ser X). Ou use "Conectar ORCID", que confirma o número pelo login (simulação).';
    }
  }
  function camposObrigatorios() {
    return [...form.querySelectorAll('[data-obrigatorio]')].filter((el) => !(el.disabled && el.hasAttribute('data-vinculo')));
  }
  function atualizarProgresso() {
    const campos = camposObrigatorios();
    const ok = campos.filter((el) => String(el.value || '').trim() !== '').length;
    $('progresso-texto').textContent = `Campos obrigatórios preenchidos: ${ok} de ${campos.length}`;
    $('progresso-barra').style.width = `${campos.length ? Math.round((100 * ok) / campos.length) : 0}%`;
  }

  /* ----------------------------- validação ----------------------------- */
  function limparErro(el) {
    el.classList.remove('invalido');
    el.removeAttribute('aria-invalid');
    const msg = document.getElementById(`erro-${el.id}`);
    if (msg) msg.remove();
  }
  function limparErros() {
    form.querySelectorAll('.invalido').forEach(limparErro);
    $('resumo-erros').hidden = true;
  }
  function validar() {
    const problemas = [];
    const erro = (id, msg) => { if (!problemas.some((p) => p.el.id === id)) problemas.push({ el: $(id), msg }); };
    form.querySelectorAll('[data-obrigatorio]').forEach((el) => {
      if (el.disabled) return;
      if (!String(el.value || '').trim()) erro(el.id, 'Campo obrigatório.');
    });
    if (val('nome') && val('nome').split(/\s+/).length < 2) erro('nome', 'Informe nome e sobrenome.');
    if (val('email')) {
      if (!U.emailValido(val('email'))) erro('email', 'E-mail inválido.');
      else if (U.emailInstitucional(val('email'))) erro('email', 'Use um e-mail pessoal: o e-mail da UFSC é desativado após a titulação.');
    }
    if (val('titulo') && val('titulo').length < 10) erro('titulo', 'Informe o título completo do trabalho.');
    if (!$('inicioVinculo').disabled && val('inicioVinculo')) {
      const m = textoParaMes(val('inicioVinculo'));
      if (!m) erro('inicioVinculo', 'Use o formato MM/AAAA.');
      else if (U.parse(m) > U.hoje()) erro('inicioVinculo', 'A data não pode estar no futuro.');
    }
    if (val('uf') === 'Exterior' && /^brasil$/i.test(val('pais'))) erro('pais', 'Informe o país em que você está.');
    if (val('uf') && val('uf') !== 'Exterior' && val('pais') && !/^brasil$/i.test(val('pais'))) erro('uf', 'Para endereço fora do Brasil, selecione "Exterior".');
    if (COLETA && val('orientador') && (val('orientador').length < 5 || val('orientador').split(/\s+/).length < 2)) erro('orientador', 'Escreva o nome e o sobrenome do(a) orientador(a).');
    if (val('orcid') && !U.orcidValido(val('orcid'))) erro('orcid', 'Número do ORCID inválido: cole somente os 16 caracteres do número (o último pode ser X), sem o link.');
    if (val('lattesId') && !U.lattesValido(val('lattesId'))) erro('lattesId', 'Cole somente os 16 números do final do link do currículo (lattes.cnpq.br/…).');
    if (val('lattesAtualizadoEm')) {
      const m = textoParaMes(val('lattesAtualizadoEm'));
      if (!m) erro('lattesAtualizadoEm', 'Use o formato MM/AAAA.');
      else if (U.parse(m) > U.hoje()) erro('lattesAtualizadoEm', 'A data não pode estar no futuro.');
      else if (!val('lattesId')) erro('lattesId', 'Informe o número do currículo Lattes para que a Secretaria possa conferir a data.');
    }
    if (val('linkedin') && !/^https?:\/\/\S+\.\S+/.test(val('linkedin'))) erro('linkedin', 'Informe o endereço completo, começando com https://');
    // mesma ordem em que os campos aparecem na tela
    return problemas.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  }
  function mostrarErros(problemas) {
    problemas.forEach(({ el, msg }) => {
      el.classList.add('invalido');
      el.setAttribute('aria-invalid', 'true');
      const id = `erro-${el.id}`;
      const div = document.createElement('div');
      div.className = 'msg-erro';
      div.id = id;
      div.innerHTML = `${ui.icone('alerta')}<span>${msg}</span>`;
      const ancora = el.closest('.campo-com-botao') || el;
      ancora.insertAdjacentElement('afterend', div);
      el.setAttribute('aria-describedby', id);
      const rotulo = el.dataset.rotulo || el.id;
      sessao.erros[rotulo] = (sessao.erros[rotulo] || 0) + 1;
    });
    const box = $('resumo-erros');
    box.innerHTML = `${ui.icone('alerta')}<span>Corrija ${problemas.length === 1 ? 'o campo destacado' : `os ${problemas.length} campos destacados`}: ${problemas.map((p) => U.esc(p.el.dataset.rotulo || p.el.id)).join(', ')}.</span>`;
    box.hidden = false;
    problemas[0].el.focus();
    problemas[0].el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  /* ------------------------------- salvar ------------------------------- */
  function docenteEstimado(d, ant) {
    if (d.semVinculo) return 'Não';
    if (/professor|professora|docente/i.test(d.cargo)) {
      if (d.setor === 'Educação básica') return 'Educação básica';
      if (d.setor === 'Ensino superior') return 'Ensino superior';
    }
    return ant && ant.docente && ant.instituicao === d.instituicao ? ant.docente : 'Não';
  }
  function gerarConvite(e, hoje) {
    const ano = hoje.getFullYear();
    const recente = (e.questionarios || []).some((q) => q.enviadoEm && I.dentroDe12Meses(q.enviadoEm, hoje));
    if (recente || e.anoDefesa >= ano) return null; // o 1º questionário vai 1 ano após a defesa
    const q = {
      id: `q-${e.id}-${(e.questionarios || []).length + 1}`, ciclo: I.cicloDoQuestionario(e.anoDefesa, ano),
      enviadoEm: U.iso(hoje), iniciadoEm: null, respondidoEm: null, finalizadoEm: null, completo: false,
      etapa: 0, viaPrototipo: true, blocos: {},
    };
    e.questionarios.push(q);
    return q;
  }

  function salvar() {
    salvando = true;
    const hoje = U.hoje();
    const hojeIso = U.iso(hoje);
    const sem = $('semVinculo').checked;
    const dados = {
      email: val('email').toLowerCase(), semVinculo: sem,
      instituicao: sem ? '' : val('instituicao'), cargo: sem ? '' : val('cargo'), setor: sem ? '' : val('setor'),
      natureza: sem ? '' : val('natureza'), inicioVinculo: sem ? '' : textoParaMes(val('inicioVinculo')),
      cidade: val('cidade'), uf: val('uf'), pais: val('pais') || 'Brasil',
      vinculoIngresso: val('vinculoIngresso'), posGrad: val('posGrad') || 'Não', atuaPPG: val('atuaPPG') === 'sim',
      orcid: val('orcid'), orcidVerificado: !!(val('orcid') && orcidVerificado), lattesId: val('lattesId'), linkedin: val('linkedin'),
      consentAcompanhamento: $('consentAcompanhamento').checked, consentDivulgacao: $('consentDivulgacao').checked,
    };
    const formacao = { nome: val('nome'), nivel: val('nivel'), anoDefesa: +val('anoDefesa'), linha: val('linha'), titulo: val('titulo'), orientador: val('orientador') };
    const declarado = textoParaMes(val('lattesAtualizadoEm'));
    foiNovo = !egresso;
    const alvo = egresso || DB.criarEgresso(Object.assign({}, formacao, { dataDefesa: null, mesDefesa: null }));
    let convite = null;
    DB.alterar(alvo.id, (e) => {
      e.nome = formacao.nome;
      if (e.origem === 'teste' || e.origem === 'coleta') Object.assign(e, formacao);
      const ant = e.cadastro;
      if (ant && !ant.semVinculo && !sem && (ant.instituicao !== dados.instituicao || ant.cargo !== dados.cargo)) {
        e.vinculosAnteriores.push({ instituicao: ant.instituicao, cargo: ant.cargo, setor: ant.setor, natureza: ant.natureza,
          cidade: ant.cidade, uf: ant.uf, inicio: ant.inicioVinculo, fim: U.isoMes(hoje) });
      }
      e.cadastro = Object.assign({}, ant || {}, dados, {
        docente: docenteEstimado(dados, ant),
        criadoEm: ant ? ant.criadoEm : hojeIso,
        atualizadoEm: hojeIso,
        vinculoInformadoEm: hojeIso,
        consentRevisadoEm: hojeIso,
        emailConfirmadoEm: ant && ant.email === dados.email ? ant.emailConfirmadoEm : null,
        viaPrototipo: true,
      });
      if (!dados.lattesId) {
        e.lattes = null;
      } else {
        const mudouId = !ant || ant.lattesId !== dados.lattesId;
        const atual = e.lattes;
        const dataDecl = declarado ? `${declarado}-01` : null;
        if (mudouId || !atual) e.lattes = { atualizadoEm: dataDecl, conferidoEm: null, declarado: !!dataDecl };
        else if (dataDecl && (!atual.atualizadoEm || dataDecl > String(atual.atualizadoEm).slice(0, 10))) {
          e.lattes = { atualizadoEm: dataDecl, conferidoEm: null, declarado: true };
        }
      }
      if (dados.consentAcompanhamento) convite = gerarConvite(e, hoje);
    });
    const salvo = DB.obter(alvo.id);
    const duracao = sessao.inicioMs ? (Date.now() - sessao.inicioMs) / 1000 : 0;
    // evidências de tempo e erros são dos testes de usabilidade: na coleta real não são registradas
    ultimaEvidencia = COLETA ? null : DB.registrarEvidencia({
      egressoId: salvo.id, codigo: DB.codigoSessao(salvo), tela: 'cadastro',
      inicio: sessao.inicioIso || U.agora(), fim: U.agora(), duracaoSeg: duracao,
      erros: Object.assign({}, sessao.erros), totalErros: Object.values(sessao.erros).reduce((a, b) => a + b, 0),
      tentativas: sessao.tentativas, automatico: sessao.automatico, concluido: true, seq: null, comentario: '',
      modo: foiNovo ? 'novo registro' : modo === 'primeiro' ? 'primeiro cadastro' : 'atualização',
    });
    Object.assign(sessao, { inicioMs: null, inicioIso: null, erros: {}, tentativas: 0, automatico: false });
    idSucesso = salvo.id;
    mostrandoSucesso = true;
    if (foiNovo) DB.definirPerfil({ tipo: 'egresso', egressoId: salvo.id });
    salvando = false;
    egresso = salvo;
    renderSucesso(convite);
    if (COLETA) coleta.registrar(salvo.id, 'cadastro');
    ui.toast(COLETA ? 'Cadastro salvo.' : foiNovo ? `Cadastro salvo como registro de teste ${U.esc(salvo.codigoTeste)}.` : 'Cadastro salvo.', 'sucesso');
  }

  function renderSucesso() {
    const e = DB.obter(idSucesso);
    if (!e) return;
    const hoje = U.hoje();
    const c = I.criterios(e, hoje);
    const lat = I.situacaoLattes(e, hoje);
    const f = I.faixaDe(e.anoDefesa);
    const aberto = (e.questionarios || []).filter((q) => q.enviadoEm && I.dentroDe12Meses(q.enviadoEm, hoje)).pop();
    const respondido = aberto && aberto.completo;
    const ev = ultimaEvidencia;
    form.hidden = true;
    $('contexto').innerHTML = '';
    const box = $('sucesso');
    box.hidden = false;
    if (COLETA) {
      const autorizou = e.cadastro.consentAcompanhamento;
      box.innerHTML = `
      <section class="cartao painel-sucesso" aria-live="polite">
        <h2>${ui.icone('check')} ${foiNovo ? 'Cadastro salvo' : 'Dados atualizados'}</h2>
        <p>Obrigado, ${U.esc(U.primeiroNome(e.nome))}. Faixa de titulação: <strong>${f || 'fora das faixas da avaliação'}</strong>.</p>
        <div data-status-envio>${coleta.htmlStatus()}</div>
        <h3 class="subtitulo-modal">Próximo passo</h3>
        <ol class="passos">
          <li class="${respondido ? 'feito' : ''}">
            <span class="num">${respondido ? ui.icone('check') : '1'}</span>
            <span><strong>Responda o questionário${aberto ? ` de ${I.rotuloCiclo(aberto.ciclo)}` : ''}.</strong>
              ${respondido ? 'Respondido.' : autorizou ? 'Leva cerca de 8 minutos.' : 'Para responder, marque no cadastro a autorização de acompanhamento.'}</span>
            ${respondido || !autorizou ? '<span></span>' : '<a class="btn btn-primario" href="questionario.html">Responder agora</a>'}
          </li>
        </ol>
        <div class="acoes" style="margin-top:16px">
          <button type="button" class="btn btn-secundario" data-voltar-form>${ui.icone('voltar')} Voltar ao cadastro</button>
        </div>
      </section>`;
      root.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    box.innerHTML = `
      <section class="cartao painel-sucesso" aria-live="polite">
        <h2>${ui.icone('check')} ${foiNovo || modo === 'primeiro' ? 'Cadastro salvo' : 'Dados atualizados'}</h2>
        <p>Faixa de titulação: <strong>${f || 'fora das faixas da quadrienal'}</strong>
          ${e.codigoTeste ? ` · Registro de teste <strong>${U.esc(e.codigoTeste)}</strong>` : ''}
          ${ev ? ` · Tempo de preenchimento: <strong>${U.fmtDuracao(ev.duracaoSeg)}</strong>${ev.automatico ? ' (preenchimento automático)' : ''}` : ''}</p>
        <h3 class="subtitulo-modal">Próximos passos</h3>
        <ol class="passos">
          <li class="${c.email ? 'feito' : ''}">
            <span class="num">${c.email ? ui.icone('check') : '1'}</span>
            <span><strong>Confirme seu e-mail.</strong> ${c.email ? `Confirmado em ${U.fmtData(e.cadastro.emailConfirmadoEm)}.` : `Enviamos um link para ${U.esc(e.cadastro.email)} (simulação).`}</span>
            ${c.email ? '<span></span>' : '<button type="button" class="btn btn-secundario" data-confirmar-email>Simular clique no link</button>'}
          </li>
          <li class="${respondido ? 'feito' : ''}">
            <span class="num">${respondido ? ui.icone('check') : '2'}</span>
            <span><strong>${aberto ? `Responda o questionário de ${I.rotuloCiclo(aberto.ciclo)}.` : 'Questionário de acompanhamento.'}</strong>
              ${respondido ? 'Respondido.' : aberto ? 'Leva cerca de 8 minutos e atualiza seu cadastro.'
                : e.cadastro.consentAcompanhamento ? 'O primeiro convite chega 1 ano após a defesa, mas você pode responder quando quiser.' : 'Você não autorizou o acompanhamento por questionários.'}</span>
            ${respondido || !e.cadastro.consentAcompanhamento ? '<span></span>' : `<a class="btn btn-primario" href="questionario.html">${aberto ? 'Responder agora' : 'Abrir questionário'}</a>`}
          </li>
          <li class="${c.lattes ? 'feito' : ''}">
            <span class="num">${c.lattes ? ui.icone('check') : '3'}</span>
            <span><strong>A Secretaria confere seu Lattes.</strong> ${U.esc(lat.texto)}.</span><span></span>
          </li>
        </ol>
        <div class="acoes" style="margin-top:16px">
          <button type="button" class="btn btn-secundario" data-voltar-form>${ui.icone('voltar')} Voltar ao cadastro</button>
        </div>
      </section>`;
    root.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function voltarAoFormulario() {
    mostrandoSucesso = false;
    $('sucesso').hidden = true;
    form.hidden = false;
    determinarModo();
    renderContexto();
    carregarFormulario();
    root.scrollTo({ top: 0 });
  }

  /* --------------------------- preencher exemplo --------------------------- */
  Obs.tela.preencherExemplo = function () {
    if (mostrandoSucesso) voltarAoFormulario();
    sessao.automatico = true;
    marcarInicio();
    const rafael = egresso && egresso.papel === 'rafael';
    const ex = rafael ? EXEMPLO_RAFAEL : PERSONAS[iPersona++ % PERSONAS.length];
    if (!egresso || egresso.origem === 'teste') {
      set('nome', ex.nome);
      set('nivel', ex.nivel);
      set('anoDefesa', ex.ano);
      set('linha', ex.linha);
      filtrarOrientadores();
      set('orientador', ex.orientador);
      set('titulo', ex.titulo);
    }
    set('email', ex.email);
    set('semVinculo', false);
    aplicarSemVinculo();
    set('instituicao', ex.instituicao);
    set('cargo', ex.cargo);
    set('setor', ex.setor);
    set('natureza', ex.natureza);
    set('inicioVinculo', ex.inicio);
    set('cidade', ex.cidade);
    set('uf', ex.uf);
    set('pais', 'Brasil');
    set('vinculoIngresso', ex.vinculoIngresso || '');
    if (ex.orcid) { set('orcid', ex.orcid); orcidVerificado = !!ex.orcidConectado; }
    set('lattesId', ex.lattesId);
    set('lattesAtualizadoEm', mesParaTexto(U.isoMes(U.addMeses(U.hoje(), -(ex.lattesMesesAtras || 2)))));
    set('consentAcompanhamento', true);
    set('consentDivulgacao', true);
    limparErros();
    aplicarOrcid();
    atualizarFaixa();
    atualizarProgresso();
    ui.toast('Formulário preenchido com dados de exemplo. Revise e clique em "Salvar".', 'info');
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
      if (el.id === 'orcid') {
        // se colarem o link inteiro (https://orcid.org/...), fica só o número
        const bruto = el.value.toUpperCase();
        const m = /(\d{4})-?(\d{4})-?(\d{4})-?(\d{3}[\dX])/.exec(bruto);
        const d = m ? m.slice(1).join('') : bruto.replace(/[^0-9X]/g, '').slice(0, 16);
        el.value = d.replace(/(.{4})(?=.)/g, '$1-');
        orcidVerificado = false;
        aplicarOrcid();
      }
      if (el.id === 'lattesId') {
        // se colarem o link inteiro (http://lattes.cnpq.br/...), ficam só os 16 números
        const m = /\d{16}/.exec(el.value.replace(/\s/g, ''));
        el.value = m ? m[0] : el.value.replace(/\D/g, '').slice(0, 16);
      }
      if (el.classList.contains('invalido')) limparErro(el);
      atualizarProgresso();
    });
    form.addEventListener('change', (ev) => {
      marcarInicio();
      const el = ev.target;
      if (el.classList.contains('invalido')) limparErro(el);
      if (el.id === 'anoDefesa') atualizarFaixa();
      if (el.id === 'linha') filtrarOrientadores();
      if (el.id === 'semVinculo') aplicarSemVinculo();
      if (el.id === 'setor') {
        const n = R.naturezaPorSetor[el.value];
        if (n) { $('natureza').value = n; limparErro($('natureza')); }
      }
      if (el.id === 'uf') {
        if (el.value === 'Exterior' && /^brasil$/i.test(val('pais'))) set('pais', '');
        if (el.value && el.value !== 'Exterior' && !val('pais')) set('pais', 'Brasil');
      }
      atualizarProgresso();
    });
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      marcarInicio();
      sessao.tentativas++;
      limparErros();
      const problemas = validar();
      if (problemas.length) { mostrarErros(problemas); return; }
      salvar();
    });
    $('btn-orcid').addEventListener('click', () => {
      if (orcidVerificado) {
        orcidVerificado = false;
        set('orcid', '');
        aplicarOrcid();
        marcarInicio();
        return;
      }
      ui.modal({
        titulo: 'Conectar ORCID (simulação)',
        largura: 520,
        corpo: `<p>Na versão final, este botão abre o login do ORCID pela API pública (OAuth). Você entra na sua própria conta e autoriza a conexão; o portal recebe o identificador verificado e passa a consultar o registro público para atualizar vínculos e produções.</p>
          <div class="caixa-info amarela">${ui.icone('info')}<span>Neste protótipo, a autorização é simulada e o identificador é fictício.</span></div>`,
        acoes: [
          { rotulo: 'Cancelar' },
          { rotulo: 'Simular login e autorizar', classe: 'btn-primario', aoClicar: () => {
            set('orcid', egresso && egresso.papel === 'rafael' ? '0000-0002-1825-0097' : orcidFicticio());
            orcidVerificado = true;
            limparErro($('orcid'));
            aplicarOrcid();
            marcarInicio();
            ui.toast('ORCID conectado (simulação).', 'sucesso');
          } },
        ],
      });
    });
    $('btn-exclusao').addEventListener('click', async () => {
      if (COLETA) {
        const cfg = Obs.config;
        ui.modal({
          titulo: 'Correção ou exclusão dos seus dados',
          largura: 520,
          corpo: `<p>Os pedidos de correção, exclusão ou revogação das autorizações são atendidos por <strong>${U.esc(cfg.responsavel)}</strong>${cfg.contato ? `, pelo e-mail <a href="mailto:${U.esc(cfg.contato)}">${U.esc(cfg.contato)}</a>` : ''}.</p>`,
          acoes: [{ rotulo: 'Fechar', classe: 'btn-primario' }],
        });
        return;
      }
      const ok = await ui.confirmar('Pedido de exclusão: seus dados pessoais seriam removidos do Observatório, exceto os exigidos pela CAPES no Anexo 2 (obrigação legal). Na versão final, o pedido vai ao encarregado de dados da UFSC. Registrar o pedido?', 'Registrar pedido');
      if (ok) ui.toast('Pedido de exclusão registrado e encaminhado ao encarregado de dados da UFSC (simulação).', 'info');
    });
    document.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-confirmar-email]')) {
        const e = DB.egressoLogado();
        if (e && e.cadastro) {
          DB.alterar(e.id, (x) => { x.cadastro.emailConfirmadoEm = U.iso(U.hoje()); });
          ui.toast('E-mail confirmado (simulação do clique no link).', 'sucesso');
        }
      }
      if (ev.target.closest('[data-login]')) ui.abrirLogin();
      if (ev.target.closest('[data-voltar-form]')) voltarAoFormulario();
      if (ev.target.closest('[data-correcao]')) ui.toast('Pedido de correção enviado à Secretaria (simulação). A Secretaria confere os dados no Sucupira.', 'info');
    });
  }

  function render() {
    determinarModo();
    if (mostrandoSucesso) { renderSucesso(); return; }
    renderContexto();
    carregarFormulario();
  }
  function aoMudar(tipo) {
    if (salvando) return;
    if (tipo === 'perfil') {
      mostrandoSucesso = false;
      $('sucesso').hidden = true;
      form.hidden = false;
      render();
      return;
    }
    // dados alterados (nesta ou em outra aba): atualiza só a situação, sem apagar o que está sendo digitado
    determinarModo();
    if (mostrandoSucesso) renderSucesso();
    else if (modo === 'atualizar') renderContexto();
  }

  function ajustarTextosColeta() {
    if (!COLETA) return;
    const cfg = Obs.config;
    $('btn-orcid').hidden = true;
    const aviso = document.createElement('p');
    aviso.className = 'texto-apoio pequeno';
    aviso.innerHTML = `Responsável pelos dados: <strong>${U.esc(cfg.responsavel)}</strong>${cfg.contato ? ` (<a href="mailto:${U.esc(cfg.contato)}">${U.esc(cfg.contato)}</a>)` : ''}. As respostas vão para uma planilha de acesso restrito à equipe do Observatório.`;
    $('info-termo').insertAdjacentElement('afterend', aviso);
    $('btn-exclusao').textContent = 'Corrigir ou excluir meus dados';
  }

  campoOrientadorLivre();
  montarSelects();
  ajustarTextosColeta();
  ligarEventos();
  ui.iniciar({ tela: 'cadastro', render, aoMudar });
})(window);

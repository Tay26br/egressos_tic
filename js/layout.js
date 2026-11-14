/* =====================================================================
   layout.js — estrutura comum das quatro telas: barra do protótipo,
   cabeçalho, menu, perfil simulado (login idUFSC), modais, avisos e o
   painel de demonstração (roteiro do EX08 e evidências dos testes).
   ===================================================================== */
(function (root) {
  'use strict';
  const Obs = root.Obs;
  const U = Obs.U;
  const R = Obs.REF;
  const DB = Obs.DB;
  const ui = {};
  Obs.tela = Obs.tela || {};
  const COLETA = !!(Obs.config && Obs.config.coleta);

  const TELAS = [
    { id: 'cadastro', num: 1, rotulo: 'Cadastro', href: 'cadastro.html', descricao: 'Formulário de cadastro' },
    { id: 'questionario', num: 2, rotulo: 'Questionário', href: 'questionario.html', descricao: 'Questionário de acompanhamento' },
    { id: 'indicadores', num: 3, rotulo: 'Indicadores', href: 'indicadores.html', descricao: 'Painel de indicadores' },
    { id: 'ficha', num: 4, rotulo: 'Ficha de destaque', href: 'ficha.html', descricao: 'Ficha de egresso de destaque' },
  ];

  /* ------------------------------ ícones ------------------------------ */
  const ICONES = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alerta: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
    cadeado: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    imprimir: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    usuario: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    seta: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    voltar: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    envelope: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
    ajustes: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    pasta: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    olho: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    restaurar: '<path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    estrela: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    lapis: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    seta_baixo: '<path d="m6 9 6 6 6-6"/>',
  };
  ui.icone = function (nome, classe) {
    return `<svg class="icone ${classe || ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONES[nome] || ''}</svg>`;
  };

  /* ------------------------------ avisos ------------------------------ */
  ui.toast = function (mensagem, tipo) {
    let box = document.getElementById('avisos');
    if (!box) {
      box = document.createElement('div');
      box.id = 'avisos';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    const t = document.createElement('div');
    t.className = `aviso aviso-${tipo || 'info'}`;
    t.innerHTML = `${ui.icone(tipo === 'erro' ? 'alerta' : tipo === 'sucesso' ? 'check' : 'info')}<span>${mensagem}</span>`;
    box.appendChild(t);
    setTimeout(() => { t.classList.add('saindo'); setTimeout(() => t.remove(), 300); }, tipo === 'erro' ? 6000 : 4200);
  };

  /* ------------------------------ modais ------------------------------ */
  ui.modal = function (cfg) {
    const acoes = cfg.acoes || [];
    const fundo = document.createElement('div');
    fundo.className = 'modal-fundo';
    fundo.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" style="max-width:${cfg.largura || 600}px">
        <div class="modal-cab">
          <h2 id="modal-titulo">${cfg.titulo}</h2>
          <button type="button" class="btn-icone" data-fechar aria-label="Fechar">${ui.icone('x')}</button>
        </div>
        <div class="modal-corpo">${cfg.corpo || ''}</div>
        ${acoes.length ? `<div class="modal-rodape">${acoes.map((a, i) => `<button type="button" class="btn ${a.classe || 'btn-secundario'}" data-acao="${i}">${a.rotulo}</button>`).join('')}</div>` : ''}
      </div>`;
    document.body.appendChild(fundo);
    document.body.classList.add('com-modal');
    const anterior = document.activeElement;
    let aberto = true;
    function fechar() {
      if (!aberto) return;
      aberto = false;
      fundo.remove();
      if (!document.querySelector('.modal-fundo')) document.body.classList.remove('com-modal');
      document.removeEventListener('keydown', tecla);
      if (anterior && anterior.focus) anterior.focus();
      if (cfg.aoFechar) cfg.aoFechar();
    }
    function tecla(ev) {
      if (ev.key === 'Escape') fechar();
      if (ev.key === 'Tab') {
        const foco = fundo.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!foco.length) return;
        const primeiro = foco[0];
        const ultimo = foco[foco.length - 1];
        if (ev.shiftKey && document.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
        else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
      }
    }
    document.addEventListener('keydown', tecla);
    fundo.addEventListener('mousedown', (ev) => { if (ev.target === fundo) fechar(); });
    fundo.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-fechar]')) { fechar(); return; }
      const b = ev.target.closest('[data-acao]');
      if (b) {
        const a = acoes[+b.dataset.acao];
        const r = a.aoClicar ? a.aoClicar(fundo) : undefined;
        if (r !== false) fechar();
      }
    });
    setTimeout(() => {
      const alvo = fundo.querySelector('[autofocus]') || fundo.querySelector('.modal-corpo input, .modal-corpo select, .modal-corpo textarea') || fundo.querySelector('[data-acao]');
      if (alvo) alvo.focus();
    }, 0);
    if (cfg.aoAbrir) cfg.aoAbrir(fundo, fechar);
    return { el: fundo, fechar };
  };

  ui.confirmar = function (mensagem, rotuloOk, classeOk) {
    return new Promise((resolve) => {
      let resposta = false;
      ui.modal({
        titulo: 'Confirmar',
        largura: 480,
        corpo: `<p>${mensagem}</p>`,
        acoes: [
          { rotulo: 'Cancelar', classe: 'btn-secundario' },
          { rotulo: rotuloOk || 'Confirmar', classe: classeOk || 'btn-primario', aoClicar: () => { resposta = true; } },
        ],
        aoFechar: () => resolve(resposta),
      });
    });
  };

  /* ------------------------- perfil e login ------------------------- */
  function rotuloPerfil(p) {
    if (p.tipo === 'egresso') {
      const e = p.egressoId ? DB.obter(p.egressoId) : null;
      return e ? `${U.esc(U.primeiroNome(e.nome))} · Egresso` : 'Novo egresso (teste)';
    }
    if (p.tipo === 'publico') return 'Entrar com idUFSC';
    return R.perfis[p.tipo] || 'Perfil';
  }

  ui.entrarComo = function (perfil, destino) {
    DB.definirPerfil(perfil);
    if (destino) root.location.href = destino;
  };

  ui.abrirLogin = function () {
    const lista = DB.egressos();
    const raf = DB.rafael();
    const hoje = U.hoje();
    const exemplos = [];
    if (raf) exemplos.push({ e: raf, nota: raf.cadastro ? 'roteiro do EX08' : 'sem cadastro · roteiro do EX08' });
    const desatualizado = lista.find((e) => e.origem === 'base' && e.cadastro && !e.papel && e.anoDefesa >= 2019 && e.anoDefesa <= 2021 && !Obs.Ind.criterios(e, hoje).vinculo);
    if (desatualizado) exemplos.push({ e: desatualizado, nota: `cadastro desatualizado (${U.tempoRelativo(desatualizado.cadastro.vinculoInformadoEm, hoje)})` });
    const emDia = lista.find((e) => e.origem === 'base' && !e.papel && e.anoDefesa === 2023 && Obs.Ind.criterios(e, hoje).todos);
    if (emDia) exemplos.push({ e: emDia, nota: 'dados mínimos em dia' });
    lista.filter((e) => e.origem === 'teste').slice(-4).forEach((e) => exemplos.push({ e, nota: `registro de teste ${e.codigoTeste}` }));
    const item = (x) => `
      <button type="button" class="item-login" data-egresso="${x.e.id}">
        <span class="avatar">${U.esc(U.iniciais(x.e.nome))}</span>
        <span><strong>${U.esc(x.e.nome)}</strong><small>${x.e.nivel === 'DO' ? 'Doutorado' : 'Mestrado'}, defesa em ${x.e.anoDefesa} · ${U.esc(x.nota)}</small></span>
      </button>`;
    const m = ui.modal({
      titulo: 'Entrar com idUFSC (simulação)',
      largura: 640,
      corpo: `
        <p class="texto-apoio">Nesta versão o login é simulado com egressos fictícios. Na implantação, a autenticação usará o idUFSC e a formação virá dos registros da Secretaria.</p>
        <h3 class="subtitulo-modal">Egresso</h3>
        <div class="lista-login">${exemplos.map(item).join('')}</div>
        <label class="rotulo" for="busca-egresso">Buscar outro egresso fictício</label>
        <input id="busca-egresso" class="campo" type="search" placeholder="Digite parte do nome" autocomplete="off">
        <div id="resultado-busca" class="lista-login"></div>
        <button type="button" class="btn btn-secundario btn-bloco" data-novo>${ui.icone('mais')} Sou um novo egresso (registro de teste)</button>
        <h3 class="subtitulo-modal">Equipe do PPGTIC (login institucional)</h3>
        <div class="grade-perfis">
          ${['secretaria', 'coordenacao', 'comissao', 'rt'].map((t) => `<button type="button" class="btn btn-secundario" data-perfil="${t}">${R.perfis[t]}</button>`).join('')}
        </div>
        <button type="button" class="btn btn-texto" data-perfil="publico">${ui.icone('sair')} Sair (visitante)</button>`,
      aoAbrir(el, fechar) {
        const busca = el.querySelector('#busca-egresso');
        const res = el.querySelector('#resultado-busca');
        busca.addEventListener('input', () => {
          const q = U.semAcento(busca.value).toLowerCase().trim();
          if (q.length < 2) { res.innerHTML = ''; return; }
          const achados = lista.filter((e) => U.semAcento(e.nome).toLowerCase().includes(q)).slice(0, 6);
          res.innerHTML = achados.length
            ? achados.map((e) => item({ e, nota: e.cadastro ? `cadastro de ${U.fmtMes(e.cadastro.vinculoInformadoEm)}` : 'sem cadastro' })).join('')
            : '<p class="texto-apoio">Nenhum egresso fictício com esse nome.</p>';
        });
        el.addEventListener('click', (ev) => {
          const b = ev.target.closest('[data-egresso]');
          if (b) {
            fechar();
            const e = DB.obter(b.dataset.egresso);
            ui.entrarComo({ tipo: 'egresso', egressoId: e.id });
            ui.toast(`Você entrou como ${U.esc(e.nome)} (simulação).`, 'sucesso');
            if (!/cadastro|questionario/.test(document.body.dataset.tela)) root.location.href = 'cadastro.html';
            return;
          }
          if (ev.target.closest('[data-novo]')) {
            fechar();
            ui.entrarComo({ tipo: 'egresso', egressoId: null, novo: true }, 'cadastro.html');
            return;
          }
          const p = ev.target.closest('[data-perfil]');
          if (p) {
            fechar();
            ui.entrarComo({ tipo: p.dataset.perfil });
            ui.toast(p.dataset.perfil === 'publico' ? 'Você saiu. Navegando como visitante.' : `Perfil simulado: ${R.perfis[p.dataset.perfil]}.`, 'info');
          }
        });
      },
    });
    return m;
  };

  /* ------------------------- estrutura da página ------------------------- */
  function htmlTopo(tela) {
    const t = TELAS.find((x) => x.id === tela);
    const p = DB.perfil();
    const restrito = (id) => (id === 'indicadores' && !DB.podeVerPainelCompleto()) || (id === 'ficha' && !DB.podeEditarFicha());
    // no modo coleta (site publicado), o egresso vê só o cadastro e o questionário
    const telas = COLETA ? TELAS.filter((x) => x.id === 'cadastro' || x.id === 'questionario') : TELAS;
    const barra = COLETA
      ? `<div class="barra-prototipo">
        <div class="container linha-barra">
          <span><strong>Pesquisa de acompanhamento de egressos</strong> · PPGTIC/UFSC</span>
          <span class="barra-direita"><span class="so-tela-larga">Cadastro e questionário</span></span>
        </div>
      </div>`
      : `<div class="barra-prototipo">
        <div class="container linha-barra">
          <span><strong>Protótipo V2 (funcional)</strong> · Observatório de Egressos PPGTIC/UFSC</span>
          <span class="barra-direita">
            <span class="so-tela-larga">${DB.dados().vazia ? 'Base esvaziada' : 'Dados fictícios'} · Tela ${t.num}: ${t.descricao}</span>
            <button type="button" class="btn-demo" id="abrir-demo" aria-controls="gaveta-demo" aria-expanded="false">${ui.icone('ajustes')} Demonstração</button>
          </span>
        </div>
      </div>`;
    return `
      <a class="pular" href="#conteudo">Pular para o conteúdo</a>
      ${barra}
      <header class="cabecalho">
        <div class="container linha-cabecalho">
          <a class="marca" href="cadastro.html">
            <span class="marca-simbolo" aria-hidden="true"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="20" cy="20" r="9" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="20" cy="20" r="3" fill="#FEE300"/></svg></span>
            <span><span class="marca-titulo">Observatório de Egressos PPGTIC</span>
            <span class="marca-sub">Programa de Pós-Graduação em Tecnologias da Informação e Comunicação · UFSC Araranguá</span></span>
          </a>
          ${COLETA ? '' : `<button type="button" class="btn-perfil" id="btn-perfil" aria-haspopup="dialog">
            ${ui.icone(p.tipo === 'publico' ? 'usuario' : p.tipo === 'egresso' ? 'usuario' : 'cadeado')}
            <span>${rotuloPerfil(p)}</span>
          </button>`}
        </div>
        <nav class="container menu" aria-label="${COLETA ? 'Etapas da pesquisa' : 'Telas do protótipo'}">
          ${telas.map((x) => `<a href="${x.href}" class="${x.id === tela ? 'ativo' : ''}" ${x.id === tela ? 'aria-current="page"' : ''}>
            <span class="menu-num">${x.num}</span>${x.rotulo}${!COLETA && restrito(x.id) ? ui.icone('cadeado', 'icone-menu') : ''}</a>`).join('')}
        </nav>
      </header>
      <div id="faixa-restrita"></div>`;
  }

  function htmlRodape() {
    const d = DB.dados();
    if (COLETA) {
      const cfg = Obs.config;
      return `
      <footer class="rodape">
        <div class="container">
          <p><strong>Observatório de Egressos do PPGTIC/UFSC</strong> · Campus Araranguá. Responsável pelos dados: ${U.esc(cfg.responsavel)}${cfg.contato ? ` (<a href="mailto:${U.esc(cfg.contato)}">${U.esc(cfg.contato)}</a>)` : ''}.</p>
          <p>LGPD: a pesquisa não coleta CPF, telefone, endereço residencial nem dados sensíveis. As respostas vão para uma planilha de acesso restrito à equipe do Observatório e são usadas no acompanhamento de egressos e na autoavaliação do programa. Para corrigir ou excluir seus dados, ou revogar a autorização, fale com o responsável.</p>
        </div>
      </footer>`;
    }
    const nColeta = d.egressos.filter((e) => e.origem === 'coleta').length;
    const sobreBase = d.vazia
      ? `Base esvaziada neste navegador${nColeta ? `: ${U.plural(nColeta, 'resposta importada', 'respostas importadas')} da planilha` : ''}.`
      : `Todos os nomes, trajetórias e números são <strong>fictícios</strong>. Base gerada em ${U.fmtData(d.geradaEm)} e guardada apenas neste navegador.`;
    return `
      <footer class="rodape">
        <div class="container">
          <p><strong>Protótipo acadêmico</strong> · Disciplina de Gestão de Projetos · UFSC, Campus Araranguá · Equipe 04 · 2026.
          ${sobreBase}</p>
          <p>LGPD: o portal não coleta CPF, endereço residencial nem dados sensíveis. Dados individuais ficam restritos à Coordenação, à Secretaria, à Comissão de Autoavaliação e ao Responsável Temático. Direitos do titular (consulta, correção, revogação e exclusão) pelo próprio portal, com o contato do encarregado de dados da UFSC.</p>
        </div>
      </footer>`;
  }

  ui.faixaRestrita = function (html, tipo) {
    const el = document.getElementById('faixa-restrita');
    if (!el) return;
    el.innerHTML = html ? `<div class="faixa-aviso faixa-${tipo || 'restrita'}"><div class="container">${html}</div></div>` : '';
  };

  /* ---------------------- painel de demonstração ---------------------- */
  function passosRoteiro() {
    const raf = DB.rafael();
    if (!raf) return [];
    const p = DB.perfil();
    const dest = raf.destaque;
    return [
      { rotulo: 'Entrar como Rafael Costa Lima (idUFSC simulado)', feito: (p.tipo === 'egresso' && p.egressoId === raf.id) || !!raf.cadastro,
        ir: () => ui.entrarComo({ tipo: 'egresso', egressoId: raf.id }, 'cadastro.html') },
      { rotulo: 'Tela 1 · salvar o cadastro', feito: !!raf.cadastro,
        ir: () => ui.entrarComo({ tipo: 'egresso', egressoId: raf.id }, 'cadastro.html') },
      { rotulo: 'Confirmar o e-mail pelo link (simulado)', feito: !!(raf.cadastro && raf.cadastro.emailConfirmadoEm),
        ir: () => ui.entrarComo({ tipo: 'egresso', egressoId: raf.id }, 'cadastro.html') },
      { rotulo: 'Tela 2 · responder o questionário de 1 ano', feito: raf.questionarios.some((q) => q.completo),
        ir: () => ui.entrarComo({ tipo: 'egresso', egressoId: raf.id }, 'questionario.html') },
      { rotulo: 'Tela 3 · Secretaria confere o Lattes', feito: !!(raf.lattes && raf.lattes.conferidoEm),
        ir: () => ui.entrarComo({ tipo: 'secretaria' }, 'indicadores.html#validacoes') },
      { rotulo: 'Tela 4 · Comissão aprova a ficha de destaque', feito: !!(dest && ['aprovada', 'publicada'].includes(dest.status)),
        ir: () => ui.entrarComo({ tipo: 'comissao' }, `ficha.html?id=${raf.id}`) },
      { rotulo: 'Publicar o card na vitrine (com autorização)', feito: !!(dest && dest.status === 'publicada'),
        ir: () => ui.entrarComo({ tipo: 'rt' }, `ficha.html?id=${raf.id}`) },
    ];
  }

  ui.resumoEvidencias = function () {
    const evs = DB.evidencias().filter((x) => !x.automatico);
    const cad = evs.filter((x) => x.tela === 'cadastro' && x.concluido);
    const qst = evs.filter((x) => x.tela === 'questionario' && x.concluido);
    const seqs = evs.map((x) => x.seq).filter((x) => x != null);
    const erros = {};
    evs.forEach((x) => Object.keys(x.erros || {}).forEach((k) => { erros[k] = (erros[k] || 0) + x.erros[k]; }));
    const topErros = Object.keys(erros).map((k) => ({ campo: k, n: erros[k] })).sort((a, b) => b.n - a.n).slice(0, 3);
    return {
      sessoes: new Set(evs.map((x) => x.egressoId)).size,
      cadastros: cad.length,
      questionarios: qst.length,
      mediaCadastro: U.media(cad.map((x) => x.duracaoSeg)),
      mediaQuestionario: U.media(qst.map((x) => x.duracaoSeg)),
      ate8min: qst.filter((x) => x.duracaoSeg <= R.tempoEstimadoQuestionarioMin * 60).length,
      seqMedio: U.media(seqs),
      nSeq: seqs.length,
      topErros,
      totalErros: evs.reduce((s, x) => s + (x.totalErros || 0), 0),
    };
  };

  function htmlGaveta() {
    const passos = passosRoteiro();
    const feitos = passos.filter((x) => x.feito).length;
    const r = Obs.Ind.calcular(DB.egressos(), { hoje: U.hoje() });
    const ev = ui.resumoEvidencias();
    const d = DB.dados();
    const nTeste = DB.egressos().filter((e) => e.origem === 'teste').length;
    const nColeta = DB.egressos().filter((e) => e.origem === 'coleta').length;
    const nBase = DB.egressos().filter((e) => e.origem === 'base').length;
    return `
      <div class="gaveta-cab">
        <h2>Painel de demonstração</h2>
        <button type="button" class="btn-icone" data-fechar-gaveta aria-label="Fechar painel">${ui.icone('x')}</button>
      </div>
      <div class="gaveta-corpo">
        <section class="gaveta-sec">
          <h3>Roteiro do egresso fictício (EX08 → V2)</h3>
          <p class="texto-apoio">Refaz a simulação da seção 5 do EX08 nas quatro telas. ${feitos} de ${passos.length} etapas concluídas.</p>
          <ol class="roteiro">
            ${passos.map((x, i) => `<li class="${x.feito ? 'feito' : ''}">
              <span class="roteiro-marca">${x.feito ? ui.icone('check') : i + 1}</span>
              <span class="roteiro-texto">${x.rotulo}</span>
              <button type="button" class="btn btn-mini" data-passo="${i}">Ir</button></li>`).join('')}
          </ol>
          <div class="mini-kpi">
            <span>Dados mínimos agora</span>
            <strong>${r.dadosMinimos.n} de ${r.dadosMinimos.titulados} (${U.fmtPct(r.dadosMinimos.pct, 1)})</strong>
            <small>Meta ${r.dadosMinimos.anoMeta}: ${r.dadosMinimos.meta}% · ${r.dadosMinimos.faltam ? `faltam ${r.dadosMinimos.faltam}` : 'meta atingida'}</small>
          </div>
          ${Obs.tela.preencherExemplo ? `<button type="button" class="btn btn-secundario btn-bloco" data-exemplo>${ui.icone('lapis')} Preencher com o exemplo do EX08</button>
          <p class="texto-apoio pequeno">O preenchimento automático não entra nas evidências de tempo dos testes.</p>` : ''}
        </section>
        <section class="gaveta-sec">
          <h3>Testes com usuários (EX09)</h3>
          <p class="texto-apoio">Cada cadastro ou questionário enviado registra o tempo de preenchimento, os erros de validação e a facilidade percebida, sem guardar nomes.</p>
          <dl class="lista-dados">
            <div><dt>Sessões registradas</dt><dd>${ev.sessoes}</dd></div>
            <div><dt>Tempo médio do cadastro</dt><dd>${U.fmtDuracao(ev.mediaCadastro)} <small>(${ev.cadastros})</small></dd></div>
            <div><dt>Tempo médio do questionário</dt><dd>${U.fmtDuracao(ev.mediaQuestionario)} <small>(${ev.questionarios})</small></dd></div>
            <div><dt>Questionários em até 8 min</dt><dd>${ev.questionarios ? `${ev.ate8min} de ${ev.questionarios}` : '—'}</dd></div>
            <div><dt>Facilidade (1 a 7)</dt><dd>${ev.nSeq ? U.fmtNum(ev.seqMedio, 1) : '—'}</dd></div>
            <div><dt>Campos com mais erros</dt><dd>${ev.topErros.length ? ev.topErros.map((x) => `${U.esc(x.campo)} (${x.n})`).join(', ') : '—'}</dd></div>
          </dl>
          <div class="grade-botoes">
            <button type="button" class="btn btn-primario" data-novo-testador>${ui.icone('mais')} Novo testador</button>
            <button type="button" class="btn btn-secundario" data-ver-evidencias>${ui.icone('lista')} Ver evidências</button>
            <button type="button" class="btn btn-secundario" data-exportar-csv>${ui.icone('download')} Evidências (CSV)</button>
            <button type="button" class="btn btn-secundario" data-exportar-json>${ui.icone('download')} Testes (JSON)</button>
            <label class="btn btn-secundario">${ui.icone('upload')} Importar testes<input type="file" accept="application/json,.json" data-importar hidden></label>
          </div>
          <p class="texto-apoio pequeno">Use o JSON para juntar, num único computador, os testes feitos em máquinas diferentes.</p>
        </section>
        <section class="gaveta-sec">
          <h3>Respostas reais (planilha)</h3>
          <p class="texto-apoio">Na planilha, use Arquivo &gt; Fazer download &gt; Valores separados por vírgula (.csv) e importe o arquivo aqui. A base é esvaziada antes, para o painel mostrar só as respostas reais.</p>
          <label class="btn btn-primario btn-bloco">${ui.icone('upload')} Importar respostas da planilha (CSV)<input type="file" accept=".csv,text/csv" data-importar-csv hidden></label>
        </section>
        <section class="gaveta-sec">
          <h3>Base de dados</h3>
          <p class="texto-apoio">${nBase} egressos fictícios + ${nTeste} registros de teste + ${nColeta} respostas da planilha. ${d.vazia ? 'Base esvaziada' : 'Base gerada'} em ${U.fmtData(d.geradaEm)}.</p>
          <div class="grade-botoes">
            <button type="button" class="btn btn-secundario" data-esvaziar>${ui.icone('x')} Esvaziar base</button>
            <button type="button" class="btn btn-perigo" data-restaurar>${ui.icone('restaurar')} Restaurar base fictícia</button>
          </div>
        </section>
      </div>`;
  }

  ui.abrirGaveta = function () {
    let fundo = document.getElementById('gaveta-fundo');
    if (!fundo) {
      fundo = document.createElement('div');
      fundo.id = 'gaveta-fundo';
      fundo.className = 'gaveta-fundo';
      fundo.innerHTML = '<aside class="gaveta" id="gaveta-demo" aria-label="Painel de demonstração" tabindex="-1"></aside>';
      document.body.appendChild(fundo);
      fundo.addEventListener('mousedown', (ev) => { if (ev.target === fundo) ui.fecharGaveta(); });
      fundo.querySelector('.gaveta').addEventListener('click', aoClicarGaveta);
      fundo.querySelector('.gaveta').addEventListener('change', aoMudarGaveta);
    }
    fundo.querySelector('.gaveta').innerHTML = htmlGaveta();
    fundo.classList.add('aberta');
    document.getElementById('abrir-demo').setAttribute('aria-expanded', 'true');
    fundo.querySelector('.gaveta').focus();
  };
  ui.fecharGaveta = function () {
    const fundo = document.getElementById('gaveta-fundo');
    if (fundo) fundo.classList.remove('aberta');
    const b = document.getElementById('abrir-demo');
    if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); }
  };
  function atualizarGaveta() {
    const fundo = document.getElementById('gaveta-fundo');
    if (fundo && fundo.classList.contains('aberta')) fundo.querySelector('.gaveta').innerHTML = htmlGaveta();
  }

  async function aoClicarGaveta(ev) {
    if (ev.target.closest('[data-fechar-gaveta]')) { ui.fecharGaveta(); return; }
    const passo = ev.target.closest('[data-passo]');
    if (passo) { passosRoteiro()[+passo.dataset.passo].ir(); return; }
    if (ev.target.closest('[data-exemplo]')) { ui.fecharGaveta(); Obs.tela.preencherExemplo(); return; }
    if (ev.target.closest('[data-novo-testador]')) { ui.entrarComo({ tipo: 'egresso', egressoId: null, novo: true }, 'cadastro.html'); return; }
    if (ev.target.closest('[data-ver-evidencias]')) { ui.verEvidencias(); return; }
    if (ev.target.closest('[data-exportar-csv]')) { ui.exportarEvidenciasCsv(); return; }
    if (ev.target.closest('[data-exportar-json]')) {
      U.baixar(`testes-observatorio-${U.iso(U.hoje())}.json`, JSON.stringify(DB.exportarTestes(), null, 2), 'application/json');
      return;
    }
    if (ev.target.closest('[data-esvaziar]')) {
      const ok = await ui.confirmar('Isso apaga deste navegador os egressos fictícios, os registros de teste, as respostas importadas e as evidências. A planilha não é alterada. Deseja continuar?', 'Esvaziar base', 'btn-perigo');
      if (ok) {
        DB.esvaziar();
        ui.toast('Base esvaziada.', 'sucesso');
        root.location.reload();
      }
      return;
    }
    if (ev.target.closest('[data-restaurar]')) {
      const ok = await ui.confirmar('Isso apaga os cadastros, questionários e testes feitos neste navegador e recria os 212 egressos fictícios. Deseja continuar?', 'Restaurar base', 'btn-perigo');
      if (ok) {
        DB.restaurar();
        ui.toast('Base fictícia restaurada.', 'sucesso');
        root.location.reload();
      }
    }
  }
  function importarCsvDaPlanilha(input) {
    const leitor = new FileReader();
    leitor.onload = async () => {
      input.value = '';
      let r;
      try {
        r = Obs.coleta.registrosDoCsv(leitor.result);
      } catch (e) {
        ui.toast(U.esc(e.message), 'erro');
        return;
      }
      if (!r.registros.length) { ui.toast('Nenhuma resposta válida no arquivo.', 'erro'); return; }
      const outros = DB.egressos().filter((e) => e.origem !== 'coleta').length;
      if (outros) {
        const ok = await ui.confirmar(`O arquivo tem ${U.plural(r.registros.length, 'resposta', 'respostas')}. Para o painel mostrar só as respostas reais, a base deste navegador (${U.plural(outros, 'registro fictício ou de teste', 'registros fictícios ou de teste')}) será esvaziada antes. Continuar?`, 'Esvaziar e importar');
        if (!ok) return;
        DB.esvaziar();
      }
      const res = DB.importarRespostas(r.registros);
      ui.toast(`${U.plural(res.novos, 'resposta nova', 'respostas novas')} e ${U.plural(res.atualizados, 'atualizada', 'atualizadas')}${r.ignorados ? `; ${U.plural(r.ignorados, 'linha ignorada', 'linhas ignoradas')} (sem dados válidos)` : ''}.`, 'sucesso');
      if (document.body.dataset.tela === 'cadastro' || document.body.dataset.tela === 'questionario') setTimeout(() => { root.location.href = 'indicadores.html'; }, 900);
    };
    leitor.readAsText(input.files[0], 'utf-8');
  }
  function aoMudarGaveta(ev) {
    const csv = ev.target.closest('[data-importar-csv]');
    if (csv && csv.files.length) { importarCsvDaPlanilha(csv); return; }
    const input = ev.target.closest('[data-importar]');
    if (!input || !input.files.length) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        const r = DB.importarTestes(JSON.parse(leitor.result));
        ui.toast(`Importados: ${r.novos} registros novos, ${r.atualizados} atualizados e ${r.evidencias} evidências.`, 'sucesso');
      } catch (e) {
        ui.toast(U.esc(e.message), 'erro');
      }
      input.value = '';
    };
    leitor.readAsText(input.files[0]);
  }

  ui.linhasEvidencias = function () {
    return DB.evidencias().slice().sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)));
  };
  ui.verEvidencias = function () {
    const evs = ui.linhasEvidencias();
    const linhas = evs.map((x) => `<tr>
      <td>${U.esc(x.codigo)}</td><td>${x.tela === 'cadastro' ? 'Cadastro' : 'Questionário'}</td>
      <td>${U.fmtDataHora(x.inicio)}</td><td>${U.fmtDuracao(x.duracaoSeg)}</td>
      <td>${x.totalErros || 0}</td><td>${x.seq != null ? x.seq : '—'}</td>
      <td>${x.automatico ? 'automático' : x.concluido ? 'concluído' : 'em andamento'}</td></tr>`).join('');
    ui.modal({
      titulo: 'Evidências dos testes de preenchimento',
      largura: 820,
      corpo: evs.length
        ? `<div class="tabela-rolagem"><table class="tabela">
            <thead><tr><th>Sessão</th><th>Tela</th><th>Início</th><th>Duração</th><th>Erros de validação</th><th>Facilidade (1–7)</th><th>Situação</th></tr></thead>
            <tbody>${linhas}</tbody></table></div>
            <p class="texto-apoio pequeno">Critérios propostos para a V2: questionário respondido em até ${R.tempoEstimadoQuestionarioMin} minutos, facilidade média de pelo menos 5 (escala de 1 a 7) e nenhum campo com erro recorrente.</p>`
        : '<p>Nenhum teste registrado ainda. Clique em <strong>Novo testador</strong> no painel de demonstração para começar.</p>',
      acoes: evs.length ? [{ rotulo: `${ui.icone('download')} Exportar CSV`, classe: 'btn-primario', aoClicar: () => { ui.exportarEvidenciasCsv(); return false; } }] : [],
    });
  };
  ui.exportarEvidenciasCsv = function () {
    const evs = ui.linhasEvidencias();
    const linhas = [['sessao', 'tela', 'inicio', 'fim', 'duracao_segundos', 'erros_validacao', 'campos_com_erro', 'tentativas_envio',
      'facilidade_1a7', 'comentario', 'preenchimento_automatico', 'concluido']];
    evs.forEach((x) => linhas.push([x.codigo, x.tela, x.inicio, x.fim || '', Math.round(x.duracaoSeg || 0), x.totalErros || 0,
      Object.keys(x.erros || {}).map((k) => `${k}:${x.erros[k]}`).join(' | '), x.tentativas || 1,
      x.seq != null ? x.seq : '', x.comentario || '', x.automatico ? 'sim' : 'nao', x.concluido ? 'sim' : 'nao']));
    U.baixar(`evidencias-testes-${U.iso(U.hoje())}.csv`, U.csv(linhas), 'text/csv;charset=utf-8');
  };

  /* ------------------------------ início ------------------------------ */
  function ligarTopo() {
    const perfil = document.getElementById('btn-perfil');
    if (perfil) perfil.addEventListener('click', ui.abrirLogin);
    const demo = document.getElementById('abrir-demo');
    if (demo) demo.addEventListener('click', ui.abrirGaveta);
  }

  ui.iniciar = function (cfg) {
    document.body.dataset.tela = cfg.tela;
    document.body.insertAdjacentHTML('afterbegin', htmlTopo(cfg.tela));
    document.body.insertAdjacentHTML('beforeend', htmlRodape());
    ligarTopo();
    if (COLETA && (cfg.tela === 'indicadores' || cfg.tela === 'ficha')) {
      // site publicado: painel e ficha ficam no computador da equipe, com a planilha importada
      const main = document.getElementById('conteudo');
      main.innerHTML = `<section class="cartao vazio">${ui.icone('cadeado')}<h2>Área da equipe</h2>
        <p>Os indicadores e as fichas de destaque são preparados pela equipe do Observatório a partir das respostas recebidas.</p>
        <div class="acoes"><a class="btn btn-primario" href="cadastro.html">Ir para a pesquisa</a></div></section>`;
      return;
    }
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && !document.querySelector('.modal-fundo')) ui.fecharGaveta();
    });
    const renderizar = () => { try { cfg.render(); } catch (e) { console.error(e); ui.toast('Erro ao montar a tela: ' + U.esc(e.message), 'erro'); } };
    DB.aoMudar((tipo) => {
      if (tipo === 'perfil') {
        // atualiza cabeçalho e menu sem recarregar a página
        const velho = document.querySelectorAll('.pular, .barra-prototipo, .cabecalho, #faixa-restrita');
        velho.forEach((n) => n.remove());
        document.body.insertAdjacentHTML('afterbegin', htmlTopo(cfg.tela));
        ligarTopo();
      }
      if (cfg.aoMudar) cfg.aoMudar(tipo); else renderizar();
      atualizarGaveta();
    });
    renderizar();
  };

  Obs.ui = ui;
})(typeof window !== 'undefined' ? window : globalThis);

/* =====================================================================
   Tela 3 — Painel de indicadores (E4 e seção 4.4 do EX08)
   Todos os números são calculados na hora a partir dos registros, com as
   fórmulas da matriz (Quadro 5). A visão pública aplica a regra da LGPD
   do protocolo E8: só dados agregados e nenhum grupo com menos de 5.
   Ações da equipe: lembrete ao orientador (mensagem-modelo), conferência
   do Lattes pela Secretaria e geração do quadro do Anexo 2 em CSV.
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
  const MIN_GRUPO = 5;
  const estado = { faixa: 'todas', origem: 'todas', visao: 'restrita', todasPendencias: false, todasValidacoes: false, destacar: null };
  let ultimo = null;

  const podeVer = () => DB.podeVerPainelCompleto();
  const publica = () => !podeVer() || estado.visao === 'publica';
  const podeConferir = () => ['secretaria', 'rt'].includes(DB.perfil().tipo);
  const pct0 = (v) => U.fmtPct(v, 0);
  const oculto = '<span class="oculto-lgpd">menos de 5</span>';
  const lgpd = (n, texto) => (publica() && n < MIN_GRUPO ? oculto : texto);
  const btnInfo = (id) => `<button type="button" class="btn-info" data-info="${id}" aria-label="Como este indicador é calculado">${ui.icone('info')}</button>`;

  /* ------------------------------ seções ------------------------------ */
  function linhaCriterio(rotulo, n, total, forte) {
    const p = U.pct(n, total) || 0;
    return `<div class="criterio-linha"><span>${rotulo}</span>
      <div class="mini-trilho"><div class="mini-barra ${forte ? 'forte' : ''}" style="width:${p}%"></div></div>
      <span class="barra-num">${n} · ${pct0(p)}</span></div>`;
  }

  function secKpi(r) {
    const d = r.dadosMinimos;
    if (!d.titulados || (publica() && d.titulados < MIN_GRUPO)) {
      return `<section class="cartao"><h2>Egressos com dados mínimos atualizados</h2><p class="texto-apoio">${d.titulados ? 'Grupo com menos de 5 pessoas: resultado não exibido na visão pública (LGPD).' : 'Nenhum registro para o filtro escolhido.'}</p></section>`;
    }
    const pct = d.pct || 0;
    return `
      <section class="cartao" aria-labelledby="kpi-titulo">
        <div class="kpi-principal">
          <div>
            <div class="kpi-rotulo" id="kpi-titulo">Egressos com dados mínimos atualizados ${btnInfo('dadosMinimos')}</div>
            <div class="kpi-numero">${U.fmtPct(pct, 1)}<small>${d.n} de ${d.titulados} titulados</small></div>
            <div class="meta-trilho" role="img" aria-label="${U.fmtPct(pct, 1)} de egressos com dados mínimos; meta de ${d.meta}%">
              <div class="meta-barra" style="width:${Math.min(100, pct)}%"></div>
              <div class="meta-marca" style="left:calc(${d.meta}% - 1px)"><span>Meta ${d.anoMeta}: ${d.meta}%</span></div>
            </div>
            <div class="meta-legenda"><span>0%</span><span>Metas do PE 2025–2028: 60% · 75% · 85%</span><span>100%</span></div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
              <span>Meta ${d.anoMeta}: <strong>${d.meta}%</strong></span>
              ${d.faltam ? `<span class="chip chip-amarelo">Faltam ${U.plural(d.faltam, 'egresso', 'egressos')} para a meta</span>`
                : `<span class="chip chip-verde">${ui.icone('check')} Meta atingida</span>`}
            </div>
            <div class="criterios-kpi">
              ${linhaCriterio('E-mail confirmado', d.criterios.email, d.titulados)}
              ${linhaCriterio('Vínculo informado em até 12 meses', d.criterios.vinculo, d.titulados)}
              ${linhaCriterio('Lattes conferido em até 12 meses', d.criterios.lattes, d.titulados)}
              ${linhaCriterio('<strong>Os três critérios</strong>', d.n, d.titulados, true)}
            </div>
            <p class="texto-apoio pequeno" style="margin:8px 0 0">O critério com o menor valor mostra onde concentrar o esforço de atualização.</p>
          </div>
        </div>
      </section>`;
  }

  function secFaixas(r) {
    return `<div class="grade-3 mb">${r.faixas.map((f) => {
      const sel = estado.faixa === f.faixa;
      const esconder = publica() && f.titulados < MIN_GRUPO;
      const pontos = Array.from({ length: R.limiteDestaques }, (_, i) => `<i class="${i < f.destaques ? 'on' : ''}"></i>`).join('');
      return `<div class="cartao cartao-faixa ${sel ? 'selecionada' : ''}" role="button" tabindex="0" data-faixa="${f.faixa}" aria-pressed="${sel}"
          title="${sel ? 'Remover o filtro de faixa' : `Filtrar o painel pela faixa ${f.faixa}`}">
        <h3>${f.faixa}</h3>
        <div class="texto-apoio">${U.plural(f.titulados, 'titulado', 'titulados')}</div>
        <div class="faixa-pct">${f.titulados && !esconder ? pct0(f.pct) : '—'}</div>
        <div class="texto-apoio">com dados mínimos atualizados</div>
        <div class="mini-trilho" style="margin:8px 0 10px;position:relative;overflow:visible">
          <div class="mini-barra forte" style="width:${esconder ? 0 : f.pct || 0}%;border-radius:99px"></div>
          <span style="position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--cinza-950);left:${r.dadosMinimos.meta}%" title="Meta ${r.dadosMinimos.anoMeta}"></span>
        </div>
        <div>Destaques validados: <strong>${f.destaques} de ${R.limiteDestaques}</strong><span class="pontos" aria-hidden="true">${pontos}</span></div>
        ${f.fichasEmAnalise && !publica() ? `<div class="texto-apoio pequeno" style="margin-top:4px">${U.plural(f.fichasEmAnalise, 'ficha em análise', 'fichas em análise')} na Comissão</div>` : ''}
      </div>`;
    }).join('')}</div>`;
  }

  function secInsercao(r) {
    const ins = r.insercao;
    const barras = ins.porSetor.map((s) => {
      const esconder = publica() && s.n < MIN_GRUPO;
      return `<div class="barra-linha"><span>${s.rotulo}</span>
        <div class="barra-trilho">${esconder ? '' : `<div class="barra-valor ${s.rotulo === 'Sem vínculo' ? 'neutra' : ''}" style="width:${s.pct || 0}%"></div>`}</div>
        <span class="barra-num">${esconder ? oculto : `${pct0(s.pct)}${publica() ? '' : ` <small class="texto-apoio">(${s.n})</small>`}`}</span></div>`;
    }).join('');
    const nat = ins.porNatureza.map((x) => `${pct0(x.pct)} ${x.rotulo === 'Sem vínculo' ? 'sem vínculo' : x.rotulo.toLowerCase()}`).join(', ');
    const ufs = r.ufs.map((u) => {
      const esconder = publica() && u.n < MIN_GRUPO;
      return `<div class="barra-linha"><span>${u.rotulo === 'outras' ? 'Outras UFs e exterior' : u.rotulo}</span>
        <div class="barra-trilho">${esconder ? '' : `<div class="barra-valor" style="width:${u.pct || 0}%;background:var(--azul-600)"></div>`}</div>
        <span class="barra-num">${esconder ? oculto : `${pct0(u.pct)}${publica() ? '' : ` <small class="texto-apoio">(${u.n})</small>`}`}</span></div>`;
    }).join('');
    return `
      <section class="cartao">
        <h2>Inserção por setor ${btnInfo('insercao')}</h2>
        ${ins.base ? `<div class="barras">${barras}</div>
        <p class="texto-apoio pequeno" style="margin:12px 0 0">Natureza do vínculo: ${nat}. Inserção profissional (com vínculo ativo): <strong>${pct0(ins.pct)}</strong>.
          Base: ${U.plural(ins.base, 'egresso', 'egressos')} com dados mínimos atualizados.</p>
        <h3 style="font-size:15px;margin:18px 0 10px">Principais UFs</h3>
        <div class="barras">${ufs}</div>` : '<p class="texto-apoio">Sem egressos com dados mínimos atualizados neste filtro.</p>'}
      </section>`;
  }

  function secFormacao(r) {
    const per = r.permanencia;
    const porFaixa = per.porFaixa.filter((x) => x.n).map((x) => `${x.faixa}: ${U.fmtNum(x.media, 1)}`).join(' · ');
    const linhas = [
      ['Tempo médio no vínculo atual', per.n ? `${U.fmtNum(per.media, 1)} anos` : '—', per.n, 'permanencia', porFaixa ? `Por faixa (anos): ${porFaixa}` : ''],
      ['Mudaram de cargo, setor ou região', pct0(r.mobilidade.pct), r.mobilidade.respondentes, 'mobilidade', `${r.mobilidade.n} de ${U.plural(r.mobilidade.respondentes, 'respondente', 'respondentes')}`],
      ['Atuação relacionada à formação', pct0(r.relacionada.pct), r.relacionada.respondentes, 'relacionada', 'Notas 4 ou 5 numa escala de 1 a 5'],
      ['Docência ou atuação em PPG', pct0(r.docencia.pct), r.docencia.base, 'docencia', ''],
      ['Em doutorado ou atuando em PPG', pct0(r.continuidade.pct), r.continuidade.base, null, 'Indicador complementar (continuidade formativa)'],
      ['Taxa de resposta ao questionário', pct0(r.resposta.pct), r.resposta.enviados, 'resposta', `${r.resposta.completos} de ${r.resposta.enviados} convites dos últimos 12 meses · meta 50%`],
    ];
    return `
      <section class="cartao">
        <h2>Permanência, mobilidade e formação</h2>
        <table class="tabela tabela-indicadores">
          ${linhas.map(([rot, valor, base, info, sub]) => `<tr>
            <td>${rot} ${info ? btnInfo(info) : ''}${sub ? `<div class="texto-apoio pequeno">${sub}</div>` : ''}</td>
            <td style="text-align:right;white-space:nowrap"><strong>${base ? lgpd(base, valor) : '—'}</strong></td></tr>`).join('')}
        </table>
      </section>`;
  }

  function secTiles(r) {
    const a = r.autores;
    const c = r.captura;
    const imp = r.importancia;
    return `
      <div class="grade-3 mb">
        <section class="cartao">
          <div class="tile-rotulo"><span>Egressos autores (até 5 anos)</span>${btnInfo('autores')}</div>
          <div class="tile-num">${a.base ? lgpd(a.base, pct0(a.pct)) : '—'}</div>
          <div class="tile-rodape">${a.base ? `${a.n} de ${U.plural(a.base, 'titulado', 'titulados')} desde ${U.hoje().getFullYear() - 5} com produção registrada. Apoia o item 2.3 da Ficha.` : 'Sem titulados no período.'}</div>
        </section>
        <section class="cartao">
          <div class="tile-rotulo"><span>Captura na defesa</span>${btnInfo('captura')}</div>
          <div class="tile-num">${c.base ? lgpd(c.base, pct0(c.pct)) : '—'}</div>
          <div class="tile-rodape">${c.base ? `${c.n} de ${U.plural(c.base, 'defesa', 'defesas')} desde 2026 com cadastro antes do depósito final.` : 'Sem defesas desde 2026 neste filtro.'} Meta: 100% após aprovação do Colegiado.</div>
        </section>
        <section class="cartao">
          <div class="tile-rotulo"><span>Formação foi "muito importante" ou "decisiva" para</span></div>
          ${imp[0].n ? `<div class="barras" style="gap:6px">${imp.map((x) => `<div class="barra-linha" style="grid-template-columns:1fr 50px"><span class="pequeno">${x.rotulo}</span><span class="barra-num"><strong>${lgpd(x.n, pct0(x.pctMuitoOuDecisiva))}</strong></span></div>`).join('')}</div>
          <div class="tile-rodape">Base: ${U.plural(imp[0].n, 'respondente', 'respondentes')} (padrão Alumni USP).</div>` : '<div class="tile-rodape">Sem respostas neste filtro.</div>'}
        </section>
      </div>`;
  }

  function secAvaliacao(r) {
    const a = r.avaliacao;
    if (!a.respondentes) return '';
    const coluna = (titulo, lista) => `<div><h3 style="font-size:14px;margin-bottom:8px">${titulo}</h3>
      ${lista.length ? `<ol style="margin:0;padding-left:18px;font-size:13px">${lista.slice(0, 3).map((x) => `<li style="margin-bottom:4px">${U.esc(x.texto)} <span class="texto-apoio">(${x.n})</span></li>`).join('')}</ol>`
        : '<p class="texto-apoio pequeno">Sem sugestões.</p>'}</div>`;
    return `
      <section class="cartao">
        <div class="cartao-cab"><h2>Avaliação do programa pelos egressos</h2>
          <span class="texto-apoio">Bloco 4 do questionário · subsídio para a autoavaliação (dimensão D5) · ${U.plural(a.respondentes, 'respondente', 'respondentes')}</span></div>
        <div class="grade-3">${coluna('O que manter', a.manter)}${coluna('O que mudar', a.mudar)}${coluna('O que incluir', a.incluir)}</div>
        <p class="texto-apoio pequeno" style="margin:12px 0 0">Disponibilidade para colaborar: ${a.disponibilidade.map((d) => `${d.rotulo.toLowerCase()} (${d.n})`).join(' · ')}.
          Respostas abertas aparecem só na visão restrita.</p>
      </section>`;
  }

  function secPendencias(r) {
    const d = DB.dados();
    const lista = estado.todasPendencias ? r.pendencias : r.pendencias.slice(0, 5);
    return `
      <section class="cartao">
        <div class="cartao-cab"><h2>Pendências por orientador</h2>
          <span class="texto-apoio">${U.plural(r.totalPendentes, 'egresso', 'egressos')} sem atualização há mais de 12 meses ou sem cadastro</span></div>
        ${lista.length ? `<div class="tabela-rolagem"><table class="tabela">
          <thead><tr><th>Orientador(a)</th><th class="num">Egressos sem atualização há mais de 12 meses</th><th>Faixa com mais pendências</th><th>Último lembrete</th><th><span class="sr">Ação</span></th></tr></thead>
          <tbody>${lista.map((p) => {
            const l = d.lembretes[p.orientador];
            return `<tr><td>${U.esc(p.orientador)}</td><td class="num">${p.n}</td><td>${p.faixaMais || '—'}</td>
              <td>${l ? `${U.fmtData(l.em)} <small class="texto-apoio">(${l.n})</small>` : '—'}</td>
              <td style="text-align:right"><button type="button" class="btn btn-mini" data-lembrete="${U.esc(p.orientador)}">${ui.icone('envelope')} Enviar lembrete</button></td></tr>`;
          }).join('')}</tbody></table></div>
          ${r.pendencias.length > 5 ? `<button type="button" class="btn btn-texto" data-todas-pendencias>${estado.todasPendencias ? 'Mostrar só os 5 primeiros' : `Mostrar todos os ${r.pendencias.length} orientadores`}</button>` : ''}`
          : '<p class="texto-apoio">Nenhuma pendência neste filtro.</p>'}
      </section>`;
  }

  function secValidacoes(r) {
    const prioridade = (v) => (v.e.papel === 'rafael' ? 0 : v.e.origem === 'teste' ? 1 : 2);
    const lista = r.validacoes.slice().sort((a, b) => prioridade(a) - prioridade(b) || a.e.nome.localeCompare(b.e.nome));
    const mostrar = estado.todasValidacoes ? lista : lista.slice(0, 8);
    const acao = (v) => {
      const b = [];
      if (v.lattes.codigo === 'nao-conferido') {
        b.push(podeConferir() ? `<button type="button" class="btn btn-mini" data-conferir="${v.e.id}">${ui.icone('check')} Conferir Lattes</button>`
          : '<button type="button" class="btn btn-mini" disabled title="Ação da Secretaria ou do Responsável Temático">Conferir Lattes</button>');
      }
      if (v.lattes.codigo === 'desatualizado') b.push(`<button type="button" class="btn btn-mini" data-aviso="Lembrete enviado: o egresso precisa atualizar o Currículo Lattes (simulação).">Lembrar egresso</button>`);
      if (v.lattes.codigo === 'sem-id') b.push(`<button type="button" class="btn btn-mini" data-aviso="Pedido do ID Lattes enviado ao egresso (simulação).">Pedir ID Lattes</button>`);
      if (!v.c.email) b.push(`<button type="button" class="btn btn-mini" data-aviso="Link de confirmação reenviado para ${U.esc(v.e.cadastro.email)} (simulação).">Reenviar link</button>`);
      return b.join(' ');
    };
    return `
      <section class="cartao" id="validacoes" tabindex="-1">
        <div class="cartao-cab"><h2>Validações pendentes</h2>
          <span class="texto-apoio">Vínculo em dia, mas falta confirmar o e-mail ou conferir o Lattes (${lista.length})</span></div>
        ${lista.length ? `<div class="tabela-rolagem"><table class="tabela">
          <thead><tr><th>Egresso</th><th>Faixa</th><th>E-mail</th><th>Currículo Lattes</th><th><span class="sr">Ações</span></th></tr></thead>
          <tbody>${mostrar.map((v) => `<tr class="${estado.destacar === v.e.id ? 'linha-destaque' : ''}">
            <td>${U.esc(v.e.nome)} ${v.e.origem === 'teste' ? `<span class="chip chip-cinza">teste ${U.esc(v.e.codigoTeste)}</span>` : ''}</td>
            <td>${I.faixaDe(v.e.anoDefesa) || '—'}</td>
            <td>${v.c.email ? `<span class="chip chip-verde">${ui.icone('check')} confirmado</span>` : '<span class="chip chip-amarelo-claro">não confirmado</span>'}</td>
            <td>${U.esc(v.lattes.texto)}${v.e.lattes && v.e.lattes.declarado && !v.e.lattes.conferidoEm && v.e.lattes.atualizadoEm ? ` <small class="texto-apoio">(informado: ${U.fmtMes(v.e.lattes.atualizadoEm)})</small>` : ''}</td>
            <td style="text-align:right;white-space:nowrap">${acao(v)}</td></tr>`).join('')}</tbody></table></div>
          ${lista.length > 8 ? `<button type="button" class="btn btn-texto" data-todas-validacoes>${estado.todasValidacoes ? 'Mostrar só as 8 primeiras' : `Mostrar todas as ${lista.length}`}</button>` : ''}`
          : '<p class="texto-apoio">Nenhuma validação pendente.</p>'}
      </section>`;
  }

  function secAcoes() {
    if (publica()) return '';
    return `<div class="acoes mb">
      <button type="button" class="btn btn-primario" data-anexo2>${ui.icone('download')} Gerar quadro do Anexo 2 (CAPES 2.2.1)</button>
      <button type="button" class="btn btn-secundario" data-relatorio>${ui.icone('imprimir')} Exportar relatório anual (PDF)</button>
    </div>`;
  }

  function valorMatriz(id, r) {
    const f = r.faixas;
    return {
      dadosMinimos: `${U.fmtPct(r.dadosMinimos.pct, 1)} (${r.dadosMinimos.n} de ${r.dadosMinimos.titulados})`,
      cobertura: f.map((x) => `${x.faixa}: ${pct0(x.pct)}`).join('<br>'),
      insercao: `${pct0(r.insercao.pct)} com vínculo ativo`,
      permanencia: r.permanencia.n ? `${U.fmtNum(r.permanencia.media, 1)} anos` : '—',
      mobilidade: pct0(r.mobilidade.pct),
      relacionada: pct0(r.relacionada.pct),
      docencia: pct0(r.docencia.pct),
      autores: pct0(r.autores.pct),
      captura: `${pct0(r.captura.pct)} (${r.captura.n} de ${r.captura.base})`,
      resposta: `${pct0(r.resposta.pct)} (${r.resposta.completos} de ${r.resposta.enviados})`,
      destaques: f.map((x) => `${x.faixa}: ${x.destaques} de ${R.limiteDestaques}`).join('<br>'),
    }[id];
  }
  function secMatriz(r) {
    return `
      <details class="cartao matriz">
        <summary>Matriz de indicadores (Quadro 5 do EX08) com os valores calculados agora</summary>
        <div class="tabela-rolagem"><table class="tabela tabela-matriz">
          <thead><tr><th>Indicador</th><th>Fórmula</th><th>Fonte</th><th>Validação</th><th>Meta</th><th>Valor atual</th></tr></thead>
          <tbody>${R.matriz.map((m) => `<tr><td>${m.nome}</td><td>${m.formula}</td><td>${m.fonte}</td><td>${m.validacao}</td><td>${m.meta}</td>
            <td style="white-space:nowrap"><strong>${publica() ? '—' : valorMatriz(m.id, r)}</strong></td></tr>`).join('')}</tbody>
        </table></div>
        <p class="texto-apoio pequeno" style="margin-top:10px">Os indicadores são calculados por faixa de titulação (2024–2028, 2019–2023 e 2014–2018). Respondentes = questionários com os blocos 1 e 2 completos nos últimos 12 meses.</p>
      </details>`;
  }

  /* ------------------------------ render ------------------------------ */
  function render() {
    const hoje = U.hoje();
    const restrita = podeVer();
    if (!restrita) estado.visao = 'publica';
    if (restrita) {
      ui.faixaRestrita(`${ui.icone('cadeado')} Área restrita: Coordenação, Secretaria, Comissão de Autoavaliação e Responsável Temático. A página pública Dados mostra apenas números agregados.`, 'restrita');
    } else {
      ui.faixaRestrita(`${ui.icone('olho')} Visão pública (página Dados): só indicadores agregados; grupos com menos de 5 pessoas não são exibidos. <button type="button" class="btn btn-texto" data-login>Entrar como equipe do PPGTIC (simulado)</button>`, 'publica');
    }
    $('grupo-origem').hidden = !restrita;
    $('grupo-visao').hidden = !restrita;
    $('f-faixa').value = estado.faixa;
    $('f-origem').value = estado.origem;
    $('f-visao').value = estado.visao;
    const r = I.calcular(DB.egressos(), { hoje, faixa: estado.faixa, origem: estado.origem });
    ultimo = r;
    $('lead-painel').textContent = `Situação em ${U.fmtDataExtenso(U.iso(hoje))}. Egressos titulados de 2014 a 2028, organizados pelas três faixas da Ficha de Avaliação CAPES${estado.faixa !== 'todas' ? `. Filtro aplicado: faixa ${estado.faixa}` : ''}.`;
    $('impressao-data').textContent = `Situação em ${U.fmtDataExtenso(U.iso(hoje))}`;
    $('contagem-registros').textContent = restrita && !publica() ? `${r.contagem.base} registros da base fictícia · ${r.contagem.teste} de teste${r.contagem.coleta ? ` · ${r.contagem.coleta} da planilha` : ''}` : '';
    $('painel').innerHTML = [
      secKpi(r),
      secFaixas(r),
      `<div class="grade-2 mb">${secInsercao(r)}${secFormacao(r)}</div>`,
      secTiles(r),
      publica() ? '' : secAvaliacao(r),
      publica() ? '' : secPendencias(r),
      publica() ? '' : secValidacoes(r),
      secAcoes(),
      secMatriz(r),
    ].join('');
  }

  /* ------------------------------ modais ------------------------------ */
  function abrirInfo(id) {
    const m = R.matriz.find((x) => x.id === id);
    if (!m) return;
    ui.modal({
      titulo: m.nome,
      largura: 560,
      corpo: `<table class="tabela tabela-chave">
        <tr><td>Fórmula</td><td>${m.formula}</td></tr>
        <tr><td>Fonte</td><td>${m.fonte}</td></tr>
        <tr><td>Validação</td><td>${m.validacao}</td></tr>
        <tr><td>Meta</td><td>${m.meta}</td></tr>
        ${publica() ? '' : `<tr><td>Valor atual</td><td><strong>${valorMatriz(id, ultimo)}</strong></td></tr>`}
      </table>
      <p class="texto-apoio pequeno" style="margin-top:10px">Fonte da definição: matriz de indicadores, Quadro 5 do EX08 (Versão 1).</p>`,
      acoes: [{ rotulo: 'Fechar', classe: 'btn-primario' }],
    });
  }

  function abrirLembrete(orientador) {
    const p = ultimo.pendencias.find((x) => x.orientador === orientador);
    if (!p) return;
    const hoje = U.hoje();
    const tratamento = /Prof\.ª/.test(orientador) ? 'Prezada' : 'Prezado';
    const itens = p.egressos.slice().sort((a, b) => a.anoDefesa - b.anoDefesa).map((e) => `• ${e.nome} (${e.nivel === 'DO' ? 'Doutorado' : 'Mestrado'}, ${e.anoDefesa}) · ${e.cadastro ? `último registro em ${U.fmtMes(e.cadastro.vinculoInformadoEm)}` : 'sem cadastro'}`).join('\n');
    const texto = `${tratamento} ${orientador},

O Observatório de Egressos do PPGTIC identificou ${U.plural(p.n, 'ex-orientando(a)', 'ex-orientandos(as)')} sem atualização há mais de 12 meses ou sem cadastro:

${itens}

Se você mantém contato com eles(as), pedimos a gentileza de encaminhar o link de atualização do portal. O preenchimento leva cerca de ${R.tempoEstimadoQuestionarioMin} minutos e ajuda o Programa no item 2.2 da Ficha de Avaliação da CAPES.

Atenciosamente,
Responsável Temático do Observatório de Egressos`;
    ui.modal({
      titulo: `Lembrete para ${U.esc(orientador)}`,
      largura: 660,
      corpo: `<p class="texto-apoio">Mensagem-modelo gerada a partir da lista de pendências (resposta ao risco "orientadores sem tempo para o resgate"). Você pode editar antes de registrar o envio.</p>
        <label class="rotulo" for="texto-lembrete">Mensagem</label>
        <textarea class="campo" id="texto-lembrete" style="min-height:280px">${U.esc(texto)}</textarea>`,
      acoes: [
        { rotulo: 'Cancelar' },
        { rotulo: `${ui.icone('envelope')} Registrar envio (simulação)`, classe: 'btn-primario', aoClicar: () => {
          DB.registrarLembrete(orientador, { em: U.iso(hoje), n: p.n, por: R.perfis[DB.perfil().tipo] });
          ui.toast(`Lembrete registrado para ${U.esc(orientador)} (nenhum e-mail é enviado no protótipo).`, 'sucesso');
        } },
      ],
    });
  }

  function abrirConferencia(id) {
    const e = DB.obter(id);
    if (!e) return;
    const l = e.lattes || {};
    const sugestao = l.atualizadoEm ? U.fmtMes(l.atualizadoEm) : U.fmtMes(U.isoMes(U.addMeses(U.hoje(), -2)));
    ui.modal({
      titulo: 'Conferir Currículo Lattes',
      largura: 540,
      corpo: `<table class="tabela tabela-chave" style="margin-bottom:12px">
          <tr><td>Egresso</td><td><strong>${U.esc(e.nome)}</strong> · ${e.nivel === 'DO' ? 'Doutorado' : 'Mestrado'}, ${e.anoDefesa}</td></tr>
          <tr><td>ID Lattes</td><td>${U.esc(e.cadastro.lattesId)} <small class="texto-apoio">(no protótipo o currículo não é aberto)</small></td></tr>
          <tr><td>Data informada pelo egresso</td><td>${l.declarado && l.atualizadoEm ? U.fmtMes(l.atualizadoEm) : 'não informada'}</td></tr>
        </table>
        <label class="rotulo" for="data-lattes">Data da última atualização exibida no currículo<span class="obrig">*</span></label>
        <input class="campo" id="data-lattes" placeholder="MM/AAAA" maxlength="7" inputmode="numeric" value="${sugestao}" autofocus>
        <div class="msg-ajuda">Critério de dados mínimos: Lattes atualizado nos últimos 12 meses.</div>
        <div id="erro-data-lattes"></div>`,
      acoes: [
        { rotulo: 'Cancelar' },
        { rotulo: `${ui.icone('check')} Registrar conferência`, classe: 'btn-primario', aoClicar: (el) => {
          const txt = el.querySelector('#data-lattes').value.trim();
          const m = /^(\d{2})\/(\d{4})$/.exec(txt);
          const box = el.querySelector('#erro-data-lattes');
          if (!m || +m[1] < 1 || +m[1] > 12 || U.parse(`${m[2]}-${m[1]}`) > U.hoje()) {
            box.innerHTML = `<div class="msg-erro">${ui.icone('alerta')}<span>Informe mês e ano válidos (MM/AAAA), sem data futura.</span></div>`;
            return false;
          }
          const antes = I.criterios(e, U.hoje()).todos;
          DB.alterar(e.id, (x) => {
            x.lattes = { atualizadoEm: `${m[2]}-${m[1]}-01`, conferidoEm: U.iso(U.hoje()), conferidoPor: R.perfis[DB.perfil().tipo], declarado: !!(x.lattes && x.lattes.declarado) };
          });
          const depois = I.criterios(DB.obter(e.id), U.hoje());
          if (!depois.lattes) ui.toast('Conferência registrada, mas o Lattes tem mais de 12 meses: o egresso precisa atualizar o currículo.', 'info');
          else if (depois.todos && !antes) ui.toast(`Lattes conferido. ${U.esc(U.primeiroNome(e.nome))} passa a contar como egresso com dados mínimos atualizados.`, 'sucesso');
          else ui.toast('Lattes conferido.', 'sucesso');
          return true;
        } },
      ],
      aoAbrir(el) {
        const inp = el.querySelector('#data-lattes');
        inp.addEventListener('input', () => {
          const d = inp.value.replace(/\D/g, '').slice(0, 6);
          inp.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
        });
      },
    });
  }

  function linhasAnexo2() {
    const hoje = U.hoje();
    const lista = DB.egressos().filter((e) => I.faixaDe(e.anoDefesa) && e.anoDefesa <= hoje.getFullYear())
      .filter((e) => estado.origem === 'todas' || e.origem === estado.origem)
      .filter((e) => estado.faixa === 'todas' || I.faixaDe(e.anoDefesa) === estado.faixa)
      .sort((a, b) => a.anoDefesa - b.anoDefesa || a.nome.localeCompare(b.nome));
    return lista.map((e) => {
      const c = e.cadastro;
      const destino = !c ? 'Não informado' : c.semVinculo ? `Sem vínculo (${c.cidade}/${c.uf})`
        : `${c.cargo} · ${c.instituicao} (${c.natureza}, ${c.setor}) · ${c.cidade}/${c.uf}${c.pais && c.pais !== 'Brasil' ? ` · ${c.pais}` : ''}`;
      const perm = c && !c.semVinculo && c.inicioVinculo ? `No vínculo atual desde ${U.fmtMes(c.inicioVinculo)} (${U.fmtNum(U.anosEntre(`${c.inicioVinculo}-01`, hoje), 1)} anos)` : '—';
      const q = I.respostaRecente(e, hoje) || (e.questionarios || []).filter((x) => x.completo).pop();
      const mud = q && q.blocos.b1 ? (q.blocos.b1.mudancas || []).filter((m) => m !== 'nenhuma') : null;
      const mob = mud == null ? (e.vinculosAnteriores && e.vinculosAnteriores.length ? 'Mudou de vínculo (registro do cadastro)' : 'Não informado')
        : mud.length ? `Mudou desde a titulação: ${mud.map((m) => R.mudancas.find((x) => x.id === m).rotulo.toLowerCase()).join(', ')}` : 'Sem mudança desde a titulação';
      const sit = I.criterios(e, hoje).todos ? 'Dados mínimos atualizados' : 'Pendente de atualização';
      return ['[preenchido pela Secretaria]', e.nome, e.titulo, e.nivel, e.anoDefesa, destino, perm, mob, I.faixaDe(e.anoDefesa), sit];
    });
  }
  function abrirAnexo2() {
    const cab = ['CPF do egresso', 'Nome', 'Título do trabalho de conclusão', 'Nível', 'Ano da defesa', 'Destino', 'Permanência', 'Mobilidade', 'Faixa', 'Situação dos dados'];
    const linhas = linhasAnexo2();
    const prioridade = (l) => (l[1] === 'Rafael Costa Lima' ? 0 : l[7] !== 'Não informado' && l[5] !== 'Não informado' ? 1 : l[5] !== 'Não informado' ? 2 : 3);
    const amostra = linhas.map((l, i) => ({ l, i })).sort((a, b) => prioridade(a.l) - prioridade(b.l) || b.l[4] - a.l[4] || a.i - b.i).slice(0, 6).map((x) => x.l);
    const colunas = [0, 1, 3, 4, 5, 6, 7];
    ui.modal({
      titulo: 'Quadro do Anexo 2 · subitem 2.2.1 (CAPES)',
      largura: 1080,
      corpo: `<p class="texto-apoio">Gerado automaticamente a partir do cadastro e do questionário: ${U.plural(linhas.length, 'linha', 'linhas')}${estado.faixa !== 'todas' ? ` (faixa ${estado.faixa})` : ''}. O CPF é inserido pela Secretaria a partir dos registros acadêmicos e só aparece no arquivo enviado à CAPES.</p>
        <div class="tabela-rolagem"><table class="tabela" style="font-size:12px">
          <thead><tr>${colunas.map((k) => `<th>${cab[k]}</th>`).join('')}</tr></thead>
          <tbody>${amostra.map((l) => `<tr>${colunas.map((k) => `<td>${U.esc(k === 0 ? '(Secretaria)' : l[k])}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>
        <p class="texto-apoio pequeno" style="margin-top:8px">Prévia com ${amostra.length} linhas e sem a coluna do título. O arquivo CSV traz todas as linhas e colunas do Anexo 2, mais duas de controle interno (faixa e situação dos dados).</p>`,
      acoes: [
        { rotulo: 'Fechar' },
        { rotulo: `${ui.icone('download')} Baixar CSV`, classe: 'btn-primario', aoClicar: () => {
          U.baixar(`anexo2-egressos-ppgtic-${U.iso(U.hoje())}.csv`, U.csv([cab].concat(linhas)), 'text/csv;charset=utf-8');
          return false;
        } },
      ],
    });
  }

  /* ------------------------------ eventos ------------------------------ */
  function ligarEventos() {
    $('f-faixa').addEventListener('change', (ev) => { estado.faixa = ev.target.value; render(); });
    $('f-origem').addEventListener('change', (ev) => { estado.origem = ev.target.value; render(); });
    $('f-visao').addEventListener('change', (ev) => { estado.visao = ev.target.value; render(); });
    const painel = $('painel');
    painel.addEventListener('click', (ev) => {
      const t = ev.target;
      const info = t.closest('[data-info]');
      if (info) { ev.stopPropagation(); abrirInfo(info.dataset.info); return; }
      const faixa = t.closest('[data-faixa]');
      if (faixa) { estado.faixa = estado.faixa === faixa.dataset.faixa ? 'todas' : faixa.dataset.faixa; render(); return; }
      const lem = t.closest('[data-lembrete]');
      if (lem) { abrirLembrete(lem.dataset.lembrete); return; }
      const conf = t.closest('[data-conferir]');
      if (conf) { abrirConferencia(conf.dataset.conferir); return; }
      const aviso = t.closest('[data-aviso]');
      if (aviso) { ui.toast(aviso.dataset.aviso, 'info'); return; }
      if (t.closest('[data-todas-pendencias]')) { estado.todasPendencias = !estado.todasPendencias; render(); return; }
      if (t.closest('[data-todas-validacoes]')) { estado.todasValidacoes = !estado.todasValidacoes; render(); return; }
      if (t.closest('[data-anexo2]')) { abrirAnexo2(); return; }
      if (t.closest('[data-relatorio]')) {
        // o relatório anual sai com as listas completas e a matriz aberta
        const antes = { p: estado.todasPendencias, v: estado.todasValidacoes };
        estado.todasPendencias = true;
        estado.todasValidacoes = true;
        render();
        const det = document.querySelector('details.matriz');
        if (det) det.open = true;
        const restaurar = () => {
          estado.todasPendencias = antes.p;
          estado.todasValidacoes = antes.v;
          render();
          root.removeEventListener('afterprint', restaurar);
        };
        root.addEventListener('afterprint', restaurar);
        ui.toast('Na janela de impressão, escolha "Salvar como PDF".', 'info');
        setTimeout(() => root.print(), 300);
      }
    });
    painel.addEventListener('keydown', (ev) => {
      const faixa = ev.target.closest('[data-faixa]');
      if (faixa && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); faixa.click(); }
    });
    document.addEventListener('click', (ev) => { if (ev.target.closest('[data-login]')) ui.abrirLogin(); });
  }

  function iniciar() {
    if (root.location.hash === '#validacoes') {
      const raf = DB.rafael();
      if (raf) estado.destacar = raf.id;
    }
    ui.iniciar({
      tela: 'indicadores',
      render,
      aoMudar: (tipo) => { if (tipo === 'perfil' && podeVer()) estado.visao = 'restrita'; render(); },
    });
    if (estado.destacar) {
      setTimeout(() => {
        const sec = $('validacoes');
        if (sec) { sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); sec.focus({ preventScroll: true }); }
      }, 250);
    }
  }

  ligarEventos();
  iniciar();
})(window);

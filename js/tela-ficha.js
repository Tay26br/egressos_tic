/* =====================================================================
   Tela 4 — Ficha de egresso de destaque (E6 do EX08, seção 4.5)
   Fluxo: indicação → rascunho → enviada à Comissão → aprovada → publicada
   na vitrine (com autorização do egresso, que pode pedir a retirada).
   Regras da V2: no máximo 5 destaques validados por faixa, impactos com
   até 150 palavras, comprovação obrigatória, consentimento verificado no
   cadastro e local de arquivamento gerado automaticamente.
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
  const ORDEM = { publicada: 0, aprovada: 1, enviada: 2, devolvida: 3, rascunho: 4 };

  let selecionado = U.parametro('id') || null;
  let rascunho = null;
  let sujo = false;
  let salvando = false;

  const podeEditar = () => DB.podeEditarFicha();
  const ehComissao = () => DB.perfil().tipo === 'comissao';
  const nomePerfil = () => R.perfis[DB.perfil().tipo] || 'Visitante';
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const minusculaInicial = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '');

  function validosNaFaixa(faixa, exceto) {
    return DB.egressos().filter((e) => I.faixaDe(e.anoDefesa) === faixa && I.ehDestaqueValido(e) && e.id !== exceto)
      .sort((a, b) => String(a.destaque.aprovadaEm).localeCompare(String(b.destaque.aprovadaEm)));
  }
  function chipStatus(d) {
    const cls = { publicada: 'chip-verde', aprovada: 'chip-verde', enviada: 'chip-amarelo-claro', devolvida: 'chip-vermelho', rascunho: 'chip-cinza' }[d.status];
    const txt = d.status === 'aprovada' ? `Aprovada pela Comissão em ${U.fmtData(d.aprovadaEm)}`
      : d.status === 'publicada' ? `Publicada na vitrine em ${U.fmtData(d.publicadaEm)}` : R.statusFicha[d.status];
    return `<span class="chip ${cls}">${d.status === 'aprovada' || d.status === 'publicada' ? ui.icone('check') : ''}${txt}</span>`;
  }
  function destinoTexto(c) {
    if (!c) return 'Não informado';
    if (c.semVinculo) return `Sem vínculo profissional no momento · ${c.cidade}/${c.uf}.`;
    return `${c.instituicao}, ${minusculaInicial(c.cargo)}, ${minusculaInicial(c.setor)}, setor ${c.natureza === 'Pública' ? 'público' : 'privado'}, ${c.cidade}/${c.uf}${c.pais && c.pais !== 'Brasil' ? ` (${c.pais})` : ''}.`;
  }
  function consentTexto(e) {
    const c = e.cadastro;
    const t = e.termoMatricula;
    if (!c || !c.consentDivulgacao) return '<span class="chip chip-vermelho">Divulgação não autorizada</span> A ficha não pode ser aprovada nem publicada enquanto o egresso não autorizar no cadastro.';
    return `Divulgação pública autorizada (${t ? `termo de ${U.fmtMes(t.assinadoEm)}, ` : ''}confirmado em ${U.fmtMes(c.consentRevisadoEm)}).`;
  }
  const arquivamento = (e) => `${R.pasta} / Faixa_${I.faixaDe(e.anoDefesa).replace('–', '-')} / ${U.slugArquivo(e.nome)}`;

  function fichaInicial(e) {
    const c = e.cadastro;
    const q = (e.questionarios || []).filter((x) => x.completo && x.blocos && x.blocos.b3).pop();
    const b3 = (q && q.blocos.b3) || {};
    const comprovacoes = [];
    if (c.lattesId) {
      comprovacoes.push({ descricao: e.lattes && e.lattes.conferidoEm && e.lattes.atualizadoEm
        ? `Currículo Lattes (atualizado em ${U.fmtMes(e.lattes.atualizadoEm)})` : 'Currículo Lattes', arquivo: '' });
    }
    const comDoi = (e.producoes || []).filter((p) => /doi\.org/.test(p.link || ''));
    if (comDoi.length) {
      const soArtigos = comDoi.every((p) => /^Artigo/.test(p.tipo));
      comprovacoes.push({ descricao: soArtigos ? `${U.plural(comDoi.length, 'artigo', 'artigos')} (DOI)` : `${U.plural(comDoi.length, 'produção', 'produções')} com DOI`, arquivo: '' });
    }
    return {
      status: 'rascunho', formato: 'Depoimento', indicadoPor: e.orientador, atuacao: '',
      impactosTipos: (b3.impactos || []).slice(), impactosTexto: b3.impactosTexto || '', aderencia: '',
      comprovacoes, resumo: '', criadaEm: null, enviadaEm: null, aprovadaEm: null, publicadaEm: null,
      comentarioComissao: '', historico: [], origemImpactos: b3.impactosTexto ? 'questionário' : '',
    };
  }

  /* ------------------------------ visão por faixa ------------------------------ */
  function renderFaixas() {
    $('visao-faixas').innerHTML = `<div class="colunas-faixa">${R.faixas.map((f) => {
      const lista = DB.egressos().filter((e) => e.destaque && I.faixaDe(e.anoDefesa) === f)
        .sort((a, b) => ORDEM[a.destaque.status] - ORDEM[b.destaque.status] || a.nome.localeCompare(b.nome));
      const validos = lista.filter(I.ehDestaqueValido).length;
      const cheio = validos >= R.limiteDestaques;
      return `<div class="coluna-faixa">
        <h3><span>${f}</span><span class="chip ${cheio ? 'chip-verde' : 'chip-cinza'}">${validos} de ${R.limiteDestaques} validados</span></h3>
        ${lista.length ? lista.map((e) => `<a class="item-destaque ${e.id === selecionado ? 'atual' : ''}" href="?id=${e.id}" data-abrir="${e.id}">
            <span class="avatar">${U.esc(U.iniciais(e.nome))}</span>
            <span><strong>${U.esc(e.nome)}</strong><small>${R.statusFicha[e.destaque.status]}</small></span></a>`).join('')
          : '<p class="texto-apoio pequeno">Nenhuma ficha nesta faixa.</p>'}
        <button type="button" class="btn btn-secundario btn-bloco" style="margin-top:8px" data-nova="${f}" ${cheio ? 'disabled title="Limite de 5 destaques validados atingido nesta faixa"' : ''}>${ui.icone('mais')} Indicar destaque</button>
      </div>`;
    }).join('')}</div>`;
  }

  function abrirIndicacao(faixa) {
    const hoje = U.hoje();
    const candidatos = DB.egressos().filter((e) => I.faixaDe(e.anoDefesa) === faixa && e.cadastro && !e.destaque)
      .map((e) => ({ e, dm: I.criterios(e, hoje).todos, ok: !!e.cadastro.consentDivulgacao }))
      .sort((a, b) => (b.e.papel === 'rafael') - (a.e.papel === 'rafael') || (b.e.origem === 'teste') - (a.e.origem === 'teste')
        || b.ok - a.ok || b.dm - a.dm || a.e.nome.localeCompare(b.e.nome));
    const item = (c) => `
      <button type="button" class="item-login" data-candidato="${c.e.id}" ${c.ok ? '' : 'disabled'}>
        <span class="avatar">${U.esc(U.iniciais(c.e.nome))}</span>
        <span><strong>${U.esc(c.e.nome)}</strong>
          <small>${c.e.nivel === 'DO' ? 'Doutorado' : 'Mestrado'}, ${c.e.anoDefesa} · ${c.e.cadastro.semVinculo ? 'sem vínculo' : `${U.esc(c.e.cadastro.cargo)} · ${U.esc(c.e.cadastro.instituicao)}`}</small>
          <small>${c.ok ? 'divulgação autorizada' : 'sem autorização de divulgação'} · ${c.dm ? 'dados mínimos em dia' : 'dados desatualizados'}</small></span>
      </button>`;
    const montar = (filtro) => {
      const f = U.semAcento(filtro || '').toLowerCase();
      const lista = candidatos.filter((c) => !f || U.semAcento(c.e.nome).toLowerCase().includes(f)).slice(0, 30);
      return lista.length ? lista.map(item).join('') : '<p class="texto-apoio">Nenhum egresso com cadastro encontrado.</p>';
    };
    ui.modal({
      titulo: `Indicar egresso de destaque · faixa ${faixa}`,
      largura: 660,
      corpo: `<p class="texto-apoio">Só egressos que autorizaram a divulgação podem ter a ficha aprovada. Para quem está com os dados desatualizados, confirme o destino antes da aprovação.</p>
        <input class="campo" type="search" id="busca-candidato" placeholder="Buscar por nome" autocomplete="off">
        <div class="lista-login" id="lista-candidatos" style="margin-top:10px;max-height:380px;overflow:auto">${montar('')}</div>`,
      aoAbrir(el, fechar) {
        el.querySelector('#busca-candidato').addEventListener('input', (ev) => { el.querySelector('#lista-candidatos').innerHTML = montar(ev.target.value); });
        el.querySelector('#lista-candidatos').addEventListener('click', (ev) => {
          const b = ev.target.closest('[data-candidato]');
          if (!b || b.disabled) return;
          fechar();
          selecionar(b.dataset.candidato);
        });
      },
    });
  }

  function selecionar(id) {
    selecionado = id;
    sujo = false;
    const e = DB.obter(id);
    rascunho = e && e.destaque ? copia(e.destaque) : e && e.cadastro ? fichaInicial(e) : null;
    try { root.history.replaceState(null, '', `?id=${id}`); } catch (err) { /* file:// em alguns navegadores */ }
    renderFaixas();
    renderFicha();
    const alvo = $('ficha');
    if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* --------------------------------- ficha --------------------------------- */
  function campoTexto(id, valor, minimo) {
    return `<textarea class="campo" id="${id}" data-campo="${id}" style="min-height:${minimo || 70}px">${U.esc(valor)}</textarea>`;
  }
  function htmlComprovacoes(d, editavel) {
    if (!editavel) {
      return d.comprovacoes.length ? d.comprovacoes.map((c) => `${U.esc(c.descricao)}${c.arquivo ? ` <small class="texto-apoio">(${U.esc(c.arquivo)})</small>` : ''}`).join(' · ') : '—';
    }
    return `<div id="lista-comprovacoes">${d.comprovacoes.map((c, i) => `
        <div class="campo-com-botao" style="margin-bottom:6px;align-items:center">
          <input class="campo" data-comprov="${i}" value="${U.esc(c.descricao)}" aria-label="Comprovante ${i + 1}">
          <label class="btn btn-mini" title="Anexar arquivo (simulação)">${ui.icone('upload')}<input type="file" data-arquivo="${i}" hidden></label>
          <button type="button" class="btn-icone" data-remover-comprov="${i}" aria-label="Remover comprovante">${ui.icone('x')}</button>
        </div>${c.arquivo ? `<div class="msg-ajuda" style="margin:-2px 0 8px">Arquivo: ${U.esc(c.arquivo)} (o protótipo guarda só o nome do arquivo)</div>` : ''}`).join('')}</div>
      <div class="campo-com-botao">
        <input class="campo" id="novo-comprov" placeholder="Ex.: Portaria de contratação, declaração institucional, artigo com DOI">
        <button type="button" class="btn btn-secundario" data-add-comprov>Adicionar</button>
      </div>`;
  }

  function renderFicha() {
    const box = $('ficha');
    if (!selecionado) {
      box.innerHTML = `<section class="cartao vazio">${ui.icone('estrela')}<h2>Selecione uma ficha</h2>
        <p>Escolha um destaque nas colunas acima ou use <strong>Indicar destaque</strong> para abrir uma nova ficha.</p></section>`;
      return;
    }
    const e = DB.obter(selecionado);
    if (!e || !e.cadastro || !rascunho) {
      box.innerHTML = `<section class="cartao vazio">${ui.icone('alerta')}<h2>Ficha indisponível</h2>
        <p>${e ? `${U.esc(e.nome)} ainda não tem cadastro: a ficha parte dos dados de destino e atuação informados pelo egresso.` : 'Egresso não encontrado nesta base.'}</p></section>`;
      return;
    }
    const d = rascunho;
    const hoje = U.hoje();
    const faixa = I.faixaDe(e.anoDefesa);
    const c = e.cadastro;
    const editavel = podeEditar() && (d.status === 'rascunho' || d.status === 'devolvida');
    const vitrineEditavel = podeEditar() && d.status !== 'publicada' && d.status !== 'enviada';
    const validos = validosNaFaixa(faixa, null);
    const posicao = I.ehDestaqueValido(e) && e.destaque.status === d.status
      ? `Destaque ${validos.findIndex((x) => x.id === e.id) + 1} de ${R.limiteDestaques} da faixa`
      : `${validos.length} de ${R.limiteDestaques} vagas ocupadas na faixa`;
    const dm = I.criterios(e, hoje).todos;
    const palavras = U.contarPalavras(d.impactosTexto);
    const palResumo = U.contarPalavras(d.resumo);

    const botoes = [];
    if (editavel) {
      botoes.push(`<button type="button" class="btn btn-secundario" data-acao="salvar">Salvar rascunho</button>`);
      botoes.push(`<button type="button" class="btn btn-primario" data-acao="enviar">${ui.icone('seta')} Enviar à Comissão</button>`);
    }
    if (d.status === 'enviada') {
      if (ehComissao()) {
        botoes.push(`<button type="button" class="btn btn-sucesso" data-acao="aprovar">${ui.icone('check')} Aprovar ficha</button>`);
        botoes.push(`<button type="button" class="btn btn-perigo" data-acao="devolver">Devolver para ajustes</button>`);
      } else {
        botoes.push(`<span class="chip chip-amarelo-claro">${ui.icone('relogio')} Aguardando a análise da Comissão de Autoavaliação</span>`);
      }
    }
    if (d.status === 'aprovada' && podeEditar()) {
      botoes.push(`<button type="button" class="btn btn-primario" data-acao="publicar">Publicar na vitrine</button>`);
    }
    if (d.status === 'aprovada' || d.status === 'publicada') {
      botoes.push(`<button type="button" class="btn btn-secundario" data-acao="pdf">${ui.icone('imprimir')} Baixar ficha em PDF</button>`);
    }
    if (d.status === 'publicada' && podeEditar()) {
      botoes.push(`<button type="button" class="btn btn-texto" data-acao="retirar">Retirar da vitrine (pedido do egresso)</button>`);
    }
    if (editavel && e.destaque && e.destaque.status === 'rascunho') {
      botoes.push('<span class="espaco"></span><button type="button" class="btn btn-texto" data-acao="excluir">Excluir rascunho</button>');
    }

    box.innerHTML = `
      <section class="cartao">
        <div class="ficha-cab">
          <div>
            <h2>${U.esc(e.nome)}</h2>
            <div>${e.nivel === 'DO' ? 'Doutorado' : 'Mestrado'}, defesa em ${e.anoDefesa}, faixa ${faixa} · ${posicao}
              ${e.origem === 'teste' ? `<span class="chip chip-cinza">registro de teste ${U.esc(e.codigoTeste)}</span>` : ''}</div>
          </div>
          ${chipStatus(d)}
        </div>
        ${d.status === 'devolvida' && d.comentarioComissao ? `<div class="caixa-info vermelha">${ui.icone('alerta')}<span><strong>Ajustes pedidos pela Comissão:</strong> ${U.esc(d.comentarioComissao)}</span></div>` : ''}
        ${!dm ? `<div class="caixa-info amarela">${ui.icone('alerta')}<span>Os dados mínimos deste egresso não estão em dia. Confirme o destino antes da aprovação.</span></div>` : ''}
      </section>

      <section class="cartao" id="corpo-ficha">
        <table class="tabela-ficha">
          <tr><th scope="row">Trabalho de conclusão</th><td>${U.esc(e.titulo)}. Orientação: ${U.esc(e.orientador)}. Linha: ${U.esc(e.linha)}.</td></tr>
          <tr><th scope="row">Destino</th><td>${U.esc(destinoTexto(c))}<div class="texto-apoio pequeno nao-imprimir">Do cadastro do egresso, informado em ${U.fmtData(c.vinculoInformadoEm)}.</div></td></tr>
          <tr><th scope="row">Atuação</th><td>${editavel
            ? `<label class="sr" for="atuacao">Atuação</label>${campoTexto('atuacao', d.atuacao)}<div class="msg-ajuda">Como o egresso aplica a formação no trabalho atual.</div>`
            : U.esc(d.atuacao)}</td></tr>
          <tr><th scope="row">Impactos</th><td>${editavel
            ? `<div class="opcoes-linha">${R.impactos.map((t) => `<label class="checagem"><input type="checkbox" data-impacto value="${t}" ${d.impactosTipos.includes(t) ? 'checked' : ''}> ${t}</label>`).join('')}</div>
               <label class="sr" for="impactosTexto">Descrição dos impactos</label>${campoTexto('impactosTexto', d.impactosTexto, 90)}
               <div class="contador ${palavras > R.limitePalavrasImpacto ? 'excedido' : ''}" id="contador-impactos">${palavras} de ${R.limitePalavrasImpacto} palavras</div>
               ${d.origemImpactos ? '<div class="msg-ajuda">Texto inicial trazido do bloco 3 do questionário respondido pelo egresso.</div>' : ''}`
            : `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">${d.impactosTipos.map((t) => `<span class="chip">${t}</span>`).join('')}</div>${U.esc(d.impactosTexto)}
               <span class="texto-apoio pequeno">(${palavras} de ${R.limitePalavrasImpacto} palavras)</span>`}</td></tr>
          <tr><th scope="row">Aderência ao programa</th><td>${editavel ? `<label class="sr" for="aderencia">Aderência</label>${campoTexto('aderencia', d.aderencia, 60)}<div class="msg-ajuda">Relação com a missão, o perfil de egresso e as linhas do PPGTIC.</div>` : U.esc(d.aderencia)}</td></tr>
          <tr><th scope="row">Comprovação</th><td>${htmlComprovacoes(d, editavel)}</td></tr>
          <tr><th scope="row">Consentimento</th><td>${consentTexto(e)}</td></tr>
          <tr><th scope="row">Indicação</th><td>${editavel
            ? `<label class="sr" for="indicadoPor">Indicado por</label><select class="campo" id="indicadoPor" data-campo="indicadoPor" style="max-width:420px">${
              R.orientadores.map((o) => o.nome).concat(['Comissão de Autoavaliação', 'Autoindicação (história enviada pelo egresso)', 'Indicação de colega'])
                .map((o) => `<option ${o === d.indicadoPor ? 'selected' : ''}>${U.esc(o)}</option>`).join('')}</select>`
            : U.esc(d.indicadoPor)}</td></tr>
          <tr><th scope="row">Validação pela Comissão</th><td>${d.status === 'aprovada' || d.status === 'publicada' ? `Aprovada em ${U.fmtData(d.aprovadaEm)}, com comprovantes e consentimento verificados.`
            : d.status === 'enviada' ? `Enviada em ${U.fmtData(d.enviadaEm)}; aguardando análise.` : 'Ainda não enviada à Comissão.'}</td></tr>
          <tr><th scope="row">Arquivamento</th><td>${ui.icone('pasta')} Pasta ${U.esc(arquivamento(e))}</td></tr>
        </table>
      </section>
      <div id="erros-ficha"></div>
      <div class="acoes mb">${botoes.join('')}</div>

      <div class="grade-2 nao-imprimir">
        <section class="cartao">
          <h2>Card na vitrine Trajetórias PPGTIC</h2>
          ${vitrineEditavel ? `
            <div class="campos" style="grid-template-columns:1fr 2fr;margin-bottom:12px">
              <div><label class="rotulo" for="formato">Formato</label>
                <select class="campo" id="formato" data-campo="formato">${['Depoimento', 'Entrevista'].map((f) => `<option ${f === d.formato ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
              <div><label class="rotulo" for="resumo">Resumo do card <span class="opcional">(até ${R.limitePalavrasResumo} palavras)</span></label>
                <textarea class="campo" id="resumo" data-campo="resumo" style="min-height:60px">${U.esc(d.resumo)}</textarea>
                <div class="contador ${palResumo > R.limitePalavrasResumo ? 'excedido' : ''}" id="contador-resumo">${palResumo} de ${R.limitePalavrasResumo} palavras</div></div>
            </div>` : ''}
          <div class="card-vitrine" aria-label="Prévia do card">
            <div class="card-vitrine-topo">${U.esc(U.iniciais(e.nome))}</div>
            <div class="card-vitrine-corpo">
              <small>${d.publicadaEm ? U.fmtData(d.publicadaEm) : 'Data da publicação'}</small>
              <h4>${U.esc(d.formato)}: ${U.esc(e.nome)}</h4>
              <p>${U.esc(d.resumo) || '<span class="texto-apoio">O resumo aparece aqui.</span>'}</p>
              <div style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip">${faixa}</span><span class="chip">${U.esc(c.semVinculo ? 'Sem vínculo' : c.setor)}</span></div>
            </div>
          </div>
          <p class="texto-apoio pequeno" style="margin-top:10px">A vitrine só mostra trajetórias autorizadas. O egresso pode pedir a retirada a qualquer momento.</p>
        </section>
        <section class="cartao">
          <h2>Histórico da ficha</h2>
          ${d.historico.length ? `<ul class="historico">${d.historico.slice().reverse().map((h) => `<li><strong>${U.fmtDataHora(h.em)}</strong> · ${U.esc(h.acao)} <span class="texto-apoio">(${U.esc(h.perfil)})</span></li>`).join('')}</ul>`
            : '<p class="texto-apoio">Ficha nova, ainda não salva.</p>'}
        </section>
      </div>`;
  }

  /* ------------------------------ ações ------------------------------ */
  function coletar() {
    if (!rascunho) return;
    const ler = (id) => ($(id) ? $(id).value.trim() : null);
    ['atuacao', 'impactosTexto', 'aderencia', 'indicadoPor', 'formato', 'resumo'].forEach((k) => {
      const v = ler(k);
      if (v !== null) rascunho[k] = v;
    });
    const caixas = document.querySelectorAll('[data-impacto]');
    if (caixas.length) rascunho.impactosTipos = [...caixas].filter((x) => x.checked).map((x) => x.value);
    document.querySelectorAll('[data-comprov]').forEach((inp) => {
      const i = +inp.dataset.comprov;
      if (rascunho.comprovacoes[i]) rascunho.comprovacoes[i].descricao = inp.value.trim();
    });
    rascunho.comprovacoes = rascunho.comprovacoes.filter((c) => c.descricao);
  }

  function validar(para) {
    const e = DB.obter(selecionado);
    const d = rascunho;
    const p = [];
    if (para === 'enviar' || para === 'aprovar') {
      if (d.atuacao.length < 20) p.push('Descreva a atuação (pelo menos 20 caracteres).');
      if (!d.impactosTipos.length) p.push('Marque ao menos um tipo de impacto.');
      const n = U.contarPalavras(d.impactosTexto);
      if (!n) p.push('Descreva os impactos.');
      if (n > R.limitePalavrasImpacto) p.push(`A descrição dos impactos tem ${n} palavras; o limite é ${R.limitePalavrasImpacto}.`);
      if (d.aderencia.length < 20) p.push('Explique a aderência ao programa (pelo menos 20 caracteres).');
      if (!d.comprovacoes.length) p.push('Inclua ao menos um comprovante.');
    }
    if (para === 'aprovar' || para === 'publicar') {
      if (!e.cadastro.consentDivulgacao) p.push('O egresso não autorizou a divulgação no cadastro.');
    }
    if (para === 'aprovar') {
      const ocupadas = validosNaFaixa(I.faixaDe(e.anoDefesa), e.id).length;
      if (ocupadas >= R.limiteDestaques) p.push(`A faixa ${I.faixaDe(e.anoDefesa)} já tem ${R.limiteDestaques} destaques validados (limite do subitem 2.2.2).`);
    }
    if (para === 'publicar') {
      const n = U.contarPalavras(d.resumo);
      if (!n) p.push('Escreva o resumo do card da vitrine.');
      if (n > R.limitePalavrasResumo) p.push(`O resumo tem ${n} palavras; o limite é ${R.limitePalavrasResumo}.`);
    }
    $('erros-ficha').innerHTML = p.length
      ? `<div class="caixa-info vermelha mb" role="alert">${ui.icone('alerta')}<span><strong>Antes de continuar:</strong><br>${p.map(U.esc).join('<br>')}</span></div>` : '';
    if (p.length) $('erros-ficha').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return !p.length;
  }

  function gravar(acao, mudancas) {
    salvando = true;
    const agora = U.agora();
    Object.assign(rascunho, mudancas || {});
    if (!rascunho.criadaEm) rascunho.criadaEm = U.iso(U.hoje());
    if (acao) rascunho.historico.push({ em: agora, acao, perfil: nomePerfil() });
    DB.alterar(selecionado, (x) => { x.destaque = copia(rascunho); });
    sujo = false;
    salvando = false;
    renderFaixas();
    renderFicha();
  }

  async function executar(acao) {
    coletar();
    const e = DB.obter(selecionado);
    const hoje = U.iso(U.hoje());
    if (acao === 'salvar') { gravar(e.destaque ? 'Rascunho atualizado' : `Ficha criada (indicação: ${rascunho.indicadoPor})`); ui.toast('Rascunho salvo.', 'sucesso'); return; }
    if (acao === 'enviar') {
      if (!validar('enviar')) return;
      if (!e.destaque) rascunho.historico.push({ em: U.agora(), acao: `Ficha criada (indicação: ${rascunho.indicadoPor})`, perfil: nomePerfil() });
      gravar('Enviada à Comissão', { status: 'enviada', enviadaEm: hoje, comentarioComissao: '' });
      ui.toast('Ficha enviada à Comissão de Autoavaliação.', 'sucesso');
      return;
    }
    if (acao === 'aprovar') {
      if (!validar('aprovar')) return;
      gravar('Aprovada pela Comissão', { status: 'aprovada', aprovadaEm: hoje });
      const n = validosNaFaixa(I.faixaDe(e.anoDefesa), null).length;
      ui.toast(`Ficha aprovada: ${n} de ${R.limiteDestaques} destaques validados na faixa ${I.faixaDe(e.anoDefesa)}. Comprovantes arquivados em ${R.pasta}.`, 'sucesso');
      return;
    }
    if (acao === 'devolver') {
      ui.modal({
        titulo: 'Devolver para ajustes',
        largura: 520,
        corpo: '<label class="rotulo" for="comentario-comissao">O que precisa ser ajustado?</label><textarea class="campo" id="comentario-comissao" autofocus></textarea><div id="erro-comentario"></div>',
        acoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Devolver', classe: 'btn-perigo', aoClicar: (el) => {
          const t = el.querySelector('#comentario-comissao').value.trim();
          if (t.length < 5) { el.querySelector('#erro-comentario').innerHTML = `<div class="msg-erro">${ui.icone('alerta')}<span>Descreva o ajuste necessário.</span></div>`; return false; }
          gravar('Devolvida para ajustes', { status: 'devolvida', comentarioComissao: t });
          ui.toast('Ficha devolvida para ajustes.', 'info');
          return true;
        } }],
      });
      return;
    }
    if (acao === 'publicar') {
      if (!validar('publicar')) return;
      gravar('Publicada na vitrine Trajetórias PPGTIC', { status: 'publicada', publicadaEm: hoje });
      ui.toast('Card publicado na vitrine (simulação). A divulgação nas redes do PPGTIC é aprovada pela Coordenação.', 'sucesso');
      return;
    }
    if (acao === 'retirar') {
      const ok = await ui.confirmar('Retirar o card da vitrine? A ficha continua aprovada para o relatório da CAPES.', 'Retirar da vitrine', 'btn-perigo');
      if (ok) { gravar('Retirada da vitrine a pedido do egresso', { status: 'aprovada', publicadaEm: null }); ui.toast('Card retirado da vitrine.', 'info'); }
      return;
    }
    if (acao === 'excluir') {
      const ok = await ui.confirmar('Excluir este rascunho de ficha?', 'Excluir', 'btn-perigo');
      if (ok) {
        salvando = true;
        DB.alterar(selecionado, (x) => { x.destaque = null; });
        salvando = false;
        rascunho = fichaInicial(DB.obter(selecionado));
        renderFaixas();
        renderFicha();
        ui.toast('Rascunho excluído.', 'info');
      }
      return;
    }
    if (acao === 'pdf') {
      ui.toast('Na janela de impressão, escolha "Salvar como PDF".', 'info');
      setTimeout(() => root.print(), 300);
    }
  }

  /* ------------------------------ exemplo ------------------------------ */
  Obs.tela.preencherExemplo = function () {
    if (!podeEditar()) { ui.toast('Entre como Comissão de Autoavaliação ou Responsável Temático para editar fichas.', 'info'); return; }
    const raf = DB.rafael();
    if (!selecionado && raf && raf.cadastro) selecionar(raf.id);
    if (!rascunho || !['rascunho', 'devolvida'].includes(rascunho.status)) { ui.toast('Abra uma ficha em rascunho para preencher.', 'info'); return; }
    const e = DB.obter(selecionado);
    const rafael = e.papel === 'rafael';
    Object.assign(rascunho, rafael ? {
      atuacao: 'Leciona programação nos cursos técnicos e superiores e aplica a metodologia de gamificação desenvolvida na dissertação. Cursa doutorado desde 2026.',
      impactosTipos: ['Acadêmico', 'Profissional', 'Social'],
      impactosTexto: 'A metodologia foi adotada em 6 escolas da rede estadual, alcançando cerca de 900 estudantes. Publicou 2 artigos com a orientadora. Passou da educação básica para o ensino superior um ano após a titulação.',
      aderencia: 'Une tecnologia e educação, em linha com a missão interdisciplinar do PPGTIC e com o perfil de egresso que atua na transformação de práticas educacionais.',
      indicadoPor: e.orientador,
      formato: 'Depoimento',
      resumo: 'Da sala de aula da rede estadual ao Instituto Federal: a gamificação criada no mestrado chegou a seis escolas.',
    } : {
      atuacao: rascunho.atuacao || `Atua como ${minusculaInicial(e.cadastro.cargo || 'profissional')} e aplica no trabalho os métodos desenvolvidos na pesquisa de mestrado.`,
      impactosTipos: rascunho.impactosTipos.length ? rascunho.impactosTipos : ['Profissional'],
      impactosTexto: rascunho.impactosTexto || 'Aplicou os resultados da pesquisa na instituição em que atua, com melhoria documentada nos processos da equipe.',
      aderencia: rascunho.aderencia || 'Trajetória alinhada à linha de pesquisa e ao caráter interdisciplinar do PPGTIC.',
      resumo: rascunho.resumo || `Como a pesquisa no PPGTIC chegou ao dia a dia de ${U.primeiroNome(e.nome)}.`,
    });
    const desc = rascunho.comprovacoes.map((c) => c.descricao);
    const extras = rafael
      ? ['Portaria de contratação do IFSC', 'Declaração da Secretaria de Educação sobre as escolas atendidas']
      : ['Declaração institucional'];
    extras.filter(Boolean).forEach((x) => { if (!desc.some((d) => d.toLowerCase() === x.toLowerCase())) rascunho.comprovacoes.push({ descricao: x, arquivo: '' }); });
    sujo = true;
    renderFicha();
    ui.toast('Ficha preenchida com o exemplo do EX08. Revise e envie à Comissão.', 'info');
  };

  /* ------------------------------ eventos ------------------------------ */
  function ligarEventos() {
    document.addEventListener('click', (ev) => {
      const t = ev.target;
      const abrir = t.closest('[data-abrir]');
      if (abrir) { ev.preventDefault(); selecionar(abrir.dataset.abrir); return; }
      const nova = t.closest('[data-nova]');
      if (nova && !nova.disabled) { abrirIndicacao(nova.dataset.nova); return; }
      const acao = t.closest('#ficha [data-acao]');
      if (acao) { executar(acao.dataset.acao); return; }
      if (t.closest('[data-add-comprov]')) {
        coletar();
        const v = $('novo-comprov').value.trim();
        if (v) { rascunho.comprovacoes.push({ descricao: v, arquivo: '' }); sujo = true; renderFicha(); }
        return;
      }
      const rem = t.closest('[data-remover-comprov]');
      if (rem) { coletar(); rascunho.comprovacoes.splice(+rem.dataset.removerComprov, 1); sujo = true; renderFicha(); return; }
      const perfil = t.closest('[data-entrar]');
      if (perfil) { ui.entrarComo({ tipo: perfil.dataset.entrar }); }
    });
    document.addEventListener('input', (ev) => {
      if (!ev.target.closest('#ficha')) return;
      sujo = true;
      if (ev.target.id === 'impactosTexto') {
        const n = U.contarPalavras(ev.target.value);
        const el = $('contador-impactos');
        el.textContent = `${n} de ${R.limitePalavrasImpacto} palavras`;
        el.classList.toggle('excedido', n > R.limitePalavrasImpacto);
      }
      if (ev.target.id === 'resumo') {
        const n = U.contarPalavras(ev.target.value);
        const el = $('contador-resumo');
        el.textContent = `${n} de ${R.limitePalavrasResumo} palavras`;
        el.classList.toggle('excedido', n > R.limitePalavrasResumo);
        coletar();
        const card = document.querySelector('.card-vitrine-corpo p');
        if (card) card.textContent = rascunho.resumo || 'O resumo aparece aqui.';
      }
    });
    document.addEventListener('change', (ev) => {
      const arq = ev.target.closest('[data-arquivo]');
      if (arq && arq.files.length) {
        coletar();
        rascunho.comprovacoes[+arq.dataset.arquivo].arquivo = arq.files[0].name;
        sujo = true;
        renderFicha();
        return;
      }
      if (ev.target.id === 'formato') { coletar(); renderFicha(); }
    });
  }

  function render() {
    if (!podeEditar()) {
      ui.faixaRestrita(`${ui.icone('cadeado')} Área restrita: Comissão de Autoavaliação e Responsável Temático.`, 'restrita');
      $('bloqueio').innerHTML = `<section class="cartao vazio">${ui.icone('cadeado')}<h2>Área restrita</h2>
        <p>As fichas de destaque contêm dados individuais e comprovantes. Só a Comissão de Autoavaliação e o Responsável Temático têm acesso. Neste protótipo, o acesso é simulado.</p>
        <div class="acoes"><button type="button" class="btn btn-primario" data-entrar="comissao">Entrar como Comissão de Autoavaliação</button>
        <button type="button" class="btn btn-secundario" data-entrar="rt">Entrar como Responsável Temático</button></div></section>`;
      $('visao-faixas').innerHTML = '';
      $('ficha').innerHTML = '';
      return;
    }
    ui.faixaRestrita(`${ui.icone('cadeado')} Área restrita: Comissão de Autoavaliação e Responsável Temático. Perfil atual: <strong>${nomePerfil()}</strong>.`, 'restrita');
    $('bloqueio').innerHTML = '';
    if (selecionado && !rascunho) {
      const e = DB.obter(selecionado);
      rascunho = e && e.destaque ? copia(e.destaque) : e && e.cadastro ? fichaInicial(e) : null;
    }
    renderFaixas();
    renderFicha();
  }
  function aoMudar(tipo) {
    if (salvando) return;
    if (tipo === 'perfil') { render(); return; }
    renderFaixas();
    if (!sujo && selecionado) {
      const e = DB.obter(selecionado);
      if (e && e.destaque) rascunho = copia(e.destaque);
      renderFicha();
    }
  }

  ligarEventos();
  ui.iniciar({ tela: 'ficha', render, aoMudar });
})(window);

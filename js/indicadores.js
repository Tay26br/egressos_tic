/* =====================================================================
   indicadores.js — cálculo dos indicadores da matriz (Quadro 5 do EX08).
   Funções puras: recebem a lista de egressos e devolvem os números.
   Definição operacional de "dados mínimos atualizados" (seção 4.3):
   e-mail confirmado + vínculo informado nos últimos 12 meses +
   Currículo Lattes atualizado nos últimos 12 meses (data conferida).
   ===================================================================== */
(function (root) {
  'use strict';
  const Obs = root.Obs;
  const U = Obs.U;
  const R = Obs.REF;
  const I = {};
  const DIAS_12_MESES = 365;

  I.faixaDe = function (ano) {
    ano = Number(ano);
    if (!ano) return null;
    if (ano >= 2024 && ano <= 2028) return '2024–2028';
    if (ano >= 2019 && ano <= 2023) return '2019–2023';
    if (ano >= 2014 && ano <= 2018) return '2014–2018';
    return null;
  };

  I.metaDoAno = function (ano) {
    if (R.metas[ano] != null) return R.metas[ano];
    return ano < 2026 ? R.metas[2026] : R.metas[2028];
  };

  I.dentroDe12Meses = (data, hoje) => {
    const d = U.diasEntre(data, hoje);
    return d != null && d <= DIAS_12_MESES;
  };

  // Os três critérios de "dados mínimos atualizados"
  I.criterios = function (e, hoje) {
    const c = e.cadastro;
    const l = e.lattes;
    const email = !!(c && c.emailConfirmadoEm);
    const vinculo = !!(c && c.vinculoInformadoEm && I.dentroDe12Meses(c.vinculoInformadoEm, hoje));
    const lattes = !!(l && l.conferidoEm && l.atualizadoEm && I.dentroDe12Meses(l.atualizadoEm, hoje));
    return { email, vinculo, lattes, todos: email && vinculo && lattes };
  };

  // Situação do Lattes, do ponto de vista da Secretaria
  I.situacaoLattes = function (e, hoje) {
    const c = e.cadastro;
    if (!c || !c.lattesId) return { codigo: 'sem-id', texto: 'ID Lattes não informado' };
    const l = e.lattes;
    if (!l || !l.conferidoEm) return { codigo: 'nao-conferido', texto: 'Aguardando conferência da Secretaria' };
    if (!I.dentroDe12Meses(l.atualizadoEm, hoje)) {
      return { codigo: 'desatualizado', texto: `Lattes atualizado em ${U.fmtMes(l.atualizadoEm)} (mais de 12 meses)` };
    }
    return { codigo: 'ok', texto: `Atualizado em ${U.fmtMes(l.atualizadoEm)}, conferido em ${U.fmtData(l.conferidoEm)}` };
  };

  I.cicloDoQuestionario = function (anoDefesa, anoAtual) {
    const d = anoAtual - anoDefesa;
    if (d === 1) return '1 ano';
    if (d === 3) return '3 anos';
    if (d === 5) return '5 anos';
    return anoDefesa <= 2023 ? 'Resgate' : 'Atualização';
  };
  I.rotuloCiclo = function (ciclo) {
    return {
      '1 ano': '1 ano após a defesa',
      '3 anos': '3 anos após a defesa',
      '5 anos': '5 anos após a defesa',
      Resgate: 'campanha de resgate',
      'Atualização': 'atualização voluntária',
    }[ciclo] || ciclo;
  };

  // Último questionário com os blocos 1 e 2 completos nos últimos 12 meses
  I.respostaRecente = function (e, hoje) {
    const qs = (e.questionarios || []).filter((q) => q.completo && q.respondidoEm && I.dentroDe12Meses(q.respondidoEm, hoje));
    if (!qs.length) return null;
    return qs.sort((a, b) => String(b.respondidoEm).localeCompare(String(a.respondidoEm)))[0];
  };

  I.ehDestaqueValido = (e) => !!(e.destaque && (e.destaque.status === 'aprovada' || e.destaque.status === 'publicada'));

  I.capturadoNaDefesa = function (e) {
    if (!e.cadastro || !e.cadastro.criadoEm) return false;
    const criado = U.parse(e.cadastro.criadoEm);
    const inicio = U.parse(`${e.anoDefesa}-01-01`);
    const limite = U.addDias(U.parse(`${e.anoDefesa}-12-31`), 90); // depósito final da versão definitiva
    return criado >= inicio && criado <= limite;
  };

  const ehDoutoradoOuPPG = (c) => ['Doutorado em andamento', 'Doutorado concluído', 'Pós-doutorado em andamento'].includes(c.posGrad) || !!c.atuaPPG;
  const ehDocenteOuPPG = (c) => (c.docente && c.docente !== 'Não') || !!c.atuaPPG;

  /**
   * Calcula todos os indicadores.
   * opcoes: { hoje: Date, faixa: 'todas' | '2024–2028' | ..., origem: 'todas' | 'base' | 'teste' | 'coleta' }
   */
  I.calcular = function (egressos, opcoes) {
    const op = Object.assign({ faixa: 'todas', origem: 'todas' }, opcoes || {});
    const hoje = op.hoje || U.hoje();
    const ano = hoje.getFullYear();

    let universo = egressos.filter((e) => I.faixaDe(e.anoDefesa) && e.anoDefesa <= ano);
    if (op.origem === 'base') universo = universo.filter((e) => e.origem === 'base');
    if (op.origem === 'teste') universo = universo.filter((e) => e.origem === 'teste');
    if (op.origem === 'coleta') universo = universo.filter((e) => e.origem === 'coleta');
    const pop = op.faixa === 'todas' ? universo : universo.filter((e) => I.faixaDe(e.anoDefesa) === op.faixa);

    const crit = new Map(pop.map((e) => [e.id, I.criterios(e, hoje)]));
    const dm = pop.filter((e) => crit.get(e.id).todos);

    // 1. dados mínimos atualizados × meta do ano
    const meta = I.metaDoAno(ano);
    const necessarios = Math.ceil((meta / 100) * pop.length);
    const dadosMinimos = {
      n: dm.length,
      titulados: pop.length,
      pct: U.pct(dm.length, pop.length),
      meta,
      anoMeta: ano,
      faltam: Math.max(0, necessarios - dm.length),
      criterios: {
        email: pop.filter((e) => crit.get(e.id).email).length,
        vinculo: pop.filter((e) => crit.get(e.id).vinculo).length,
        lattes: pop.filter((e) => crit.get(e.id).lattes).length,
      },
      cadastrados: pop.filter((e) => e.cadastro).length,
    };

    // 2. cobertura por faixa + 11. destaques por faixa (sempre as três faixas)
    const faixas = R.faixas.map((f) => {
      const pf = universo.filter((e) => I.faixaDe(e.anoDefesa) === f);
      const n = pf.filter((e) => I.criterios(e, hoje).todos).length;
      return {
        faixa: f,
        titulados: pf.length,
        dm: n,
        pct: U.pct(n, pf.length),
        destaques: pf.filter(I.ehDestaqueValido).length,
        destaquesPublicados: pf.filter((e) => e.destaque && e.destaque.status === 'publicada').length,
        fichasEmAnalise: pf.filter((e) => e.destaque && e.destaque.status === 'enviada').length,
      };
    });

    // 3. inserção profissional (base: egressos com dados atualizados)
    const setorDe = (e) => (e.cadastro.semVinculo ? 'Sem vínculo' : e.cadastro.setor || 'Não informado');
    const naturezaDe = (e) => (e.cadastro.semVinculo ? 'Sem vínculo' : e.cadastro.natureza || 'Não informado');
    const comVinculo = dm.filter((e) => !e.cadastro.semVinculo);
    const insercao = {
      base: dm.length,
      comVinculo: comVinculo.length,
      pct: U.pct(comVinculo.length, dm.length),
      porSetor: R.setores.concat(['Sem vínculo']).map((s) => {
        const n = dm.filter((e) => setorDe(e) === s).length;
        return { rotulo: s, n, pct: U.pct(n, dm.length) };
      }),
      porNatureza: ['Pública', 'Privada', 'Sem vínculo'].map((s) => {
        const n = dm.filter((e) => naturezaDe(e) === s).length;
        return { rotulo: s, n, pct: U.pct(n, dm.length) };
      }),
    };

    // 4. permanência: tempo médio no vínculo atual
    const tempo = (e) => (e.cadastro.inicioVinculo ? U.anosEntre(`${e.cadastro.inicioVinculo}-01`, hoje) : null);
    const tempos = comVinculo.map(tempo).filter((t) => t != null && t >= 0);
    const permanencia = {
      media: U.media(tempos),
      n: tempos.length,
      porFaixa: R.faixas.map((f) => {
        const t = comVinculo.filter((e) => I.faixaDe(e.anoDefesa) === f).map(tempo).filter((x) => x != null && x >= 0);
        return { faixa: f, media: U.media(t), n: t.length };
      }),
    };

    // 5 e 6. mobilidade e atuação relacionada (base: respondentes nos últimos 12 meses)
    const respostas = pop.map((e) => I.respostaRecente(e, hoje)).filter(Boolean);
    const idsMob = R.mudancas.filter((m) => m.mobilidade).map((m) => m.id);
    const mobilidade = {
      respondentes: respostas.length,
      n: respostas.filter((q) => ((q.blocos.b1 && q.blocos.b1.mudancas) || []).some((m) => idsMob.includes(m))).length,
    };
    mobilidade.pct = U.pct(mobilidade.n, mobilidade.respondentes);
    const relacionada = {
      respondentes: respostas.length,
      n: respostas.filter((q) => q.blocos.b2 && Number(q.blocos.b2.relacao) >= 4).length,
    };
    relacionada.pct = U.pct(relacionada.n, relacionada.respondentes);
    const importancia = R.itensImportancia.map((it) => {
      const vals = respostas.map((q) => q.blocos.b2 && q.blocos.b2.importancia && q.blocos.b2.importancia[it.id]).filter((v) => v != null);
      const muitoOuDecisiva = vals.filter((v) => v >= 3).length;
      return { id: it.id, rotulo: it.rotulo, n: vals.length, pctMuitoOuDecisiva: U.pct(muitoOuDecisiva, vals.length) };
    });

    // Avaliação do programa (bloco 4) para a autoavaliação (dimensão D5)
    const chave = (t) => U.semAcento(String(t || '')).toLowerCase().trim()
      .replace(/[.;!]+$/, '').replace(/^(uma|um|a|o|as|os|mais)\s+/, '');
    const agrupar = (lista) => {
      const m = {};
      lista.filter((t) => t && String(t).trim()).forEach((t) => {
        const k = chave(t);
        if (!m[k]) {
          const limpo = String(t).trim().replace(/[.;]+$/, '').replace(/^(uma|um|a|o|as|os)\s+/i, '');
          m[k] = { texto: limpo.charAt(0).toUpperCase() + limpo.slice(1), n: 0 };
        }
        m[k].n++;
      });
      return Object.values(m).sort((a, b) => b.n - a.n || a.texto.localeCompare(b.texto));
    };
    const comB4 = respostas.filter((q) => q.blocos.b4);
    const avaliacao = {
      respondentes: comB4.length,
      manter: agrupar(comB4.map((q) => q.blocos.b4.manter)),
      mudar: agrupar(comB4.map((q) => q.blocos.b4.mudar)),
      incluir: agrupar(comB4.map((q) => q.blocos.b4.incluir)),
      disponibilidade: R.disponibilidade.map((d) => ({ id: d.id, rotulo: d.rotulo,
        n: comB4.filter((q) => (q.blocos.b4.disponibilidade || []).includes(d.id)).length })),
    };

    // 7. docência e atuação em PPG + complementar (doutorado/pós-doc ou PPG)
    const docencia = { base: dm.length, n: dm.filter((e) => ehDocenteOuPPG(e.cadastro)).length };
    docencia.pct = U.pct(docencia.n, docencia.base);
    const continuidade = { base: dm.length, n: dm.filter((e) => ehDoutoradoOuPPG(e.cadastro)).length };
    continuidade.pct = U.pct(continuidade.n, continuidade.base);

    // 8. egressos autores (até 5 anos de titulação)
    const ate5 = pop.filter((e) => ano - e.anoDefesa <= 5);
    const autores = { base: ate5.length, n: ate5.filter((e) => (e.producoes || []).length > 0).length };
    autores.pct = U.pct(autores.n, autores.base);

    // 9. captura na defesa (defesas a partir de 2026, início proposto da captura)
    const defesas = pop.filter((e) => e.anoDefesa >= 2026);
    const captura = { base: defesas.length, n: defesas.filter(I.capturadoNaDefesa).length };
    captura.pct = U.pct(captura.n, captura.base);

    // 10. taxa de resposta (convites enviados nos últimos 12 meses)
    let enviados = 0;
    let completos = 0;
    pop.forEach((e) => (e.questionarios || []).forEach((q) => {
      if (q.enviadoEm && I.dentroDe12Meses(q.enviadoEm, hoje)) {
        enviados++;
        if (q.completo) completos++;
      }
    }));
    const resposta = { enviados, completos, pct: U.pct(completos, enviados), meta: 50 };

    // Principais UFs (base: egressos com dados atualizados)
    const contUF = {};
    dm.forEach((e) => {
      const uf = e.cadastro.uf === 'Exterior' || (e.cadastro.pais && e.cadastro.pais !== 'Brasil') ? 'Exterior' : e.cadastro.uf || '—';
      contUF[uf] = (contUF[uf] || 0) + 1;
    });
    const ufsOrdenadas = Object.keys(contUF).map((uf) => ({ uf, n: contUF[uf] })).sort((a, b) => b.n - a.n);
    const principais = ufsOrdenadas.slice(0, 3);
    const outras = ufsOrdenadas.slice(3).reduce((s, x) => s + x.n, 0);
    const ufs = principais.map((x) => ({ rotulo: x.uf, n: x.n, pct: U.pct(x.n, dm.length) }));
    if (outras) ufs.push({ rotulo: 'outras', n: outras, pct: U.pct(outras, dm.length) });

    // Pendências por orientador: sem atualização há mais de 12 meses ou sem cadastro
    const pendentes = pop.filter((e) => !crit.get(e.id).vinculo);
    const porOrientador = {};
    pendentes.forEach((e) => {
      const o = e.orientador || 'Não informado';
      if (!porOrientador[o]) porOrientador[o] = { orientador: o, n: 0, porFaixa: {}, egressos: [] };
      const p = porOrientador[o];
      p.n++;
      const f = I.faixaDe(e.anoDefesa);
      p.porFaixa[f] = (p.porFaixa[f] || 0) + 1;
      p.egressos.push(e);
    });
    const ordemFaixas = ['2014–2018', '2019–2023', '2024–2028'];
    const pendencias = Object.values(porOrientador).map((p) => {
      let faixaMais = null;
      ordemFaixas.forEach((f) => { if ((p.porFaixa[f] || 0) > (p.porFaixa[faixaMais] || 0)) faixaMais = f; });
      p.faixaMais = faixaMais;
      return p;
    }).sort((a, b) => b.n - a.n || a.orientador.localeCompare(b.orientador));

    // Validações pendentes (Secretaria): vínculo em dia, mas falta e-mail ou Lattes
    const validacoes = pop.filter((e) => {
      const c = crit.get(e.id);
      return c.vinculo && !(c.email && c.lattes);
    }).map((e) => ({ e, c: crit.get(e.id), lattes: I.situacaoLattes(e, hoje) }));

    return {
      hoje, filtros: { faixa: op.faixa, origem: op.origem },
      dadosMinimos, faixas, insercao, permanencia, mobilidade, relacionada, importancia,
      docencia, continuidade, autores, captura, resposta, ufs, pendencias, validacoes, avaliacao,
      totalPendentes: pendentes.length,
      contagem: {
        base: pop.filter((e) => e.origem === 'base').length,
        teste: pop.filter((e) => e.origem === 'teste').length,
        coleta: pop.filter((e) => e.origem === 'coleta').length,
      },
    };
  };

  Obs.Ind = I;
})(typeof window !== 'undefined' ? window : globalThis);

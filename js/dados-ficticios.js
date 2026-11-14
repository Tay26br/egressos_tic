/* =====================================================================
   dados-ficticios.js — gera a base FICTÍCIA de 212 titulados (2016–2026).
   A geração é determinística (mesma semente → mesmos dados em qualquer
   computador) e as datas operacionais são relativas ao dia em que a base
   é criada, para que os indicadores não "envelheçam" na apresentação.

   Calibragem: a base representa a situação ANTES do roteiro do egresso
   fictício Rafael Costa Lima (seção 5 do EX08). Ao final do roteiro, o
   painel chega aos números modelados na Figura 3 da V1:
   123 de 212 com dados mínimos (58%), faixas 71% / 60% / 46%, destaques
   2/3/1 e pendências 9/7/5 nos três primeiros orientadores.
   ===================================================================== */
(function (root) {
  'use strict';
  const Obs = root.Obs;
  const U = Obs.U;
  const R = Obs.REF;

  const NOMES_F = ['Ana', 'Beatriz', 'Camila', 'Carolina', 'Daniela', 'Débora', 'Eduarda', 'Elisa', 'Fernanda',
    'Gabriela', 'Helena', 'Isabela', 'Jéssica', 'Larissa', 'Letícia', 'Luana', 'Luciana', 'Mariana', 'Natália',
    'Patrícia', 'Priscila', 'Raquel', 'Renata', 'Sabrina', 'Simone', 'Tatiane', 'Vanessa', 'Viviane', 'Bruna',
    'Cíntia', 'Franciele', 'Graziela', 'Jaqueline', 'Karine', 'Michele', 'Paula', 'Rosana', 'Silvana', 'Talita',
    'Vera', 'Clarice', 'Sônia', 'Lívia', 'Manuela', 'Joana', 'Cristina', 'Andressa', 'Morgana'];
  const NOMES_M = ['André', 'Bruno', 'Carlos', 'Daniel', 'Diego', 'Eduardo', 'Fábio', 'Gabriel', 'Guilherme',
    'Gustavo', 'Henrique', 'Igor', 'João', 'Jonas', 'Leandro', 'Leonardo', 'Lucas', 'Luís', 'Marcelo', 'Márcio',
    'Mateus', 'Maurício', 'Murilo', 'Otávio', 'Pedro', 'Ricardo', 'Rodrigo', 'Samuel', 'Sérgio', 'Thiago',
    'Vinícius', 'Wagner', 'Alexandre', 'Cristiano', 'Douglas', 'Everton', 'Jean', 'Rogério', 'Volnei', 'Hugo',
    'Renan', 'Caio', 'Fernando', 'Alan', 'Gilberto', 'Roberto', 'Paulo', 'Tiago'];
  const SOBRENOMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento',
    'Lima', 'Araújo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Alves', 'Monteiro', 'Mendes',
    'Barros', 'Freitas', 'Barbosa', 'Pinto', 'Moura', 'Dias', 'Castro', 'Campos', 'Cardoso', 'Teixeira', 'Vieira',
    'Machado', 'Nunes', 'Medeiros', 'Fontana', 'Bitencourt', 'Zanette', 'Búrigo', 'De Luca', 'Colombo', 'Rosso',
    'Dal Pont', 'Scotti', 'Back', 'Hoffmann', 'Schmidt', 'Bernardo', 'Dagostin', 'Coral', 'Mattei', 'Cechinel',
    'Minatto', 'Pavei', 'Zilli', 'Bez Batti', 'Fabris'];

  const TITULOS = {
    'Tecnologia Educacional': [
      'Gamificação no ensino de {disc} na educação básica',
      'Realidade aumentada como recurso didático no ensino de {disc}',
      'Formação docente para o uso de tecnologias digitais na rede pública de {cid}',
      'Laboratórios remotos no ensino de {disc} no ensino médio',
      'Pensamento computacional nos anos iniciais do ensino fundamental',
      'Objetos de aprendizagem acessíveis para estudantes com deficiência visual',
      'Metodologias ativas mediadas por tecnologia no ensino técnico',
      'Robótica educacional como estratégia de ensino de {disc}',
      'Ambientes virtuais de aprendizagem na educação de jovens e adultos',
      'Letramento digital de professores da rede municipal de {cid}',
      'Jogos digitais no ensino de {disc}: um estudo em escolas do sul catarinense',
      'Avaliação de plataformas adaptativas no ensino de {disc}',
    ],
    'Tecnologia, Gestão e Inovação': [
      'Gestão do conhecimento em {org}',
      'Modelo de governança de TI para prefeituras de pequeno porte',
      'Transformação digital em {org}: um estudo de caso',
      'Indicadores de inovação em empresas de base tecnológica do sul catarinense',
      'Ecossistema de inovação regional: o caso de {cid}',
      'Adoção de computação em nuvem por pequenas empresas',
      'Gestão ágil de projetos em órgãos públicos',
      'Mapeamento de processos em {org} com BPMN',
      'Dados abertos governamentais e transparência municipal em {cid}',
      'Inovação aberta em cooperativas do sul catarinense',
      'Maturidade em gestão de projetos em {org}',
    ],
    'Tecnologia Computacional': [
      'Aprendizado de máquina para {app}',
      'Internet das coisas aplicada a {app}',
      'Blockchain para rastreabilidade na cadeia produtiva de {setor}',
      'Visão computacional na {app}',
      'Processamento de linguagem natural para {app}',
      'Sistema de recomendação para {ctx}',
      'Segurança da informação em {ctx}',
      'Algoritmos genéticos para otimização de rotas de {setor}',
      'Mineração de dados educacionais para prever a evasão em {ctx}',
      'Redes de sensores sem fio para monitoramento de {app2}',
    ],
  };
  const PREENCHE = {
    disc: ['programação', 'matemática', 'física', 'química', 'biologia', 'geografia', 'língua portuguesa', 'ciências'],
    cid: ['Araranguá', 'Criciúma', 'Tubarão', 'Sombrio', 'Içara', 'Turvo', 'Forquilhinha', 'Laguna'],
    org: ['uma cooperativa de crédito', 'uma prefeitura do sul catarinense', 'uma indústria cerâmica',
      'um hospital regional', 'uma instituição federal de ensino', 'pequenas empresas de software'],
    app: ['classificação de imagens agrícolas', 'detecção de fraudes em transações', 'análise de sentimentos em redes sociais',
      'previsão de demanda de energia', 'triagem de exames médicos', 'inspeção de revestimentos cerâmicos'],
    app2: ['qualidade da água', 'lavouras de arroz', 'estufas agrícolas', 'consumo de energia'],
    setor: ['arroz', 'mel', 'leite', 'resíduos sólidos', 'transporte escolar'],
    ctx: ['cursos superiores a distância', 'bibliotecas universitárias', 'pequenas empresas',
      'redes de ensino municipais', 'serviços públicos digitais'],
  };

  const CIDADES = {
    SC: ['Araranguá', 'Araranguá', 'Araranguá', 'Araranguá', 'Araranguá', 'Criciúma', 'Criciúma', 'Criciúma',
      'Criciúma', 'Florianópolis', 'Florianópolis', 'Florianópolis', 'Tubarão', 'Tubarão', 'Içara', 'Içara',
      'Sombrio', 'Sombrio', 'Balneário Arroio do Silva', 'Turvo', 'Laguna', 'Joinville', 'Blumenau',
      'Forquilhinha', 'Maracajá', 'Jacinto Machado'],
    RS: ['Torres', 'Torres', 'Porto Alegre', 'Porto Alegre', 'Capão da Canoa', 'Caxias do Sul', 'Santa Maria'],
    PR: ['Curitiba', 'Curitiba', 'Londrina', 'Maringá'],
    SP: ['São Paulo', 'Campinas'],
    RJ: ['Rio de Janeiro'],
    MG: ['Belo Horizonte'],
    DF: ['Brasília'],
    BA: ['Salvador'],
    Exterior: ['Lisboa'],
  };
  const ES_SC = [
    ['Universidade Federal de Santa Catarina', ['Araranguá', 'Florianópolis', 'Joinville', 'Blumenau']],
    ['Instituto Federal de Santa Catarina', ['Araranguá', 'Criciúma', 'Florianópolis', 'Tubarão']],
    ['Instituto Federal Catarinense', ['Santa Rosa do Sul', 'Sombrio', 'Blumenau']],
    ['Universidade do Estado de Santa Catarina', ['Florianópolis', 'Laguna', 'Joinville']],
  ];
  const ES_UF = {
    RS: ['Universidade Federal do Rio Grande do Sul', 'Instituto Federal do Rio Grande do Sul', 'Universidade Federal de Santa Maria'],
    PR: ['Universidade Tecnológica Federal do Paraná', 'Instituto Federal do Paraná'],
    SP: ['Instituto Federal de São Paulo'],
    RJ: ['Universidade Federal do Rio de Janeiro'],
    MG: ['Universidade Federal de Minas Gerais'],
    DF: ['Universidade de Brasília'],
    BA: ['Universidade Federal da Bahia'],
    Exterior: ['Universidade de Lisboa'],
  };

  Obs.gerarBaseFicticia = function (hojeParam) {
    const hoje = hojeParam ? U.parse(hojeParam) : U.hoje();
    const rnd = U.prng(20261108);
    const sortear = (arr) => arr[Math.floor(rnd() * arr.length)];
    const inteiro = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const embaralhar = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    const repetir = (valor, n) => Array.from({ length: n }, () => valor);
    const mesesAtras = (n) => U.addMeses(hoje, -n);
    const maxData = (a, b) => (a > b ? a : b);
    const minData = (a, b) => (a < b ? a : b);
    const g = (e, masc, fem) => (e.genero === 'F' ? fem : masc);
    const faixaDe = (ano) => (ano >= 2024 ? '2024–2028' : ano >= 2019 ? '2019–2023' : '2014–2018');

    /* ------------------------- nomes únicos ------------------------- */
    const usados = new Set(['Rafael Costa Lima', 'Bianca Ferreira Souza', 'Juliana Mendes',
      'Marcos Vinícius Rocha', 'Aline Costa Pereira', 'Paulo Silveira']);
    function novoNome() {
      for (;;) {
        const genero = rnd() < 0.52 ? 'F' : 'M';
        const primeiro = sortear(genero === 'F' ? NOMES_F : NOMES_M);
        let s1 = sortear(SOBRENOMES);
        let s2 = sortear(SOBRENOMES);
        if (s1 === s2) continue;
        const nome = rnd() < 0.55 ? `${primeiro} ${s1} ${s2}` : `${primeiro} ${s2}`;
        if (!usados.has(nome)) { usados.add(nome); return { nome, genero }; }
      }
    }
    const emails = new Set();
    function emailDe(nome) {
      const p = U.semAcento(nome).toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter(Boolean);
      let base = `${p[0]}.${p[p.length - 1]}`;
      let e = `${base}@example.com`;
      let k = 2;
      while (emails.has(e)) e = `${base}${k++}@example.com`;
      emails.add(e);
      return e;
    }
    function titulo(linha) {
      return sortear(TITULOS[linha]).replace(/\{(\w+)\}/g, (_, k) => sortear(PREENCHE[k]));
    }
    function orcidFicticio() {
      // prefixo 0000-0000 está fora das faixas emitidas pelo ORCID: não coincide com pessoas reais
      const corpo = '00000000' + String(inteiro(1000000, 9999999));
      let total = 0;
      for (let i = 0; i < 15; i++) total = (total + parseInt(corpo[i], 10)) * 2;
      const r = (12 - (total % 11)) % 11;
      const d = corpo + (r === 10 ? 'X' : String(r));
      return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8, 12)}-${d.slice(12)}`;
    }
    const lattesFicticio = () => '0000' + String(inteiro(100000, 999999)) + String(inteiro(100000, 999999));

    /* ------------------- 1. esqueleto de titulados ------------------- */
    const anos = { 2016: 18, 2017: 24, 2018: 26, 2019: 18, 2020: 17, 2021: 20, 2022: 21, 2023: 20, 2024: 19, 2025: 21, 2026: 8 };
    // Categorias: DM = dados mínimos em dia | PV = pendente de validação (e-mail ou Lattes)
    //             PA = cadastro desatualizado (> 12 meses) | SC = nunca se cadastrou
    const quotas = {
      '2024–2028': { DM: 33, PV: 6, PA: 1, SC: 8 },
      '2019–2023': { DM: 58, PV: 11, PA: 14, SC: 13 },
      '2014–2018': { DM: 31, PV: 1, PA: 17, SC: 19 },
    };

    const nomeados = [
      { nome: 'Rafael Costa Lima', genero: 'M', ano: 2025, mes: 3, cat: 'SC', orient: 'A', papel: 'rafael',
        titulo: 'Gamificação no ensino de programação na educação básica' },
      { nome: 'Bianca Ferreira Souza', genero: 'F', ano: 2024, mes: 8, cat: 'DM', orient: 'I', papel: 'destaque',
        titulo: 'Painéis de dados abertos para vigilância em saúde em municípios catarinenses' },
      { nome: 'Juliana Mendes', genero: 'F', ano: 2021, mes: 7, cat: 'DM', orient: 'F', papel: 'destaque',
        titulo: 'Interfaces adaptativas para usuários com baixa visão em aplicativos móveis' },
      { nome: 'Marcos Vinícius Rocha', genero: 'M', ano: 2019, mes: 4, cat: 'DM', orient: 'D', papel: 'destaque',
        titulo: 'Laboratórios remotos no ensino de física no ensino médio integrado' },
      { nome: 'Aline Costa Pereira', genero: 'F', ano: 2020, mes: 9, cat: 'DM', orient: 'G', papel: 'destaque',
        titulo: 'Formação continuada de professores para o pensamento computacional nos anos iniciais' },
      { nome: 'Paulo Silveira', genero: 'M', ano: 2017, mes: 11, cat: 'DM', orient: 'E', papel: 'destaque',
        titulo: 'Modelo de governança de TI para prefeituras de pequeno porte do sul catarinense' },
    ];

    const lista = [];
    let seq = 1;
    function novoRegistro(ano, cat, extra) {
      const id = 'e' + String(seq++).padStart(3, '0');
      const mes = extra && extra.mes ? extra.mes : (ano === 2026 ? inteiro(2, 10) : inteiro(2, 12));
      const r = {
        id, origem: 'base', cat, anoDefesa: ano, mesDefesa: mes,
        dataDefesa: `${ano}-${U.dois(mes)}-${U.dois(inteiro(5, 25))}`,
        nivel: 'ME', cadastro: null, lattes: null, questionarios: [], producoes: [],
        vinculosAnteriores: [], destaque: null, termoMatricula: null,
      };
      if (extra) Object.assign(r, extra);
      if (!r.nome) Object.assign(r, novoNome());
      lista.push(r);
      return r;
    }

    // nomeados primeiro (ids estáveis e fáceis de achar)
    nomeados.forEach((n) => novoRegistro(n.ano, n.cat, {
      nome: n.nome, genero: n.genero, mes: n.mes, orientId: n.orient, papel: n.papel, titulo: n.titulo,
    }));

    R.faixas.forEach((faixa) => {
      const slotsAno = [];
      Object.keys(anos).forEach((a) => {
        const ano = +a;
        if (faixaDe(ano) !== faixa) return;
        const jaUsados = nomeados.filter((n) => n.ano === ano).length;
        for (let i = 0; i < anos[a] - jaUsados; i++) slotsAno.push(ano);
      });
      const q = Object.assign({}, quotas[faixa]);
      nomeados.filter((n) => faixaDe(n.ano) === faixa).forEach((n) => { q[n.cat]--; });

      if (faixa === '2024–2028') {
        // defesas de 2026: 5 cadastradas na própria defesa (captura) e 3 sem cadastro
        const de2026 = embaralhar(['DM', 'DM', 'DM', 'DM', 'PV', 'SC', 'SC', 'SC']);
        de2026.forEach((c) => { q[c]--; });
        const outros = slotsAno.filter((a) => a !== 2026);
        // o único cadastro desatualizado da faixa precisa ser de 2024
        const i2024 = outros.indexOf(2024);
        outros.splice(i2024, 1);
        q.PA--;
        novoRegistro(2024, 'PA');
        const cats = embaralhar([].concat(repetir('DM', q.DM), repetir('PV', q.PV), repetir('SC', q.SC)));
        embaralhar(outros).forEach((ano, i) => novoRegistro(ano, cats[i]));
        de2026.forEach((c) => novoRegistro(2026, c));
      } else {
        const cats = embaralhar([].concat(repetir('DM', q.DM), repetir('PV', q.PV), repetir('PA', q.PA), repetir('SC', q.SC)));
        embaralhar(slotsAno).forEach((ano, i) => novoRegistro(ano, cats[i]));
      }
    });

    /* --------- 2. orientadores (pendências calibradas com a V1) --------- */
    const porId = {};
    R.orientadores.forEach((o) => { porId[o.id] = o; });
    const pendentes = { '2024–2028': [], '2019–2023': [], '2014–2018': [] };
    lista.filter((e) => (e.cat === 'PA' || e.cat === 'SC') && !e.papel)
      .forEach((e) => pendentes[faixaDe(e.anoDefesa)].push(e));
    Object.values(pendentes).forEach(embaralhar);
    const ordemFaixa = { old: '2014–2018', mid: '2019–2023', new: '2024–2028' };
    const pendFixas = { A: { old: 5, mid: 3, new: 1 }, B: { old: 2, mid: 4, new: 1 }, C: { old: 3, mid: 2, new: 0 } };
    Object.keys(pendFixas).forEach((oid) => {
      Object.keys(pendFixas[oid]).forEach((k) => {
        for (let i = 0; i < pendFixas[oid][k]; i++) pendentes[ordemFaixa[k]].pop().orientId = oid;
      });
    });
    const restantes = embaralhar([].concat(
      repetir('2014–2018', pendentes['2014–2018'].length),
      repetir('2019–2023', pendentes['2019–2023'].length),
      repetir('2024–2028', pendentes['2024–2028'].length)));
    const cotaDemais = { D: 4, E: 4, F: 4, G: 4, H: 4, I: 4, J: 4, K: 4, L: 4, M: 4, N: 4, O: 3, P: 3 };
    let ptr = 0;
    Object.keys(cotaDemais).forEach((oid) => {
      for (let i = 0; i < cotaDemais[oid]; i++) pendentes[restantes[ptr++]].pop().orientId = oid;
    });
    lista.forEach((e) => {
      if (!e.orientId) e.orientId = sortear(R.orientadores).id;
      const o = porId[e.orientId];
      e.orientador = o.nome;
      e.linha = o.linha;
      if (!e.titulo) e.titulo = titulo(e.linha);
      delete e.orientId;
    });

    // alguns doutores (nível DO) entre as defesas recentes
    embaralhar(lista.filter((e) => e.anoDefesa >= 2025 && !e.papel && (e.cat === 'DM' || e.cat === 'PV')))
      .slice(0, 3).forEach((e) => { e.nivel = 'DO'; });

    /* ------------ 3. vínculo profissional dos que têm cadastro ------------ */
    const dm = lista.filter((e) => e.cat === 'DM');
    const especiais = {
      'Bianca Ferreira Souza': { tipo: 'OP', inst: 'Secretaria de Estado da Saúde de SC', cargo: 'Analista de dados em saúde', uf: 'SC', cidade: 'Florianópolis', inicio: '2024-11' },
      'Juliana Mendes': { tipo: 'EP', inst: 'Startup de acessibilidade digital (cofundadora)', cargo: 'Diretora de produto', uf: 'SC', cidade: 'Florianópolis', inicio: '2021-10' },
      'Marcos Vinícius Rocha': { tipo: 'ESpub', inst: 'Instituto Federal Catarinense', cargo: 'Professor do ensino básico, técnico e tecnológico', uf: 'SC', cidade: 'Santa Rosa do Sul', inicio: '2020-02' },
      'Aline Costa Pereira': { tipo: 'EBpub', inst: 'Rede municipal de ensino de Criciúma', cargo: 'Coordenadora de tecnologia educacional', uf: 'SC', cidade: 'Criciúma', inicio: '2022-03' },
      'Paulo Silveira': { tipo: 'OP', inst: 'Prefeitura Municipal de Içara', cargo: 'Coordenador de transformação digital', uf: 'SC', cidade: 'Içara', inicio: '2019-05' },
    };
    // Cotas entre os egressos com dados mínimos (122 antes do roteiro do Rafael)
    const cotaSetor = { EBpub: 35, EBpriv: 3, ESpub: 31, ESpriv: 2, EP: 22, OP: 17, AU: 6, SV: 6 };
    const cotaUF = { SC: 90, RS: 14, PR: 7, SP: 4, RJ: 2, MG: 2, DF: 1, BA: 1, Exterior: 1 };
    dm.filter((e) => especiais[e.nome]).forEach((e) => { cotaSetor[especiais[e.nome].tipo]--; cotaUF.SC--; });
    const comuns = dm.filter((e) => !especiais[e.nome]);
    const tipos = embaralhar([].concat(...Object.keys(cotaSetor).map((k) => repetir(k, cotaSetor[k]))));
    const ufsDm = embaralhar([].concat(...Object.keys(cotaUF).map((k) => repetir(k, cotaUF[k]))));
    comuns.forEach((e, i) => { e._tipo = tipos[i]; e._uf = ufsDm[i]; });
    // quem está no exterior trabalha em universidade ou empresa
    const noExterior = comuns.find((e) => e._uf === 'Exterior');
    if (noExterior && !/^ES|EP/.test(noExterior._tipo)) {
      const troca = comuns.find((e) => e._uf === 'SC' && /^ESpub$/.test(e._tipo));
      [noExterior._uf, troca._uf] = [troca._uf, noExterior._uf];
    }
    // demais categorias com cadastro: perfil profissional sorteado livremente
    lista.filter((e) => e.cat === 'PV' || e.cat === 'PA').forEach((e) => {
      e._tipo = sortear(['EBpub', 'EBpub', 'ESpub', 'ESpub', 'EP', 'EP', 'OP', 'AU', 'EBpriv', 'SV']);
      e._uf = rnd() < 0.8 ? 'SC' : sortear(['RS', 'RS', 'PR', 'SP']);
    });

    function montarVinculo(e) {
      if (especiais[e.nome]) {
        const s = especiais[e.nome];
        e._tipo = s.tipo;
        const setor = { OP: 'Outro órgão público', EP: 'Empresa privada', ESpub: 'Ensino superior', EBpub: 'Educação básica' }[s.tipo];
        return { semVinculo: false, instituicao: s.inst, cargo: s.cargo, setor, natureza: s.tipo === 'EP' ? 'Privada' : 'Pública',
          cidade: s.cidade, uf: s.uf, pais: 'Brasil', inicioVinculo: s.inicio };
      }
      const uf = e._uf;
      let cidade = sortear(CIDADES[uf] || ['Florianópolis']);
      const pais = uf === 'Exterior' ? 'Portugal' : 'Brasil';
      const t = e._tipo;
      const v = { semVinculo: false, cidade, uf, pais };
      if (t === 'SV') {
        return { semVinculo: true, instituicao: '', cargo: '', setor: '', natureza: '', cidade, uf, pais, inicioVinculo: '' };
      }
      if (t === 'EBpub' || t === 'EBpriv') {
        v.setor = 'Educação básica';
        v.natureza = t === 'EBpub' ? 'Pública' : 'Privada';
        if (t === 'EBpriv') v.instituicao = `Escola privada de educação básica (${cidade})`;
        else if (uf === 'SC') v.instituicao = rnd() < 0.5 ? 'Secretaria de Estado da Educação de SC' : `Rede municipal de ensino de ${cidade}`;
        else if (uf === 'RS') v.instituicao = rnd() < 0.5 ? 'Secretaria Estadual de Educação do RS' : `Rede municipal de ensino de ${cidade}`;
        else if (uf === 'PR') v.instituicao = 'Secretaria de Estado da Educação do Paraná';
        else v.instituicao = `Rede municipal de ensino de ${cidade}`;
        v.cargo = sortear([
          g(e, 'Professor de informática', 'Professora de informática'),
          g(e, 'Professor de matemática', 'Professora de matemática'),
          g(e, 'Professor de ciências', 'Professora de ciências'),
          g(e, 'Professor de física', 'Professora de física'),
          g(e, 'Coordenador pedagógico', 'Coordenadora pedagógica'),
          g(e, 'Assessor de tecnologia educacional', 'Assessora de tecnologia educacional'),
        ]);
      } else if (t === 'ESpub' || t === 'ESpriv') {
        v.setor = 'Ensino superior';
        v.natureza = t === 'ESpub' ? 'Pública' : 'Privada';
        if (t === 'ESpriv') {
          v.instituicao = `Instituição privada de ensino superior (${cidade})`;
          v.cargo = sortear([g(e, 'Professor universitário', 'Professora universitária'), g(e, 'Coordenador de curso', 'Coordenadora de curso')]);
        } else {
          if (uf === 'SC') {
            const [inst, campi] = sortear(ES_SC);
            v.instituicao = inst;
            v.cidade = cidade = sortear(campi);
          } else {
            v.instituicao = sortear(ES_UF[uf] || ['Universidade pública']);
          }
          v.cargo = sortear([
            g(e, 'Professor do magistério superior', 'Professora do magistério superior'),
            g(e, 'Professor do ensino básico, técnico e tecnológico', 'Professora do ensino básico, técnico e tecnológico'),
            g(e, 'Professor substituto', 'Professora substituta'),
            g(e, 'Professor do magistério superior', 'Professora do magistério superior'),
            g(e, 'Técnico em assuntos educacionais', 'Técnica em assuntos educacionais'),
            'Analista de tecnologia da informação',
          ]);
        }
      } else if (t === 'EP') {
        v.setor = 'Empresa privada';
        v.natureza = 'Privada';
        v.instituicao = sortear(['Empresa de desenvolvimento de software', 'Startup de tecnologia educacional',
          'Empresa de análise de dados', 'Indústria cerâmica', 'Cooperativa de crédito', 'Empresa de telecomunicações',
          'Consultoria de inovação', 'Empresa de comércio eletrônico']);
        v.cargo = sortear([g(e, 'Desenvolvedor de software', 'Desenvolvedora de software'), 'Analista de dados',
          'Gerente de projetos', 'Cientista de dados', 'Analista de sistemas', g(e, 'Consultor de inovação', 'Consultora de inovação'),
          g(e, 'Coordenador de TI', 'Coordenadora de TI'), 'Product owner']);
      } else if (t === 'OP') {
        v.setor = 'Outro órgão público';
        v.natureza = 'Pública';
        v.instituicao = uf === 'SC'
          ? sortear([`Prefeitura Municipal de ${cidade}`, `Prefeitura Municipal de ${cidade}`, 'Tribunal de Justiça de Santa Catarina',
            'Secretaria de Estado da Saúde de SC', `Câmara Municipal de ${cidade}`, 'Empresa estadual de tecnologia da informação'])
          : `Prefeitura Municipal de ${cidade}`;
        v.cargo = sortear(['Analista de tecnologia da informação', g(e, 'Coordenador de transformação digital', 'Coordenadora de transformação digital'),
          g(e, 'Técnico em informática', 'Técnica em informática'), g(e, 'Gestor de projetos', 'Gestora de projetos'), 'Analista de sistemas']);
      } else if (t === 'AU') {
        v.setor = 'Autônomo';
        v.natureza = 'Privada';
        v.instituicao = 'Atuação autônoma';
        v.cargo = sortear([g(e, 'Consultor autônomo em TI', 'Consultora autônoma em TI'),
          g(e, 'Designer instrucional autônomo', 'Designer instrucional autônoma'),
          g(e, 'Desenvolvedor freelancer', 'Desenvolvedora freelancer'), g(e, 'Consultor em inovação', 'Consultora em inovação')]);
      }
      return v;
    }

    function docenteDe(v) {
      if (v.semVinculo) return 'Não';
      if (!/^Professor|^Professora/.test(v.cargo)) return 'Não';
      if (v.setor === 'Educação básica') return 'Educação básica';
      if (v.setor === 'Ensino superior') return /técnico e tecnológico/.test(v.cargo) ? 'Ensino técnico' : 'Ensino superior';
      return 'Não';
    }

    /* ---------------- 4. cadastro, Lattes e consentimentos ---------------- */
    const pvTipos = embaralhar([].concat(repetir('email', 6), repetir('lattesNaoConferido', 8),
      repetir('lattesDesatualizado', 3), repetir('semLattes', 1)));
    let iPv = 0;
    lista.forEach((e) => {
      const defesa = U.parse(e.dataDefesa);
      if (e.anoDefesa >= 2025) {
        // termo de consentimento na matrícula (proposta do EX08), assinado ~2 anos antes da defesa
        e.termoMatricula = { acompanhamento: true, divulgacao: e.papel === 'rafael' ? true : rnd() < 0.75,
          assinadoEm: `${e.anoDefesa - 2}-03` };
      }
      if (e.cat === 'SC') return;
      const v = montarVinculo(e);
      inteiro(1000, 9999); // o telefone foi retirado (minimização de dados); a chamada mantém a sequência do gerador
      let informado;
      let criado;
      if (e.cat === 'PA') {
        const sup = mesesAtras(14);
        const inf = U.addMeses(defesa, 1);
        informado = inf < sup ? new Date(inf.getTime() + rnd() * (sup - inf)) : sup;
        criado = informado;
      } else {
        informado = maxData(mesesAtras(inteiro(0, 10)), defesa);
        criado = e.anoDefesa === 2026 ? defesa : minData(informado, U.addMeses(defesa, inteiro(0, 18)));
      }
      // início do vínculo: anterior ao momento em que foi informado
      if (!v.semVinculo && !v.inicioVinculo) {
        const faixa = faixaDe(e.anoDefesa);
        const meses = faixa === '2014–2018' ? inteiro(30, 120) : faixa === '2019–2023' ? inteiro(10, 84) : inteiro(4, 80);
        v.inicioVinculo = U.isoMes(minData(mesesAtras(meses), informado));
      }
      const tipoPv = e.cat === 'PV' ? pvTipos[iPv++] : null;
      e._pv = tipoPv;
      e.cadastro = Object.assign({
        email: emailDe(e.nome),
        emailConfirmadoEm: (e.cat === 'PV' && tipoPv === 'email') || (e.cat === 'PA' && rnd() < 0.25) ? null : U.iso(criado),
        vinculoIngresso: rnd() < 0.5 ? sortear(['Professor(a) da rede pública', 'Analista em empresa privada', 'Servidor(a) municipal', 'Sem vínculo', 'Bolsista de pesquisa']) : '',
        posGrad: 'Não',
        atuaPPG: false,
        docente: docenteDe(v),
        lattesId: '',
        orcid: '',
        orcidVerificado: false,
        linkedin: '',
        consentAcompanhamento: true,
        consentDivulgacao: e.papel === 'destaque' ? true : rnd() < 0.72,
        consentRevisadoEm: U.iso(criado),
        criadoEm: U.iso(criado),
        atualizadoEm: U.iso(informado),
        vinculoInformadoEm: U.iso(informado),
        viaPrototipo: false,
      }, v);

      // Lattes
      const temLattes = e.cat !== 'PA' ? tipoPv !== 'semLattes' : rnd() < 0.8;
      if (temLattes) {
        e.cadastro.lattesId = lattesFicticio();
        if (e.cat === 'DM' || tipoPv === 'email') {
          const at = maxData(mesesAtras(inteiro(1, 9)), defesa);
          const conf = minData(U.addDias(at, inteiro(5, 40)), hoje);
          e.lattes = { atualizadoEm: U.iso(at), conferidoEm: U.iso(conf) };
        } else if (tipoPv === 'lattesNaoConferido') {
          e.lattes = { atualizadoEm: U.iso(maxData(mesesAtras(inteiro(1, 8)), defesa)), conferidoEm: null, declarado: true };
        } else if (tipoPv === 'lattesDesatualizado') {
          e.lattes = { atualizadoEm: U.iso(maxData(mesesAtras(inteiro(14, 30)), defesa)), conferidoEm: U.iso(mesesAtras(inteiro(1, 3))) };
        } else if (e.cat === 'PA') {
          e.lattes = rnd() < 0.5 ? { atualizadoEm: U.iso(maxData(mesesAtras(inteiro(20, 70)), defesa)), conferidoEm: U.iso(mesesAtras(inteiro(14, 30))) } : null;
        }
      }
      // ORCID (mais comum entre egressos recentes)
      if (e.cat !== 'PA' && rnd() < (e.anoDefesa >= 2019 ? 0.6 : 0.35)) {
        e.cadastro.orcid = orcidFicticio();
        e.cadastro.orcidVerificado = rnd() < 0.7;
      }
    });

    /* --------------- 5. tempo médio no vínculo ≈ 4,2 anos --------------- */
    const comVinculoDm = dm.filter((e) => e.cadastro && !e.cadastro.semVinculo);
    const anosNoVinculo = (e) => U.anosEntre(e.cadastro.inicioVinculo + '-01', hoje);
    const ajustaveis = comVinculoDm.filter((e) => !especiais[e.nome]);
    const alvoSoma = 4.2297 * comVinculoDm.length; // após o roteiro do Rafael (0,77 ano) a média fica em 4,2
    for (let guarda = 0; guarda < 5000; guarda++) {
      const soma = comVinculoDm.reduce((s, e) => s + anosNoVinculo(e), 0);
      const dif = soma - alvoSoma;
      if (Math.abs(dif) < 0.06) break;
      const e = sortear(ajustaveis);
      const atual = U.parse(e.cadastro.inicioVinculo + '-01');
      const passo = dif > 0 ? 1 : -1; // dif > 0: média alta → início mais recente
      const novo = U.addMeses(atual, passo);
      const limite = U.parse(e.cadastro.vinculoInformadoEm);
      if (passo > 0 && novo > limite) continue;
      if (passo < 0 && U.anosEntre(novo, hoje) > 14) continue;
      e.cadastro.inicioVinculo = U.isoMes(novo);
    }

    /* -------- 6. doutorado e atuação em PPG (26 entre os 122 DM) -------- */
    const marcos = dm.find((e) => e.nome === 'Marcos Vinícius Rocha');
    marcos.cadastro.posGrad = 'Doutorado concluído';
    const doEs = embaralhar(dm.filter((e) => e !== marcos && e._tipo && e._tipo.startsWith('ES')));
    const doOutros = embaralhar(dm.filter((e) => e !== marcos && e._tipo && !e._tipo.startsWith('ES') && e._tipo !== 'SV'));
    const escolhidos = doEs.slice(0, 17).concat(doOutros.slice(0, 8));
    const situacoes = [].concat(repetir('Doutorado em andamento', 20), repetir('Doutorado concluído', 3), repetir('Pós-doutorado em andamento', 2));
    escolhidos.forEach((e, i) => {
      e.cadastro.posGrad = situacoes[i];
      if (situacoes[i] !== 'Doutorado em andamento' && e._tipo.startsWith('ES') && rnd() < 0.8) e.cadastro.atuaPPG = true;
    });
    // poucos casos entre os demais cadastrados (não entram no denominador do indicador)
    lista.filter((e) => (e.cat === 'PV' || e.cat === 'PA') && rnd() < 0.12).forEach((e) => { e.cadastro.posGrad = 'Doutorado em andamento'; });

    /* --------------------- 7. questionários (ciclo atual) --------------------- */
    const cicloDe = function (anoResp, anoDef) {
      const d = anoResp - anoDef;
      if (d === 1) return '1 ano';
      if (d === 3) return '3 anos';
      if (d === 5) return '5 anos';
      return anoDef <= 2023 ? 'Resgate' : 'Atualização';
    };
    const nomesDestaque = Object.keys(especiais);
    const respDm = dm.filter((e) => e.anoDefesa <= 2025 && nomesDestaque.includes(e.nome))
      .concat(embaralhar(dm.filter((e) => e.anoDefesa <= 2025 && !nomesDestaque.includes(e.nome))).slice(0, 45));
    const respPv = embaralhar(lista.filter((e) => e.cat === 'PV' && e.anoDefesa <= 2025 && (e._pv === 'lattesNaoConferido' || e._pv === 'lattesDesatualizado'))).slice(0, 5);
    const respondentes = embaralhar(respDm.concat(respPv)); // 55
    const mobilidadeFlags = embaralhar([].concat(repetir(true, 22), repetir(false, respondentes.length - 22)));
    const relacoes = embaralhar([].concat(repetir(5, 25), repetir(4, 20), repetir(3, 7), repetir(2, 3)));
    const TXT_MANTER = ['As disciplinas de metodologia de pesquisa', 'A interdisciplinaridade entre as linhas',
      'O acompanhamento próximo da orientação', 'Os seminários de pesquisa com egressos', 'A oferta de disciplinas em formato intensivo'];
    const TXT_MUDAR = ['Mais disciplinas no período noturno', 'Divulgar melhor as oportunidades de bolsa',
      'Prazos mais claros para a qualificação', 'Mais integração com empresas da região'];
    const TXT_INCLUIR = ['Disciplina de docência no ensino superior', 'Disciplina de ciência de dados aplicada',
      'Oficinas de escrita científica em inglês', 'Projetos de extensão com a rede pública', 'Disciplina de docência no ensino superior'];
    respondentes.forEach((e, i) => {
      const resp = U.parse(e.cadastro.vinculoInformadoEm);
      const enviado = maxData(U.addDias(resp, -inteiro(3, 25)), U.parse(e.dataDefesa));
      const mob = mobilidadeFlags[i];
      let mud = [];
      if (mob) {
        mud = embaralhar(['cargo', 'setor', 'regiao']).slice(0, inteiro(1, 3));
        if (rnd() < 0.5) mud.push('instituicao');
        if (rnd() < 0.3) mud.push('nivel');
      } else if (rnd() < 0.35) {
        mud = [sortear(['instituicao', 'natureza', 'nivel'])];
      }
      const notaAlta = () => sortear([2, 3, 3, 4, 4, 4]);
      e.questionarios.push({
        id: `q-${e.id}-1`,
        ciclo: cicloDe(resp.getFullYear(), e.anoDefesa),
        enviadoEm: U.iso(enviado),
        iniciadoEm: U.iso(resp),
        respondidoEm: U.iso(resp),
        finalizadoEm: U.iso(resp),
        completo: true,
        etapa: 4,
        viaPrototipo: false,
        blocos: {
          b1: { mesmoVinculo: mob ? 'mudou' : 'sim', mudancas: mud, progressao: rnd() < 0.45 ? 'sim' : 'nao',
            posGrad: e.cadastro.posGrad, docente: e.cadastro.docente, atuaPPG: e.cadastro.atuaPPG ? 'sim' : 'nao' },
          b2: { relacao: relacoes[i], importancia: { cientificas: notaAlta(), escrita: notaAlta(), geral: notaAlta(), insercao: notaAlta() } },
          b3: { semProducao: false, impactos: [], impactosTexto: '', premios: '' },
          b4: { manter: rnd() < 0.6 ? sortear(TXT_MANTER) : '', mudar: rnd() < 0.5 ? sortear(TXT_MUDAR) : '',
            incluir: rnd() < 0.55 ? sortear(TXT_INCLUIR) : '',
            disponibilidade: R.disponibilidade.map((d) => d.id).filter(() => rnd() < 0.35) },
        },
      });
    });
    // convites enviados e ainda sem resposta (taxa de resposta 55/103 antes do roteiro)
    const semResposta = lista.filter((e) => e.cat === 'PA')
      .concat(embaralhar(dm.filter((e) => e.anoDefesa <= 2025 && !respondentes.includes(e))).slice(0, 16));
    semResposta.forEach((e) => {
      const env = mesesAtras(inteiro(1, 11));
      e.questionarios.push({ id: `q-${e.id}-1`, ciclo: cicloDe(env.getFullYear(), e.anoDefesa), enviadoEm: U.iso(env),
        iniciadoEm: null, respondidoEm: null, finalizadoEm: null, completo: false, etapa: 0, viaPrototipo: false, blocos: {} });
    });

    /* -------------- 8. produção intelectual (egressos autores) -------------- */
    const tiposProd = ['Artigo em periódico', 'Artigo em periódico', 'Trabalho em evento', 'Trabalho em evento',
      'Produto técnico ou tecnológico', 'Software ou aplicativo', 'Livro ou capítulo', 'Material didático'];
    let nDoi = 100;
    function addProducoes(e, n) {
      for (let k = 0; k < n; k++) {
        const tipo = sortear(tiposProd);
        const ano = Math.min(hoje.getFullYear(), e.anoDefesa + inteiro(0, Math.max(1, hoje.getFullYear() - e.anoDefesa)));
        const temDoi = /Artigo|Trabalho/.test(tipo);
        e.producoes.push({ tipo, titulo: `${tipo === 'Software ou aplicativo' ? 'Aplicativo derivado de' : 'Desdobramentos de'}: ${e.titulo}`.slice(0, 140),
          ano, link: temDoi ? `https://doi.org/10.5555/ppgtic.${ano}.${nDoi++}` : '', fonte: e.cadastro.orcid ? 'ORCID' : 'Lattes' });
      }
    }
    const ate5 = (e) => hoje.getFullYear() - e.anoDefesa <= 5;
    const fixosAutores = lista.filter((e) => ['Bianca Ferreira Souza', 'Juliana Mendes'].includes(e.nome));
    const candidatos = embaralhar(lista.filter((e) => ate5(e) && e.cadastro && !fixosAutores.includes(e)));
    fixosAutores.concat(candidatos.slice(0, 39)).forEach((e) => addProducoes(e, inteiro(1, 3)));
    lista.filter((e) => !ate5(e) && e.cadastro && (e.cat === 'DM') && rnd() < 0.25).forEach((e) => addProducoes(e, inteiro(1, 2)));
    lista.filter((e) => ['Marcos Vinícius Rocha', 'Paulo Silveira'].includes(e.nome)).forEach((e) => { if (!e.producoes.length) addProducoes(e, 3); });

    /* ------------------- 9. fichas de destaque (2.2.2) ------------------- */
    const fichas = {
      'Bianca Ferreira Souza': {
        status: 'publicada', formato: 'Depoimento', aprovadaHa: 5, publicadaHa: 4, indicadoPor: 'Prof. Orientador I',
        atuacao: 'Atua como analista de dados na Secretaria de Estado da Saúde de SC, onde coordena a construção de painéis de vigilância em saúde a partir de dados abertos, metodologia desenvolvida na dissertação.',
        impactosTipos: ['Social', 'Profissional'],
        impactosTexto: 'O painel de monitoramento de vacinação que desenvolveu passou a ser usado pelas equipes de 38 municípios do sul catarinense, reduzindo de semanas para dias o tempo de consolidação dos dados. Apresentou os resultados em dois eventos de saúde digital e orienta estagiários de computação na secretaria.',
        aderencia: 'Une tecnologias da informação e gestão pública, em linha com o caráter interdisciplinar do PPGTIC e com o perfil de egresso que aplica a pesquisa na solução de problemas da sociedade.',
        comprovacoes: ['Currículo Lattes atualizado', 'Declaração da Secretaria de Estado da Saúde sobre o uso do painel', 'Trabalhos em evento com DOI'],
        resumo: 'Da dissertação sobre dados abertos ao painel de vacinação usado por 38 municípios do sul catarinense.',
      },
      'Juliana Mendes': {
        status: 'publicada', formato: 'Entrevista', aprovadaHa: 9, publicadaHa: 8, indicadoPor: 'Prof.ª Orientadora F',
        atuacao: 'Cofundou e dirige uma startup de acessibilidade digital que desenvolve recursos de ampliação e alto contraste para aplicativos móveis, a partir da pesquisa sobre interfaces para pessoas com baixa visão.',
        impactosTipos: ['Econômico', 'Social'],
        impactosTexto: 'A startup emprega 12 pessoas e atende 9 empresas da região. O recurso de leitura ampliada é usado por cerca de 20 mil pessoas com baixa visão. A empresa recebeu um prêmio estadual de inovação em 2025.',
        aderencia: 'Exemplo de transferência da pesquisa para o mercado, alinhado à linha de Tecnologia Computacional e ao compromisso do Programa com inovação e inclusão.',
        comprovacoes: ['Currículo Lattes atualizado', 'Contrato social da empresa', 'Certificado do prêmio estadual de inovação'],
        resumo: 'Fundou uma startup de acessibilidade digital a partir da pesquisa sobre interfaces para pessoas com baixa visão.',
      },
      'Marcos Vinícius Rocha': {
        status: 'aprovada', formato: 'Depoimento', aprovadaHa: 6, indicadoPor: 'Prof.ª Orientadora D',
        atuacao: 'Professor do ensino básico, técnico e tecnológico no Instituto Federal Catarinense, onde coordena o laboratório de experimentação remota usado nas aulas de física do ensino médio integrado. Concluiu o doutorado em 2025.',
        impactosTipos: ['Acadêmico', 'Profissional'],
        impactosTexto: 'Publicou 3 artigos em periódicos sobre laboratórios remotos e orientou 6 trabalhos de iniciação científica. O laboratório atende cerca de 400 estudantes por ano em três campi.',
        aderencia: 'Aplica tecnologias da informação à educação científica, em continuidade direta com a linha de Tecnologia Educacional.',
        comprovacoes: ['Currículo Lattes atualizado', 'Portaria de nomeação', 'Artigos com DOI'],
        resumo: 'Leva laboratórios remotos de física a três campi do Instituto Federal Catarinense.',
      },
      'Aline Costa Pereira': {
        status: 'aprovada', formato: 'Depoimento', aprovadaHa: 6, indicadoPor: 'Prof. Orientador G',
        atuacao: 'Coordena a tecnologia educacional da rede municipal de Criciúma e conduz a formação continuada de professores em pensamento computacional.',
        impactosTipos: ['Social', 'Profissional'],
        impactosTexto: 'O programa de formação que estruturou a partir da dissertação alcançou 230 professores e 41 escolas da rede municipal entre 2023 e 2025.',
        aderencia: 'Leva a pesquisa do Programa para a escola pública, em linha com a missão de contribuir para o desenvolvimento do sul catarinense.',
        comprovacoes: ['Currículo Lattes atualizado', 'Declaração da Secretaria Municipal de Educação'],
        resumo: 'Formou 230 professores da rede de Criciúma em pensamento computacional.',
      },
      'Paulo Silveira': {
        status: 'publicada', formato: 'Depoimento', aprovadaHa: 11, publicadaHa: 10, indicadoPor: 'Prof. Orientador E',
        atuacao: 'Coordena a transformação digital da Prefeitura Municipal de Içara, com base no modelo de governança de TI estudado no programa.',
        impactosTipos: ['Social', 'Econômico'],
        impactosTexto: 'Conduziu a digitalização de 70 serviços municipais e a adoção do processo eletrônico, com economia estimada de R$ 1,2 milhão em papel e deslocamentos desde 2021. O modelo foi apresentado a outros municípios da associação regional.',
        aderencia: 'Representa a linha de Tecnologia, Gestão e Inovação e o impacto do Programa na gestão pública regional.',
        comprovacoes: ['Currículo Lattes atualizado', 'Portaria de designação', 'Relatório de gestão da prefeitura'],
        resumo: 'Coordena a transformação digital de uma prefeitura do sul catarinense com base no modelo de governança estudado no programa.',
      },
    };
    lista.forEach((e) => {
      const f = fichas[e.nome];
      if (!f) return;
      const aprov = U.iso(mesesAtras(f.aprovadaHa));
      const criada = U.iso(U.addDias(mesesAtras(f.aprovadaHa), -12));
      const historico = [
        { em: `${criada}T10:00:00`, acao: `Ficha criada (indicação de ${f.indicadoPor})`, perfil: 'Responsável Temático' },
        { em: `${U.iso(U.addDias(U.parse(criada), 3))}T15:30:00`, acao: 'Enviada à Comissão', perfil: 'Responsável Temático' },
        { em: `${aprov}T16:00:00`, acao: 'Aprovada pela Comissão', perfil: 'Comissão de Autoavaliação' },
      ];
      let publicadaEm = null;
      if (f.status === 'publicada') {
        publicadaEm = U.iso(mesesAtras(f.publicadaHa));
        historico.push({ em: `${publicadaEm}T09:00:00`, acao: 'Publicada na vitrine Trajetórias PPGTIC', perfil: 'Responsável Temático' });
      }
      e.destaque = {
        status: f.status, formato: f.formato, indicadoPor: f.indicadoPor, atuacao: f.atuacao, impactosTipos: f.impactosTipos,
        impactosTexto: f.impactosTexto, aderencia: f.aderencia, comprovacoes: f.comprovacoes.map((c) => ({ descricao: c, arquivo: '' })),
        resumo: f.resumo, criadaEm: criada, aprovadaEm: aprov, publicadaEm, comentarioComissao: '', historico,
      };
    });

    // limpeza dos campos auxiliares
    lista.forEach((e) => { delete e.cat; delete e._tipo; delete e._uf; delete e._pv; delete e.genero; });
    return lista;
  };
})(typeof window !== 'undefined' ? window : globalThis);

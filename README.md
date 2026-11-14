# Observatório de Egressos PPGTIC/UFSC · Protótipo V2 (EX09)

Protótipo funcional das quatro telas modeladas no EX08: **cadastro**, **questionário**, **painel de indicadores** e **ficha de egresso de destaque**. É feito só com HTML, CSS e JavaScript, sem back-end e sem bibliotecas externas.

O site funciona de dois modos (`js/config.js`):

- **Demonstração** (no seu computador, com o Live Server): base fictícia de 212 titulados, login simulado e painel de demonstração. Os dados ficam no próprio navegador.
- **Coleta** (quando publicado na internet): começa vazio, mostra só o cadastro e o questionário e envia cada resposta para uma planilha do Google da equipe.

> Na demonstração, todos os nomes, trajetórias e números são **fictícios**, gerados sempre iguais em qualquer computador.

## Novidades de 13/11/2026

- **Telefone retirado** do cadastro (não entrava em nenhum indicador). O cadastro e o questionário não pedem dados sensíveis (LGPD, art. 5º, II).
- **Etapa inicial obrigatória no questionário:** link do LinkedIn, do currículo Lattes ou os dois; pelo menos um é exigido. Os links atualizam o cadastro.
- **Modo coleta** com envio para a planilha, importação da planilha no painel e botão **Esvaziar base**.

## Como rodar no VS Code (demonstração)

1. No VS Code, abra a pasta `observatorio-egressos-v2` (Arquivo › Abrir Pasta).
2. Instale a extensão **Live Server** (autor: Ritwick Dey). O VS Code sugere a instalação sozinho, porque ela está recomendada em `.vscode/extensions.json`.
3. Clique com o botão direito em `index.html` › **Open with Live Server** (ou clique em **Go Live** na barra inferior). O navegador abre em `http://127.0.0.1:5500` já na Tela 1.

Sem o Live Server também funciona: dê dois cliques em `cadastro.html`. Esse modo foi testado no Google Chrome (Edge e Opera usam o mesmo motor). No Firefox, use o Live Server.

## Coleta real: planilha do Google e link para os egressos

Antes de enviar a egressos reais, peça o aval da coordenação do PPGTIC e confira o aviso de privacidade (passo 3). Use, de preferência, uma conta Google do programa.

**1. Criar a planilha.** No Google Drive: Novo › Planilhas Google. Dê um nome, por exemplo "Observatório de Egressos – respostas". A planilha continua privada: só quem vocês compartilharem consegue abrir.

**2. Instalar o script que recebe as respostas.**
1. Na planilha: **Extensões › Apps Script**.
2. Apague o conteúdo de `Código.gs`, cole todo o arquivo `coleta/apps-script.gs` deste projeto e salve (ícone de disquete).
3. **Implantar › Nova implantação** › engrenagem (selecionar tipo) › **App da Web**. Em "Executar como", escolha **Eu**; na opção de quem tem acesso, escolha **Qualquer pessoa**. Clique em **Implantar** e autorize com a sua conta (se o Google avisar que o app não foi verificado, use Avançado › Acessar: o app é o seu próprio script).
4. Copie o **URL do app da Web**: começa com `https://script.google.com/macros/s/` e termina em `/exec`. Abra esse URL numa aba: deve aparecer "Observatório de Egressos PPGTIC: coleta ativa."

Se mudar o script depois: Implantar › Gerenciar implantações › lápis › Versão: **Nova versão** › Implantar. O URL continua o mesmo.

**3. Configurar o site.** Em `js/config.js`, cole o URL em `urlColeta` e preencha `responsavel` e `contato` (e-mail para dúvidas e pedidos de correção ou exclusão). Eles aparecem no cadastro e no rodapé.

**4. Testar no seu computador.** Com o Live Server, abra `http://127.0.0.1:5500/cadastro.html?modo=coleta`. Faça um cadastro e o questionário de teste e confira se a linha apareceu na aba **Respostas** da planilha. Depois apague essa linha (veja "Esvaziar") e volte à demonstração com `?modo=demonstracao`.

**5. Publicar o site (GitHub Pages, gratuito).**
1. Em github.com, crie um repositório **público** (o site não guarda dados; as respostas ficam na planilha).
2. **Add file › Upload files** e arraste o **conteúdo** da pasta `observatorio-egressos-v2` (os arquivos e as pastas `css`, `js` e `coleta`, não a pasta em si). Clique em **Commit changes**.
3. **Settings › Pages** › Source: **Deploy from a branch** › Branch: **main**, pasta **/ (root)** › Save. Em 1 ou 2 minutos aparece o endereço `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

Publicado, o site entra sozinho no modo coleta: sem base fictícia, sem painel de demonstração e sem as telas da equipe. Alternativa: Netlify Drop (arrastar a pasta), mas é preciso criar conta, porque sites sem conta são apagados em 1 hora.

**6. Mandar o link.** Envie o endereço do passo 5 por e-mail (com os destinatários em Cco) ou mensagem. Modelo:

> Assunto: Pesquisa de acompanhamento de egressos do PPGTIC/UFSC
>
> Olá! O Observatório de Egressos do PPGTIC/UFSC está acompanhando a trajetória de quem se formou no programa. A pesquisa tem um cadastro (cerca de 4 minutos) e um questionário (cerca de 8 minutos), e pede o link do seu LinkedIn ou do seu currículo Lattes. As respostas ajudam na avaliação e na melhoria do programa.
>
> Responder: [ENDEREÇO DO SITE]
>
> Dúvidas ou pedidos sobre seus dados: [E-MAIL DE CONTATO]. Obrigado!

**7. Acompanhar e analisar.** Cada egresso ocupa uma linha da planilha, atualizada a cada etapa (coluna `questionario_situacao`: em andamento, completo ou enviado). Para ver os indicadores: na planilha, **Arquivo › Fazer download › Valores separados por vírgula (.csv)**; no protótipo local (demonstração), **Demonstração › Importar respostas da planilha (CSV)** e entre como Coordenação. A base local é esvaziada antes, para o painel mostrar só as respostas reais.

## Esvaziar

- **Planilha (respostas reais):** selecione as linhas de teste (a partir da 2) › botão direito › Excluir linhas. Mantenha a linha 1 (cabeçalho). Se apagar a aba Respostas inteira, o script cria outra na próxima resposta.
- **Base do protótipo (este navegador):** Demonstração › **Esvaziar base** (apaga fictícios, testes, respostas importadas e evidências). **Restaurar base fictícia** traz os 212 egressos de volta.

## Estrutura

| Arquivo | Função |
|---|---|
| `index.html` | Abre a Tela 1 |
| `cadastro.html` + `js/tela-cadastro.js` | Tela 1 · cadastro do egresso (seção 4.1 do EX08) |
| `questionario.html` + `js/tela-questionario.js` | Tela 2 · questionário: etapa de perfis (LinkedIn/Lattes) e blocos 1 a 4 (seção 4.2) |
| `indicadores.html` + `js/tela-indicadores.js` | Tela 3 · painel de indicadores (seções 4.3, 4.4 e 4.6) |
| `ficha.html` + `js/tela-ficha.js` | Tela 4 · ficha de egresso de destaque (seção 4.5) |
| `css/estilo.css` | Paleta do Manual de Identidade Visual da UFSC, componentes e impressão |
| `js/config.js` | Modo (demonstração ou coleta), URL da planilha, responsável e contato |
| `js/base.js` | Utilitários e referências: faixas, metas, linhas, matriz do Quadro 5 |
| `js/dados-ficticios.js` | Gerador da base fictícia, calibrado com os números da V1 |
| `js/repositorio.js` | Dados no localStorage, perfis simulados, evidências de teste, esvaziar e importar |
| `js/indicadores.js` | Fórmulas dos indicadores (Quadro 5) |
| `js/coleta.js` | Envio das respostas à planilha (com fila sem conexão) e leitura do CSV da planilha |
| `js/layout.js` | Cabeçalho, menu, login simulado, janelas e painel de demonstração |
| `coleta/apps-script.gs` | Script da planilha: recebe as respostas e grava uma linha por egresso |

**Paleta (Manual de Identidade Visual da UFSC):** azul `#003893` (Pantone 2728 C), amarelo `#FEE300` (Pantone Yellow C), vermelho `#FF0009` (Pantone 1788 C) e verde `#009206` (Pantone 355 C). Fonte: Verdana. Em textos, verde e vermelho usam tons mais escuros para manter o contraste.

## Perfis simulados (demonstração)

O botão do canto superior direito (**Entrar com idUFSC**) troca o perfil:

| Perfil | O que pode fazer |
|---|---|
| Egresso (ex.: Rafael Costa Lima) | Cadastro e questionário; painel só na visão pública |
| Secretaria | Painel completo, conferência do Lattes, quadro do Anexo 2 |
| Coordenação | Painel completo |
| Comissão de Autoavaliação | Painel completo; editar, aprovar e devolver fichas |
| Responsável Temático | Painel completo, conferência do Lattes; editar e publicar fichas |
| Visitante | Painel na visão pública (grupos com menos de 5 pessoas ficam ocultos) |

## Roteiro de demonstração (cerca de 5 minutos)

Clique no botão amarelo **Demonstração**. O painel lateral tem as 7 etapas da simulação da seção 5 do EX08, cada uma com o botão **Ir**, e o botão **Preencher com o exemplo do EX08**.

1. Entrar como Rafael Costa Lima.
2. Tela 1: salvar o cadastro (a formação vem da Secretaria; a faixa 2024–2028 é calculada).
3. Confirmar o e-mail pelo link simulado.
4. Tela 2: responder o questionário de 1 ano (link do Lattes na etapa inicial, novo vínculo no IFSC, doutorado, 2 artigos).
5. Tela 3: como Secretaria, conferir o Lattes em **Validações pendentes**.
6. Tela 4: como Comissão, enviar e aprovar a ficha de destaque.
7. Publicar o card na vitrine.

Resultado esperado no painel: dados mínimos passam de **122 para 123 de 212** (57,5% → 58,0%; faltam 6 → 5), a faixa 2024–2028 vai de 69% para 71% e os destaques ficam em 2, 3 e 1, os números modelados na Figura 3 do EX08.

## Testes com usuários (item B12 do backlog)

1. No painel de demonstração, clique em **Novo testador**.
2. A pessoa preenche o cadastro e o questionário sozinha, sem o preenchimento automático (que não entra nas evidências).
3. No fim do questionário, ela marca a facilidade de 1 a 7 e pode deixar um comentário.
4. Exporte **Evidências (CSV)**: tempo de cada tela, erros de validação por campo e facilidade. Nenhum nome é guardado; cada sessão recebe um código (T01, T02…).
5. Se os testes forem feitos em computadores diferentes, exporte **Testes (JSON)** em cada um e use **Importar testes** num só.

Critérios propostos: questionário respondido em até 8 minutos, facilidade média de pelo menos 5 e nenhum campo com erro em mais da metade das sessões.

## Limitações

- Na demonstração, login idUFSC, envio de e-mails, conexão com o ORCID e consulta ao Lattes são simulados. Os dados ficam só no navegador em uso; limpar os dados de navegação apaga tudo.
- Na coleta, não há login: quem responde em outro aparelho gera outra linha na planilha (a equipe junta pelo e-mail). O e-mail não é confirmado, então o critério "e-mail confirmado" dos dados mínimos fica pendente; a conferência do Lattes é feita no painel local, depois da importação.
- O URL do Apps Script recebe envios de qualquer pessoa (a planilha continua privada). Confira respostas estranhas antes de analisar.
- A vitrine Trajetórias PPGTIC aparece como prévia do card dentro da ficha.
- A implantação institucional (WordPress no domínio UFSC, item B21) continua fora do escopo.

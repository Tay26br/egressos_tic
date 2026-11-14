/* =====================================================================
   config.js — configuração do Observatório. Edite antes de publicar.
   ===================================================================== */
window.OBS_CONFIG = {
  // Como o site funciona:
  //   'auto'          demonstração quando aberto no próprio computador (Live Server ou arquivo)
  //                   e coleta quando publicado na internet (recomendado);
  //   'demonstracao'  base fictícia, painel de demonstração e login simulado;
  //   'coleta'        começa vazio, mostra só cadastro e questionário e envia as respostas para a planilha.
  // No próprio computador, dá para testar a coleta abrindo cadastro.html?modo=coleta
  // (e voltar com ?modo=demonstracao).
  modo: 'auto',

  // Endereço do Apps Script da planilha (termina em /exec). Veja o README, passo 2.
  urlColeta: 'https://script.google.com/macros/s/AKfycbyP1Ev96139oGubXq1YxcSFma35bMoALJkM7KE2u_ZVlSmUeF5fC8KB8uImqUUzIG4E/exec',

  // Quem responde pelos dados: aparece no aviso de privacidade do cadastro e no rodapé.
  responsavel: 'Vilson',
  // E-mail para dúvidas e pedidos de correção ou exclusão dos dados.
  contato: '',
};

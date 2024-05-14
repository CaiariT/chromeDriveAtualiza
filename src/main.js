const axios = require('axios');

const url = 'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json';

axios.get(url)
  .then(response => {
    const jsonData = response.data;

    if ('Stable' in jsonData.channels) {
      versaoAtual = jsonData.channels.Stable.version;
      console.log('Versão estável:', versaoAtual);

    } else {
      console.log('Não existe versão estável disponível.');
    }
  })
  .catch(error => {
    console.error('Erro ao fazer solicitação HTTP:', error.message);
  });

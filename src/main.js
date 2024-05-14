const axios = require('axios');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const unzipper = require('unzipper');

const urlBase = 'https://storage.googleapis.com/chrome-for-testing-public/';

// Função para baixar o arquivo e descompactá-lo
function baixarEDescompactarArquivo(url, destino) {
  return axios({
    method: 'get',
    url: url,
    responseType: 'stream' // Para garantir que recebemos o arquivo como um stream
  })
  .then(response => {
    // Descompactar o stream de resposta
    const unzipStream = response.data.pipe(unzipper.Parse());

    return new Promise((resolve, reject) => {
      unzipStream.on('entry', entry => {
        const fileName = entry.path;
        const filePath = path.join(destino, fileName);

        // Criar diretórios se o arquivo estiver em uma subpasta
        if (fileName.includes('/')) {
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Salvar arquivo
        entry.pipe(fs.createWriteStream(filePath));
      });

      unzipStream.on('close', () => {
        console.log('Arquivo descompactado com sucesso em:', destino);
        resolve();
      });

      unzipStream.on('error', error => {
        reject(error);
      });
    });
  });
}

const versionUrl = 'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json';
axios.get(versionUrl)
  .then(response => {
    const jsonData = response.data;

    if ('Stable' in jsonData.channels) {
      const versaoAtual = jsonData.channels.Stable.version;
      console.log('Versão estável:', versaoAtual);

      const urlCompleta = `${urlBase}${versaoAtual}/win64/chromedriver-win64.zip`;
      console.log('URL completa:', urlCompleta);

      const dirPath = path.join(__dirname, '..', 'docs');
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
        console.log('Pasta "docs" criada com sucesso.');
      }

      baixarEDescompactarArquivo(urlCompleta, dirPath)
        .catch(error => {
          console.error('Erro ao baixar e descompactar o arquivo:', error.message);
        });
    } else {
      console.log('Não existe versão estável disponível.');
    }
  })
  .catch(error => {
    console.error('Erro ao fazer solicitação HTTP:', error.message);
  });

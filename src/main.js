const axios = require('axios');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

const urlBase = 'https://storage.googleapis.com/chrome-for-testing-public/';

// Função para baixar o arquivo e descompactá-lo
async function baixarEDescompactarArquivo(url, destino) {
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });

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
        console.log('Arquivo salvo:', filePath);
      });

      unzipStream.on('close', () => {
        console.log('Arquivo descompactado com sucesso em:', destino);
        resolve();
      });

      unzipStream.on('error', error => {
        reject(error);
      });
    });
  } catch (error) {
    throw new Error(`Erro ao baixar e descompactar o arquivo: ${error.message}`);
  }
}

const versionUrl = 'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json';
axios.get(versionUrl)
  .then(async response => {
    const jsonData = response.data;

    if ('Stable' in jsonData.channels) {
      const versaoAtual = jsonData.channels.Stable.version;
      console.log('Versão estável:', versaoAtual);

      const urlCompleta = `${urlBase}${versaoAtual}/win64/chromedriver-win64.zip`;
      console.log('URL completa:', urlCompleta);

      const dirPath = process.env.DIR_PATH || path.join(__dirname, '..', 'docs');
      console.log('Diretório de destino:', dirPath);

      // Limpar o diretório de destino antes de extrair os arquivos
      fs.rmdirSync(dirPath, { recursive: true });
      console.log('Diretório de destino limpo:', dirPath);

      // Criar o diretório de destino se não existir
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log('Pasta "docs" criada com sucesso.');
      }

      await baixarEDescompactarArquivo(urlCompleta, dirPath);

      // Verificar se os arquivos foram extraídos corretamente
      const arquivosExtraidos = fs.readdirSync(dirPath);
      if (arquivosExtraidos.length === 0) {
        console.error('Nenhum arquivo encontrado na pasta de destino.');
        process.exit(1);
      }
    } else {
      console.log('Não existe versão estável disponível.');
    }
  })
  .catch(error => {
    console.error('Erro ao fazer solicitação HTTP:', error.message);
    process.exit(1); // Encerrar com código de erro
  });

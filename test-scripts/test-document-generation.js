import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obter __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração
const API_BASE_URL = 'http://localhost:3001';
const TEMPLATE_NAME = 'termo_retirada_template.docx';
const OUTPUT_FILE = path.join(process.env.USERPROFILE, 'Desktop', 'termo_retirada_gerado.docx');

// Dados de teste
const testData = JSON.stringify({
  templateName: TEMPLATE_NAME,
  data: {
    nomeColaborador: 'João da Silva',
    cargoColaborador: 'Analista de TI',
    dataRetirada: new Date().toLocaleDateString('pt-BR'),
    itens: [
      {
        descricao: 'Notebook Dell',
        quantidade: 1,
        numeroSerie: 'ABC123',
        ca: 'CA001'
      },
      {
        descricao: 'Mouse sem fio',
        quantidade: 2,
        numeroSerie: 'XYZ789',
        ca: 'CA002'
      }
    ],
    totalItens: 3,
    tipoDocumento: 'Termo de Retirada'
  }
});

// Função para testar a geração de documento
function testDocumentGeneration() {
  console.log('Iniciando teste de geração de documento...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/generate-document',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData),
      'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
  };

  console.log(`Enviando requisição para ${API_BASE_URL}/generate-document`);
  
  const req = http.request(options, (res) => {
    console.log(`Status da resposta: ${res.statusCode}`);
    
    if (res.statusCode !== 200) {
      console.error('Erro ao gerar documento. Status:', res.statusCode);
      res.setEncoding('utf8');
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('Resposta do servidor:', responseData);
        console.log('\nDicas de solução de problemas:');
        console.log('1. Verifique se o servidor está rodando na porta 3001');
        console.log('2. Confirme se o arquivo de template existe no diretório correto');
        console.log('3. Verifique os logs do servidor para mais detalhes');
      });
      
      return;
    }
    
    // Preparar para receber os dados binários
    const chunks = [];
    
    res.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    res.on('end', () => {
      const buffer = Buffer.concat(chunks);
      
      // Salvar o arquivo gerado
      fs.writeFile(OUTPUT_FILE, buffer, (err) => {
        if (err) {
          console.error('Erro ao salvar o arquivo:', err);
          return;
        }
        
        console.log('Documento gerado com sucesso!');
        console.log(`Arquivo salvo em: ${OUTPUT_FILE}`);
      });
    });
  });
  
  req.on('error', (error) => {
    console.error('Erro na requisição:', error.message);
    console.log('\nDicas de solução de problemas:');
    console.log('1. Verifique se o servidor está rodando na porta 3001');
    console.log('2. Confirme se o arquivo de template existe no diretório correto');
  });
  
  // Enviar os dados da requisição
  req.write(testData);
  req.end();
}

// Executar o teste
console.log('Verificando ambiente de teste...');
console.log(`Diretório atual: ${__dirname}`);
console.log(`URL da API: ${API_BASE_URL}`);
console.log(`Template: ${TEMPLATE_NAME}\n`);

testDocumentGeneration();

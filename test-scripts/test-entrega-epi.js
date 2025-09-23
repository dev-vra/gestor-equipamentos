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
const TEMPLATE_NAME = 'termo_entrega_epi_template.docx';
const OUTPUT_FILE = path.join(process.env.USERPROFILE, 'Desktop', 'teste_entrega_epi.docx');

// Dados de teste para Entrega de EPI
const testData = {
  templateName: TEMPLATE_NAME,
  data: {
    nomeColaborador: 'João da Silva',
    cargoColaborador: 'Técnico de Segurança',
    dataEntrega: new Date().toLocaleDateString('pt-BR'),
    itens: [
      {
        descricao: 'Capacete de Segurança',
        quantidade: 2,
        numeroSerie: 'CAP-001',
        ca: '12345'
      },
      {
        descricao: 'Luvas de Proteção',
        quantidade: 5,
        numeroSerie: 'LUV-001',
        ca: '12346'
      }
    ],
    totalItens: 7,
    tipoDocumento: 'Termo de Entrega de EPI'
  }
};

console.log('Iniciando teste de geração de Termo de Entrega de EPI...');
console.log(`URL da API: ${API_BASE_URL}`);
console.log(`Template: ${TEMPLATE_NAME}`);
console.log('Dados do documento:', JSON.stringify(testData, null, 2));

// Criar a requisição HTTP
const req = http.request(
  `${API_BASE_URL}/generate-document`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
  },
  (res) => {
    console.log(`Status da resposta: ${res.statusCode}`);
    
    if (res.statusCode !== 200) {
      console.error('Erro ao gerar documento. Status:', res.statusCode);
      res.pipe(process.stderr);
      return;
    }
    
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    
    res.on('end', () => {
      const buffer = Buffer.concat(chunks);
      
      // Salvar o arquivo
      fs.writeFileSync(OUTPUT_FILE, buffer);
      console.log(`\n✅ Documento gerado com sucesso!`);
      console.log(`📄 Arquivo salvo em: ${OUTPUT_FILE}`);
      console.log(`📏 Tamanho do arquivo: ${(buffer.length / 1024).toFixed(2)} KB`);
    });
  }
);

req.on('error', (error) => {
  console.error('Erro na requisição:', error);
});

// Enviar os dados
req.write(JSON.stringify(testData));
req.end();

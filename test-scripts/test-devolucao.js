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
const TEMPLATE_NAME = 'termo_devolucao_template.docx';
const OUTPUT_FILE = path.join(process.env.USERPROFILE, 'Desktop', 'teste_devolucao.docx');

// Dados de teste para Devolução
const testData = {
  templateName: TEMPLATE_NAME,
  data: {
    nomeColaborador: 'Maria Oliveira',
    cargoColaborador: 'Engenheira Civil',
    dataDevolucao: new Date().toLocaleDateString('pt-BR'),
    itens: [
      {
        descricao: 'Notebook Dell',
        quantidade: 1,
        numeroSerie: 'NB-DELL-001',
        estado: 'Em bom estado'
      },
      {
        descricao: 'Mouse sem fio',
        quantidade: 1,
        numeroSerie: 'MS-LOGI-001',
        estado: 'Arranhado, mas funcional'
      }
    ],
    totalItens: 2,
    tipoDocumento: 'Termo de Devolução'
  }
};

console.log('Iniciando teste de geração de Termo de Devolução...');
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
      console.log(`\n✅ Documento de devolução gerado com sucesso!`);
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

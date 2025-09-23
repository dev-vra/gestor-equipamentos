// server.js
import express from 'express';
import cors from 'cors';
import { createReport } from 'docx-templates';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuração básica do CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Responde imediatamente para requisições OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rota de teste
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Rota para gerar documentos
app.post('/generate-document', async (req, res) => {
  console.log('Recebida requisição para gerar documento');
  
  try {
    const { templateName, data } = req.body;
    
    if (!templateName) {
      return res.status(400).json({ error: 'Nome do template é obrigatório' });
    }

    const templatePath = path.join(__dirname, 'public', 'templates', templateName);
    console.log('Caminho do template:', templatePath);
    
    // Verifica se o arquivo do template existe
    if (!fs.existsSync(templatePath)) {
      console.error('Arquivo de template não encontrado:', templatePath);
      return res.status(404).json({ 
        error: 'Template não encontrado',
        path: templatePath
      });
    }

    console.log('Lendo arquivo do template...');
    const template = fs.readFileSync(templatePath);
    
    console.log('Criando relatório...');
    const report = await createReport({
      template,
      data,
      cmdDelimiter: ['{', '}'],
    });

    const fileName = templateName.replace('_template', '');
    
    console.log('Enviando documento gerado...');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${fileName}`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    res.send(Buffer.from(report));
    console.log('Documento enviado com sucesso');
  } catch (error) {
    console.error('Erro ao gerar documento:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar documento',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Rota para listar templates disponíveis
app.get('/api/templates', (req, res) => {
  try {
    const templatesDir = path.join(__dirname, 'public', 'templates');
    if (!fs.existsSync(templatesDir)) {
      return res.status(404).json({ error: 'Diretório de templates não encontrado' });
    }
    
    const files = fs.readdirSync(templatesDir)
      .filter(file => file.endsWith('.docx'))
      .map(file => ({
        name: file,
        path: path.join('templates', file)
      }));
    
    res.json({ templates: files });
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    res.status(500).json({ 
      error: 'Erro ao listar templates',
      message: error.message
    });
  }
});

// Rota para servir arquivos estáticos (opcional)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rota para verificar se o servidor está rodando
app.get('/', (req, res) => {
  res.send('Servidor de geração de documentos está rodando!');
});

// Tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📄 Acesse a rota de teste: http://localhost:${PORT}/api/health`);
  console.log(`📂 Diretório de templates: ${path.join(__dirname, 'public', 'templates')}\n`);
});
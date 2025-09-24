// server.js
import express from 'express';
import cors from 'cors';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Parser personalizado para lidar com expressões complexas
function angularParser(tag) {
    if (tag === '.') {
        return {
            get: function(scope) {
                return scope;
            }
        };
    }
    const expr = tag
        .replace(/(’|')/g, '"')
        .replace(/([^\\])"/g, '$1\\"');

    return {
        get: function(scope) {
            try {
                return new Function(
                    'scope',
                    `with (scope) { 
                        try { 
                            return ${expr}; 
                        } catch(e) { 
                            console.error('Error in expression:', e); 
                            return ''; 
                        } 
                    }`
                )(scope);
            } catch (e) {
                console.error('Parser error:', e);
                return '';
            }
        }
    };
}

// Rota de saúde para teste
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor está funcionando' });
});

// Rota para gerar documentos
app.post('/generate-document', async (req, res) => {
    console.log('Recebida requisição para gerar documento:', req.body.templateName);
    console.log('Dados recebidos:', JSON.stringify(req.body.data, null, 2));
    
    try {
        const { templateName, data } = req.body;
        
        if (!templateName || !data) {
            const errorMsg = !templateName ? 'templateName é obrigatório' : 'data é obrigatório';
            console.error('Erro de validação:', errorMsg);
            return res.status(400).json({ 
                error: "Dados inválidos", 
                message: errorMsg 
            });
        }

        const templatePath = path.join(process.cwd(), 'public', 'templates', templateName);
        console.log('Procurando template em:', templatePath);
        
        // Verifica se o template existe
        if (!fs.existsSync(templatePath)) {
            const errorMsg = `O arquivo ${templateName} não foi encontrado na pasta de templates`;
            console.error('Erro:', errorMsg);
            return res.status(404).json({ 
                error: "Template não encontrado", 
                message: errorMsg 
            });
        }

        // Lê o template
        console.log('Lendo o arquivo do template...');
        const content = fs.readFileSync(templatePath, 'binary');
        
        try {
            console.log('Inicializando PizZip...');
            const zip = new PizZip(content);
            
            console.log('Inicializando Docxtemplater...');
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                parser: angularParser,
                nullGetter: () => ''
            });

            // Processa o template com os dados
            console.log('Renderizando o documento...');
            try {
                doc.render(data);
                console.log('Documento renderizado com sucesso!');
            } catch (renderError) {
                console.error('Erro ao renderizar o documento:', renderError);
                console.error('Detalhes do erro:', {
                    message: renderError.message,
                    properties: renderError.properties,
                    stack: renderError.stack
                });
                throw renderError;
            }

            // Gera o documento
            console.log('Gerando o buffer do documento...');
            const buffer = doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE'
            });

            // Configura os cabeçalhos da resposta
            console.log('Enviando o documento gerado...');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename=documento_gerado_${Date.now()}.docx`);
            
            // Envia o documento gerado
            res.send(buffer);
            console.log('Documento enviado com sucesso!');

        } catch (error) {
            console.error('Erro durante o processamento do documento:', error);
            // Se for um erro de validação do docxtemplater, retorne mais detalhes
            if (error.properties && error.properties.errors && Array.isArray(error.properties.errors)) {
                const errorDetails = error.properties.errors.map(err => ({
                    id: err.id,
                    message: err.message,
                    explanation: err.explanation,
                    name: err.name,
                    stack: err.stack
                }));
                
                console.error('Erros de validação do template:', errorDetails);
                return res.status(400).json({
                    error: "Erro de template",
                    message: "Erro ao processar o template do documento",
                    details: errorDetails
                });
            }
            
            // Para outros tipos de erro, retorne uma mensagem genérica
            res.status(500).json({ 
                error: "Erro ao gerar documento", 
                message: error.message || "Ocorreu um erro inesperado",
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    } catch (error) {
        console.error('Erro inesperado:', error);
        res.status(500).json({ 
            error: "Erro interno do servidor",
            message: "Ocorreu um erro inesperado ao processar a requisição",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({ 
        error: "Erro interno do servidor", 
        message: "Ocorreu um erro inesperado" 
    });
});

// Inicia o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📄 Acesse a rota de teste: http://localhost:${PORT}/api/health`);
    console.log(`📂 Diretório de templates: ${path.join(process.cwd(), 'public', 'templates')}`);
});
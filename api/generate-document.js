// Ficheiro: api/generate-document.js (Função Serverless da Vercel)
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

// O handler principal da função
export default async function handler(req, res) {
  // A Vercel gere o CORS, mas é boa prática adicionar estes cabeçalhos
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Tratar pedidos OPTIONS (necessário para o CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Apenas o método POST é permitido' });
  }

  try {
    const { templateName, data } = req.body;

    // Caminho para os ficheiros na Vercel
    const templatePath = path.join(process.cwd(), 'public', 'templates', templateName);
    
    if (!fs.existsSync(templatePath)) {
        return res.status(404).json({ message: `Template '${templateName}' não encontrado.` });
    }
    
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    doc.render(data);

    const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.status(200).send(buffer);

  } catch (error) {
    console.error(error); // O log aparecerá no painel da Vercel
    res.status(500).json({ message: 'Erro interno ao gerar o documento', error: error.message });
  }
};
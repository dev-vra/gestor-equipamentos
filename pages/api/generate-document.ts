import { NextApiRequest, NextApiResponse } from 'next';
import { createReport } from 'docx-templates';
import { Blob } from 'buffer';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { templateName, data } = req.body;
    
    // Caminho para a pasta de templates
    const templatesDir = path.join(process.cwd(), 'public', 'templates');
    const templatePath = path.join(templatesDir, templateName);

    // Lê o arquivo do template
    const template = fs.readFileSync(templatePath);

    // Cria o documento
    const report = await createReport({
      template,
      data,
      cmdDelimiter: ['{', '}'],
    });

    // Configura os cabeçalhos para download
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${templateName.replace('_template', '')}`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    // Envia o arquivo
    return res.send(Buffer.from(report));
  } catch (error) {
    console.error('Erro ao gerar documento:', error);
    return res.status(500).json({ 
      error: 'Erro ao gerar documento',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { createReport } from 'docx-templates';
import { Blob } from 'buffer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { templateName, data } = req.body;

    // Carrega o template do sistema de arquivos
    const template = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/templates/${templateName}`
    ).then(res => res.arrayBuffer());

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
    return res.status(500).json({ error: 'Erro ao gerar documento' });
  }
}
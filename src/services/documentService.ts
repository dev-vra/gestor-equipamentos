import { saveAs } from 'file-saver';

interface DocumentData {
  [key: string]: unknown;
  
  // Dados do colaborador
  nomeColaborador?: string;
  cargoColaborador?: string;
  
  // Datas
  dataRetirada?: string;
  dataDevolucao?: string;
  dataEntrega?: string;
  
  // Itens
  itens?: Array<{
    descricao: string;
    quantidade: number;
    numeroSerie: string;
    estado?: string;
    avarias?: string;
    ca?: string;
  }>;
  
  // Total
  totalItens?: number;
  
  // Tipo de documento
  tipoDocumento?: string;
}

// URL base da API - aponta para o servidor Express na porta 3001
const API_BASE_URL = 'http://localhost:3001';

/**
 * Gera um documento usando o servidor Express
 * @param templateName Nome do template a ser usado
 * @param data Dados para preencher o template
 * @returns Promise<boolean> true se o documento foi gerado com sucesso
 */
async function generateDocument(templateName: string, data: DocumentData): Promise<boolean> {
  try {
    console.log(`[DocumentService] Gerando documento: ${templateName}`, data);

    const response = await fetch(`${API_BASE_URL}/generate-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      },
      body: JSON.stringify({ 
        templateName, 
        data: {
          ...data,
          dataGeracao: new Date().toISOString()
        } 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro na resposta da API:', errorData);
      throw new Error(errorData.message || 'Erro ao gerar documento');
    }

    const blob = await response.blob();
    
    // Cria um nome de arquivo amigável com a data
    const fileName = `${templateName.replace('_template', '')}_${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}
      .docx`
      .replace(/\s+/g, '_');

    console.log(`[DocumentService] Salvando documento: ${fileName}`);
    saveAs(blob, fileName);
    return true;
  } catch (error) {
    console.error('[DocumentService] Erro ao gerar documento:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Ocorreu um erro inesperado ao gerar o documento.'
    );
  }
}

/**
 * Gera um Termo de Retirada
 */
export const generateTermoRetirada = (data: DocumentData) =>
  generateDocument('termo_retirada_template.docx', {
    ...data,
    tipoDocumento: 'Termo de Retirada',
    dataRetirada: data.dataRetirada || new Date().toLocaleDateString('pt-BR')
  });

/**
 * Gera um Termo de Devolução
 */
export const generateTermoDevolucao = (data: DocumentData) =>
  generateDocument('termo_devolucao_template.docx', {
    ...data,
    tipoDocumento: 'Termo de Devolução',
    dataDevolucao: data.dataDevolucao || new Date().toLocaleDateString('pt-BR')
  });

/**
 * Gera um Termo de Entrega de EPI
 */
export const generateTermoEntregaEPI = (data: DocumentData) =>
  generateDocument('termo_entrega_epi_template.docx', {
    ...data,
    tipoDocumento: 'Termo de Entrega de EPI',
    dataEntrega: data.dataEntrega || new Date().toLocaleDateString('pt-BR')
  });
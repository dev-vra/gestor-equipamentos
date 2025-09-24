import React from 'react';
import { Button } from './ui/button';
import { 
  generateTermoRetirada, 
  generateTermoDevolucao, 
  generateTermoEntregaEPI 
} from '@/services/documentService';


interface DocumentGeneratorProps {
  type: 'retirada' | 'devolucao' | 'entrega-epi';
  data: {
    // Dados comuns
    nomeColaborador: string;
    matricula: string;
    data: string;
    
    // Dados específicos para cada tipo de documento
    [key: string]: any;
  };
  children: React.ReactNode;
  className?: string;
}

export function DocumentGenerator({ 
  type, 
  data, 
  children, 
  className = '' 
}: DocumentGeneratorProps) {
  const handleGenerateDocument = async () => {
    try {
      let success = false;
      
      switch (type) {
        case 'retirada':
          success = await generateTermoRetirada(data);
          break;
        case 'devolucao':
          success = await generateTermoDevolucao(data);
          break;
        case 'entrega-epi':
          success = await generateTermoEntregaEPI(data);
          break;
        default:
          console.error('Tipo de documento não suportado');
          return;
      }
      
      if (success) {
        console.log('Documento gerado com sucesso!');
      } else {
        console.error('Falha ao gerar o documento');
      }
    } catch (error) {
      console.error('Erro ao gerar documento:', error);
    }
  };

  return (
    <Button 
      onClick={handleGenerateDocument}
      className={className}
    >
      {children}
    </Button>
  );
}

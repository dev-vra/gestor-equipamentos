const fs = require('fs');
const path = require('path');

// Caminho para o diretório de templates
const templatesDir = path.join(__dirname, '..', 'public', 'templates');

console.log('Verificando diretório de templates...');
console.log(`Caminho: ${templatesDir}\n`);

// Verificar se o diretório existe
if (!fs.existsSync(templatesDir)) {
  console.error('ERRO: Diretório de templates não encontrado!');
  console.log('\nCertifique-se de que o diretório existe e contém os templates necessários:');
  console.log('   - termo_retirada_template.docx');
  console.log('   - termo_devolucao_template.docx');
  console.log('   - termo_entrega_epi_template.docx\n');
  process.exit(1);
}

try {
  // Listar arquivos no diretório
  const files = fs.readdirSync(templatesDir);
  const docxFiles = files.filter(file => file.endsWith('.docx'));
  
  if (docxFiles.length === 0) {
    console.log('Nenhum arquivo .docx encontrado no diretório de templates.');
  } else {
    console.log('Templates encontrados:');
    console.log('='.repeat(60));
    
    docxFiles.forEach((file, index) => {
      const filePath = path.join(templatesDir, file);
      const stats = fs.statSync(filePath);
      const fileSize = (stats.size / 1024).toFixed(2);
      
      console.log(`\n${index + 1}. ${file}`);
      console.log(`   Tamanho: ${fileSize} KB`);
      console.log(`   Caminho: ${filePath}`);
      
      // Verificar se o arquivo não está vazio
      if (stats.size === 0) {
        console.warn('   AVISO: O arquivo está vazio!');
      }
    });
    
    console.log('\n' + '='.repeat(60));
    
    // Verificar se todos os templates necessários estão presentes
    const requiredTemplates = [
      'termo_retirada_template.docx',
      'termo_devolucao_template.docx',
      'termo_entrega_epi_template.docx'
    ];
    
    const missingTemplates = requiredTemplates.filter(template => 
      !files.includes(template)
    );
    
    if (missingTemplates.length > 0) {
      console.warn('\nATENÇÃO: Alguns templates obrigatórios não foram encontrados:');
      missingTemplates.forEach(template => {
        console.log(`   - ${template}`);
      });
      console.log('\nCertifique-se de que todos os templates necessários estão presentes no diretório.');
    } else {
      console.log('\nTodos os templates obrigatórios estão presentes!');
    }
  }
  
  console.log('\nVerificação concluída com sucesso!');
} catch (error) {
  console.error('\nERRO ao verificar os templates:', error.message);
  process.exit(1);
}

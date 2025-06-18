/**
 * Exemplo básico de uso da biblioteca DOCX Parser
 */

import { readFileSync } from 'fs';

import { extractText, getMetadata, parseDocx } from '../src';

async function exemploBasico() {
  console.log('🚀 Exemplo básico de uso da DOCX Parser\n');

  // Carrega um arquivo DOCX
  // const buffer = readFileSync('./documento.docx');

  // Para este exemplo, vamos usar um buffer fictício que representaria um arquivo DOCX válido
  // Em uso real, você carregaria um arquivo DOCX de verdade
  console.log('⚠️  Nota: Este exemplo usa dados fictícios. Em uso real, carregue um arquivo DOCX válido.\n');

  try {
    // 1. Parse incremental (recomendado para documentos grandes)
    console.log('📄 1. Parse incremental:');

    // const elements = [];
    // for await (const element of parseDocx(buffer)) {
    //   elements.push(element);
    //   console.log(`- ${element.type}: ${element.id}`);
    //
    //   if (element.type === 'paragraph') {
    //     console.log(`  Texto: "${element.content}"`);
    //   } else if (element.type === 'image') {
    //     console.log(`  Imagem: ${element.metadata?.filename} (${element.metadata?.format})`);
    //   } else if (element.type === 'table') {
    //     console.log(`  Tabela: ${element.content.length} linhas`);
    //   }
    // }

    console.log('  (Use um arquivo DOCX real para ver os elementos)\n');

    // 2. Extração de texto apenas
    console.log('📝 2. Extração de texto:');

    // const texto = await extractText(buffer, {
    //   preserveFormatting: true
    // });
    // console.log(`Texto extraído: "${texto}"\n`);

    console.log('  (Use um arquivo DOCX real para extrair texto)\n');

    // 3. Extração de metadados
    console.log('📊 3. Metadados do documento:');

    // const metadata = await getMetadata(buffer);
    // console.log(`Título: ${metadata.title || 'N/A'}`);
    // console.log(`Autor: ${metadata.author || 'N/A'}`);
    // console.log(`Criado em: ${metadata.created || 'N/A'}`);
    // console.log(`Modificado em: ${metadata.modified || 'N/A'}\n`);

    console.log('  (Use um arquivo DOCX real para ver metadados)\n');

    console.log('✅ Exemplo concluído! Para testar com arquivo real:');
    console.log('   1. Coloque um arquivo .docx na pasta do projeto');
    console.log('   2. Descomente o código acima');
    console.log('   3. Execute: npm run build && node dist/examples/basic-usage.js');

  } catch (error) {
    console.error('❌ Erro:', error instanceof Error ? error.message : error);
  }
}

// Executa o exemplo se este arquivo for executado diretamente
if (require.main === module) {
  exemploBasico().catch(console.error);
}

export { exemploBasico };

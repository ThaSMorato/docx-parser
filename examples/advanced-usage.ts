/**
 * Exemplo avançado de uso da biblioteca DOCX Parser
 */

import { writeFileSync } from 'fs';

import type { ParseOptions } from '../src';
import { extractImages, parseDocx, parseDocxFile } from '../src';

async function exemploAvancado() {
  console.log('🚀 Exemplo avançado de uso da DOCX Parser\n');

  // Para demonstrar diferentes cenários de uso
  console.log('⚠️  Nota: Este exemplo mostra diferentes cenários. Em uso real, use arquivos DOCX válidos.\n');

  // Cenário 1: Processamento seletivo de conteúdo
  console.log('🎯 1. Processamento seletivo de conteúdo:');

  const opcoesSeletivas: ParseOptions = {
    includeMetadata: false,      // Não queremos metadados
    includeImages: true,         // Queremos imagens
    includeTables: true,         // Queremos tabelas
    includeHeaders: false,       // Não queremos cabeçalhos
    includeFooters: false,       // Não queremos rodapés
    normalizeWhitespace: true,   // Normalizar espaços
    maxImageSize: 5 * 1024 * 1024, // Máximo 5MB por imagem
  };

  // const buffer = readFileSync('./documento.docx');
  // let contadores = { paragrafos: 0, tabelas: 0, imagens: 0 };

  // for await (const element of parseDocx(buffer, opcoesSeletivas)) {
  //   switch (element.type) {
  //     case 'paragraph':
  //       contadores.paragrafos++;
  //       console.log(`📄 Parágrafo ${contadores.paragrafos}: ${element.content.substring(0, 50)}...`);
  //       break;
  //     case 'table':
  //       contadores.tabelas++;
  //       console.log(`📊 Tabela ${contadores.tabelas}: ${element.content.length} linhas, ${element.content[0]?.cells.length || 0} colunas`);
  //       break;
  //     case 'image':
  //       contadores.imagens++;
  //       console.log(`🖼️  Imagem ${contadores.imagens}: ${element.metadata?.filename} (${element.metadata?.format})`);
  //       break;
  //   }
  // }

  console.log('  (Use um arquivo DOCX real para ver o processamento seletivo)\n');

  // Cenário 2: Extração e salvamento de imagens
  console.log('🖼️  2. Extração e salvamento de imagens:');

  // let imagemCount = 0;
  // for await (const image of extractImages(buffer)) {
  //   imagemCount++;
  //   const nomeArquivo = image.metadata?.filename || `imagem_${imagemCount}.${image.metadata?.format}`;
  //   const caminhoSaida = `./output/imagens/${nomeArquivo}`;
  //
  //   try {
  //     writeFileSync(caminhoSaida, image.content);
  //     console.log(`💾 Imagem salva: ${caminhoSaida} (${image.content.length} bytes)`);
  //   } catch (error) {
  //     console.log(`❌ Erro ao salvar ${nomeArquivo}: ${error}`);
  //   }
  // }

  console.log('  (Use um arquivo DOCX real para extrair imagens)\n');

  // Cenário 3: Processamento de arquivo grande com streaming
  console.log('🌊 3. Processamento streaming de arquivo grande:');

  const opcoesStreaming: ParseOptions = {
    chunkSize: 32 * 1024,       // Chunks de 32KB
    concurrent: true,           // Processamento paralelo
    includeImages: false,       // Não carregar imagens para economizar memória
    normalizeWhitespace: true,
  };

  // let totalElementos = 0;
  // let totalTexto = 0;

  // for await (const element of parseDocxFile('./documento-grande.docx', opcoesStreaming)) {
  //   totalElementos++;
  //
  //   if (element.type === 'paragraph') {
  //     totalTexto += element.content.length;
  //   }
  //
  //   // Processa em lotes para não sobrecarregar a memória
  //   if (totalElementos % 100 === 0) {
  //     console.log(`📊 Processados ${totalElementos} elementos, ${totalTexto} caracteres de texto`);
  //   }
  // }

  console.log('  (Use um arquivo DOCX grande para ver o streaming)\n');

  // Cenário 4: Análise de tabelas complexas
  console.log('📋 4. Análise de tabelas complexas:');

  const opcoesTabelas: ParseOptions = {
    includeMetadata: false,
    includeImages: false,
    includeTables: true,
    preserveFormatting: true,
  };

  // for await (const element of parseDocx(buffer, opcoesTabelas)) {
  //   if (element.type === 'table') {
  //     console.log(`📊 Tabela encontrada:`);
  //     console.log(`   - Linhas: ${element.content.length}`);
  //     console.log(`   - Colunas: ${element.content[0]?.cells.length || 0}`);
  //
  //     // Mostra o cabeçalho se existir
  //     if (element.content[0]?.isHeader) {
  //       const cabecalho = element.content[0].cells.map(c => c.content).join(' | ');
  //       console.log(`   - Cabeçalho: ${cabecalho}`);
  //     }
  //
  //     // Mostra as primeiras linhas de dados
  //     const linhasDados = element.content.filter(row => !row.isHeader).slice(0, 3);
  //     linhasDados.forEach((linha, i) => {
  //       const dados = linha.cells.map(c => c.content).join(' | ');
  //       console.log(`   - Linha ${i + 1}: ${dados}`);
  //     });
  //
  //     if (element.content.length > 4) {
  //       console.log(`   - ... e mais ${element.content.length - 4} linhas`);
  //     }
  //     console.log('');
  //   }
  // }

  console.log('  (Use um arquivo DOCX com tabelas para ver a análise)\n');

  console.log('✅ Exemplos avançados concluídos!');
  console.log('💡 Dicas:');
  console.log('   - Use processamento seletivo para melhor performance');
  console.log('   - Configure chunkSize baseado no tamanho dos documentos');
  console.log('   - Desative imagens para documentos grandes se não precisar');
  console.log('   - Use streaming para arquivos muito grandes');
}

// Função utilitária para criar diretório de saída
function criarDiretorioSaida() {
  const fs = require('fs');
  const path = require('path');

  const outputDir = path.join(process.cwd(), 'output', 'imagens');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

// Executa o exemplo se este arquivo for executado diretamente
if (typeof require !== 'undefined' && require.main === module) {
  criarDiretorioSaida();
  exemploAvancado().catch(console.error);
}

export { exemploAvancado };

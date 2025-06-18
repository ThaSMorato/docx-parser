/**
 * Exemplo prático: Usando ReadStream normal com a biblioteca DOCX Parser
 *
 * Este exemplo demonstra:
 * - Como usar ReadStream do Node.js (fs.createReadStream)
 * - Como usar StreamAdapter para conversões manuais
 * - Diferenças entre parseDocxStream e parseDocxWebStream
 */

import { createReadStream } from 'fs';

import { parseDocxStream, parseDocxWebStream, StreamAdapter } from '../src';

// Exemplo 1: Usando ReadStream normal (Node.js)
async function exemploReadStreamNormal() {
  console.log('=== Exemplo: ReadStream Normal (Node.js) ===');

  // Cria um ReadStream do Node.js (fs)
  const fileStream = createReadStream('./exemplo.docx');

  // Usa parseDocxStream que aceita ReadStream do Node.js
  console.log('📁 Processando arquivo com ReadStream normal...');

  try {
    for await (const element of parseDocxStream(fileStream)) {
      console.log(`Tipo: ${element.type}`);

      if (element.type === 'paragraph') {
        console.log(`  Texto: ${element.content}`);
      } else if (element.type === 'image') {
        console.log(`  Imagem: ${element.metadata?.filename || 'sem nome'}`);
      }
    }
  } catch (error) {
    console.log('⚠️ Arquivo não encontrado - isso é esperado neste exemplo');
  }
}

// Exemplo 2: Conversão manual usando StreamAdapter
async function exemploConversaoManual() {
  console.log('\n=== Exemplo: Conversão Manual com StreamAdapter ===');

  const fileStream = createReadStream('./exemplo.docx');

  // Converte ReadStream para ReadableStream da web manualmente
  const webStream = StreamAdapter.toWebStream(fileStream);

  console.log('🔄 Convertendo ReadStream para ReadableStream da web...');

  try {
    // Usa parseDocxWebStream que aceita ReadableStream da web
    for await (const element of parseDocxWebStream(webStream)) {
      console.log(`Elemento: ${element.type}`);
    }
  } catch (error) {
    console.log('⚠️ Arquivo não encontrado - isso é esperado neste exemplo');
  }
}

// Exemplo 3: Comparando as duas abordagens
async function exemploComparacao() {
  console.log('\n=== Exemplo: Comparação das Abordagens ===');

  console.log('📋 Método 1 - ReadStream direto:');
  console.log('const stream = createReadStream("arquivo.docx");');
  console.log('parseDocxStream(stream); // Usa ReadStream do Node.js');

  console.log('\n📋 Método 2 - ReadableStream da web:');
  console.log('const nodeStream = createReadStream("arquivo.docx");');
  console.log('const webStream = StreamAdapter.toWebStream(nodeStream);');
  console.log('parseDocxWebStream(webStream); // Usa ReadableStream da web');

  console.log('\n💡 Recomendação: Use parseDocxStream para ReadStream normal');
  console.log('   É mais simples e eficiente para casos básicos');
}

// Exemplo 4: Utilities do StreamAdapter
async function exemploUtilitiesStream() {
  console.log('\n=== Exemplo: Utilities do StreamAdapter ===');

  const buffer = Buffer.from('Conteúdo de exemplo');

  // Converte Buffer para ReadableStream
  const streamFromBuffer = StreamAdapter.fromBuffer(buffer);
  console.log('✅ Buffer convertido para ReadableStream');

  // Converte ReadableStream de volta para Buffer
  const bufferFromStream = await StreamAdapter.toBuffer(streamFromBuffer);
  console.log('✅ ReadableStream convertido para Buffer');
  console.log(`📄 Conteúdo: ${bufferFromStream.toString()}`);
}

// Executa todos os exemplos
async function executarExemplos() {
  console.log('🚀 Demonstração: ReadStream vs ReadableStream\n');

  await exemploReadStreamNormal();
  await exemploConversaoManual();
  await exemploComparacao();
  await exemploUtilitiesStream();

  console.log('\n✨ Conclusão:');
  console.log('- Use parseDocxStream() para ReadStream do Node.js (mais simples)');
  console.log('- Use parseDocxWebStream() para ReadableStream da web');
  console.log('- Use StreamAdapter para conversões manuais quando necessário');
}

// Executa apenas se for chamado diretamente (Node.js ESM)
if (import.meta.url === `file://${process.argv[1]}`) {
  executarExemplos().catch(console.error);
}

export {
  exemploReadStreamNormal,
  exemploConversaoManual,
  exemploComparacao,
  exemploUtilitiesStream,
};

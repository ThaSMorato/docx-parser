import type { Readable } from 'node:stream';

import axios from 'axios';

import { parseDocxHttpStream, parseDocxToArray } from '../src';
import type { DocumentElement } from '../src/domain/types';

/**
 * Exemplo prático: Como usar a biblioteca com requisições HTTP
 */

// Exemplo 1: Usando parseDocxHttpStream com generator
async function parseDocxFromUrl(url: string) {
  try {
    console.log(`Fazendo download de: ${url}`);

    // Fazendo requisição com axios e responseType: 'stream'
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream'  // Importante: usar 'stream' não 'buffer'
    });

    console.log('Processando documento DOCX...');

    // Usando o generator para processar incrementalmente
    const elements: DocumentElement[] = [];
    for await (const element of parseDocxHttpStream(response.data)) {
      elements.push(element);

      // Processar cada elemento conforme necessário
      if (element.type === 'paragraph') {
        console.log(`Parágrafo: ${element.content}`);
      } else if (element.type === 'image') {
        console.log(`Imagem encontrada: ${(element as any).metadata?.filename}`);
      }
    }

    console.log(`Processamento concluído: ${elements.length} elementos`);
    return elements;

  } catch (error) {
    console.error('Erro ao processar documento:', error);
    throw error;
  }
}

// Exemplo 2: Usando parseDocxToArray para obter todos os elementos de uma vez
async function parseDocxToArrayFromUrl(url: string) {
  try {
    console.log(`Fazendo download de: ${url}`);

    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream'
    });

    console.log('Convertendo para array...');

    // Usando parseDocxToArray que agora suporta Node.js streams automaticamente
    const elements = await parseDocxToArray(response.data, {
      includeImages: true,
      includeTables: true
    });

    console.log(`Array gerado: ${elements.length} elementos`);

    // Agrupar por tipo
    const grouped = elements.reduce((acc, el) => {
      acc[el.type] = (acc[el.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Elementos por tipo:', grouped);
    return elements;

  } catch (error) {
    console.error('Erro ao processar documento:', error);
    throw error;
  }
}

// Exemplo 3: Tratamento de diferentes tipos de stream automaticamente
async function parseFromAnySource(source: string | Buffer | Readable) {
  try {
    if (typeof source === 'string') {
      // É uma URL
      const response = await axios({
        method: 'get',
        url: source,
        responseType: 'stream'
      });

      // parseDocxToArray detecta automaticamente o tipo de stream
      return await parseDocxToArray(response.data);

    } else {
      // É um Buffer ou Stream
      return await parseDocxToArray(source);
    }

  } catch (error) {
    console.error('Erro ao processar fonte:', error);
    throw error;
  }
}

// Demonstração de uso
async function demonstrateUsage() {
  try {
    console.log('=== Exemplos de uso configurados ===');
    console.log('1. parseDocxFromUrl(url) - Generator-based parsing');
    console.log('2. parseDocxToArrayFromUrl(url) - Array conversion');
    console.log('3. parseFromAnySource(source) - Fonte automática');

    console.log('\n✅ Todos os exemplos foram configurados corretamente!');
    console.log('Para usar, chame as funções com suas URLs reais.');

  } catch (error) {
    console.error('Erro na demonstração:', error);
  }
}

// Executar demonstração
demonstrateUsage();

export {
  parseDocxFromUrl,
  parseDocxToArrayFromUrl,
  parseFromAnySource
};

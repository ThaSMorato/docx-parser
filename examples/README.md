# Exemplos de Uso - DOCX Parser

Este diretório contém exemplos práticos de como usar a biblioteca DOCX Parser.

## 📋 Exemplos Disponíveis

### 1. Uso Básico (`basic-usage.ts`)
Demonstra os conceitos fundamentais:
- Parse incremental de documentos
- Extração de texto
- Extração de metadados
- Tratamento de erros

### 2. Uso Avançado (`advanced-usage.ts`)
Exemplos mais complexos:
- Processamento seletivo de conteúdo
- Extração e salvamento de imagens
- Streaming para arquivos grandes
- Análise de tabelas complexas

## 🚀 Como Executar

### Pré-requisitos
1. Build da biblioteca: `npm run build`
2. Tenha um arquivo DOCX de teste disponível

### Executando os Exemplos

```bash
# Exemplo básico
node dist/examples/basic-usage.js

# Exemplo avançado
node dist/examples/advanced-usage.js
```

## 📝 Personalizando os Exemplos

1. **Coloque seu arquivo DOCX** na pasta do projeto
2. **Descomente o código** nos exemplos (está comentado para evitar erros sem arquivo)
3. **Ajuste os caminhos** dos arquivos conforme necessário
4. **Configure as opções** de parsing conforme suas necessidades

## 💡 Dicas de Uso

### Para Documentos Pequenos (< 1MB)
```typescript
import { parseDocxToArray } from 'docx-parser';

const elements = await parseDocxToArray(buffer);
// Processa todos os elementos de uma vez
```

### Para Documentos Grandes (> 1MB)
```typescript
import { parseDocx } from 'docx-parser';

for await (const element of parseDocx(buffer, {
  chunkSize: 64 * 1024,
  concurrent: true
})) {
  // Processa elemento por elemento
}
```

### Para Extrair Apenas Texto
```typescript
import { extractText } from 'docx-parser';

const texto = await extractText(buffer, {
  preserveFormatting: false,
  normalizeWhitespace: true
});
```

### Para Processar Imagens
```typescript
import { extractImages } from 'docx-parser';

for await (const image of extractImages(buffer)) {
  const filename = `image_${Date.now()}.${image.metadata?.format}`;
  writeFileSync(filename, image.content);
}
```

## 🔧 Configurações Comuns

### Performance Otimizada
```typescript
const options = {
  includeImages: false,     // Pula imagens para ser mais rápido
  includeTables: true,      // Inclui tabelas
  normalizeWhitespace: true,
  chunkSize: 128 * 1024,    // Chunks maiores
  concurrent: true          // Processamento paralelo
};
```

### Extração Completa
```typescript
const options = {
  includeMetadata: true,
  includeImages: true,
  includeTables: true,
  includeHeaders: true,
  includeFooters: true,
  preserveFormatting: true,
  maxImageSize: 50 * 1024 * 1024  // 50MB max por imagem
};
```

### Apenas Conteúdo de Texto
```typescript
const options = {
  includeMetadata: false,
  includeImages: false,
  includeTables: false,
  includeHeaders: false,
  includeFooters: false,
  normalizeWhitespace: true
};
```

## 📊 Tipos de Elementos

Cada elemento retornado tem a estrutura:

```typescript
{
  type: 'metadata' | 'paragraph' | 'image' | 'table' | 'header' | 'footer',
  id: string,
  position: { page: number, section: number, order: number },
  content: any,  // Varia conforme o tipo
  // ... outros campos específicos do tipo
}
```

## 🚨 Tratamento de Erros

```typescript
import { DocxParseError } from 'docx-parser';

try {
  for await (const element of parseDocx(buffer)) {
    // Processa elemento
  }
} catch (error) {
  if (error instanceof DocxParseError) {
    console.error('Erro específico do DOCX:', error.message);
  } else {
    console.error('Erro geral:', error);
  }
}
```

## 📞 Suporte

Se tiver dúvidas sobre os exemplos ou encontrar problemas:

1. Verifique se o arquivo DOCX é válido
2. Confira se as dependências estão instaladas
3. Execute `npm run build` antes de testar
4. Veja a documentação principal no README.md

---

**Boa codificação! 🎉**

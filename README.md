# DOCX Parser

Uma biblioteca JavaScript/TypeScript moderna para parsing de documentos DOCX usando arquitetura de generators e Clean Architecture.

## 🚀 Características

- **Streaming**: Processa documentos DOCX de forma incremental usando async generators
- **Memory Efficient**: Não carrega todo o documento na memória
- **TypeScript**: Tipagem completa com interfaces bem definidas
- **Clean Architecture**: Separação clara entre camadas (Domain, Application, Infrastructure, Interfaces)
- **Flexível**: Extrai texto, imagens, tabelas, metadados e formatação
- **Configurável**: Opções avançadas para controlar o parsing

## 📦 Instalação

```bash
npm install docx-parser
# ou
yarn add docx-parser
# ou
pnpm add docx-parser
```

## 🔥 Uso Básico

### Parse Incremental (Recomendado)

```typescript
import { parseDocx } from 'docx-parser';
import { readFileSync } from 'fs';

const buffer = readFileSync('documento.docx');

// Processa documento incrementalmente
for await (const element of parseDocx(buffer)) {
  console.log(`Tipo: ${element.type}`);

  if (element.type === 'paragraph') {
    console.log(`Texto: ${element.content}`);
  } else if (element.type === 'image') {
    console.log(`Imagem: ${element.metadata?.filename}`);
  } else if (element.type === 'table') {
    console.log(`Tabela com ${element.content.length} linhas`);
  }
}
```

### Parse de Arquivo

```typescript
import { parseDocxFile } from 'docx-parser';

// Lê arquivo diretamente do sistema
for await (const element of parseDocxFile('./documento.docx')) {
  console.log(element.type, element.content);
}
```

### Parse de Stream

```typescript
import { parseDocxStream } from 'docx-parser';

const response = await fetch('https://exemplo.com/documento.docx');
const stream = response.body!;

for await (const element of parseDocxStream(stream)) {
  console.log(element.type);
}
```

## 🛠️ API Completa

### Funções Principais

#### `parseDocx(buffer, options?)`
Processa um Buffer DOCX incrementalmente.

```typescript
import { parseDocx } from 'docx-parser';

const buffer = readFileSync('doc.docx');
for await (const element of parseDocx(buffer, {
  includeImages: true,
  includeTables: true,
  normalizeWhitespace: true
})) {
  // Processa cada elemento
}
```

#### `parseDocxToArray(source, options?)`
Retorna todos os elementos como array (não-streaming).

```typescript
import { parseDocxToArray } from 'docx-parser';

const elements = await parseDocxToArray(buffer);
console.log(`Documento tem ${elements.length} elementos`);
```

#### `extractText(source, options?)`
Extrai apenas o texto do documento.

```typescript
import { extractText } from 'docx-parser';

const texto = await extractText(buffer, {
  preserveFormatting: true
});
console.log(texto);
```

#### `extractImages(source)`
Extrai apenas as imagens do documento.

```typescript
import { extractImages } from 'docx-parser';

for await (const image of extractImages(buffer)) {
  console.log(`Imagem: ${image.metadata?.filename}`);
  // image.content contém o Buffer da imagem
}
```

#### `getMetadata(source)`
Extrai apenas os metadados do documento.

```typescript
import { getMetadata } from 'docx-parser';

const metadata = await getMetadata(buffer);
console.log(`Título: ${metadata.title}`);
console.log(`Autor: ${metadata.author}`);
console.log(`Criado em: ${metadata.created}`);
```

## ⚙️ Opções de Configuração

```typescript
interface ParseOptions {
  // Controle de conteúdo
  includeMetadata?: boolean;     // Incluir metadados (padrão: true)
  includeImages?: boolean;       // Incluir imagens (padrão: true)
  includeTables?: boolean;       // Incluir tabelas (padrão: true)
  includeHeaders?: boolean;      // Incluir cabeçalhos (padrão: false)
  includeFooters?: boolean;      // Incluir rodapés (padrão: false)

  // Processamento de imagens
  imageFormat?: 'buffer' | 'base64' | 'stream';  // Formato das imagens
  maxImageSize?: number;         // Tamanho máximo em bytes (padrão: 10MB)

  // Formatação de texto
  preserveFormatting?: boolean;  // Preservar formatação (padrão: true)
  normalizeWhitespace?: boolean; // Normalizar espaços (padrão: true)

  // Performance
  chunkSize?: number;           // Tamanho do chunk (padrão: 64KB)
  concurrent?: boolean;         // Processamento paralelo (padrão: false)
}
```

## 📋 Tipos de Elementos

### MetadataElement
```typescript
{
  type: 'metadata',
  id: string,
  position: { page: number, section: number, order: number },
  content: {
    title?: string,
    author?: string,
    subject?: string,
    created?: Date,
    modified?: Date,
    // ... outros metadados
  }
}
```

### ParagraphElement
```typescript
{
  type: 'paragraph',
  id: string,
  position: { page: number, section: number, order: number },
  content: string,
  formatting?: {
    fontFamily?: string,
    fontSize?: number,
    bold?: boolean,
    italic?: boolean,
    underline?: boolean,
    color?: string,
    highlight?: string
  }
}
```

### ImageElement
```typescript
{
  type: 'image',
  id: string,
  position: { page: number, section: number, order: number },
  content: Buffer,
  metadata?: {
    filename?: string,
    format: 'png' | 'jpg' | 'gif' | 'svg' | 'wmf' | 'emf',
    width: number,
    height: number
  },
  positioning?: {
    inline?: boolean,
    x?: number,
    y?: number
  }
}
```

### TableElement
```typescript
{
  type: 'table',
  id: string,
  position: { page: number, section: number, order: number },
  content: Array<{
    cells: Array<{ content: string }>,
    isHeader: boolean
  }>
}
```

## 🏗️ Exemplos Avançados

### Filtrando Tipos de Conteúdo

```typescript
import { parseDocx } from 'docx-parser';

// Só processa texto e tabelas
for await (const element of parseDocx(buffer, {
  includeImages: false,
  includeMetadata: false,
  includeTables: true
})) {
  if (element.type === 'paragraph') {
    console.log('Parágrafo:', element.content);
  } else if (element.type === 'table') {
    console.log('Tabela encontrada');
    element.content.forEach((row, i) => {
      console.log(`Linha ${i}:`, row.cells.map(c => c.content).join(' | '));
    });
  }
}
```

### Processamento de Imagens

```typescript
import { writeFileSync } from 'fs';
import { extractImages } from 'docx-parser';

let imageCount = 0;
for await (const image of extractImages(buffer)) {
  const filename = image.metadata?.filename || `image_${++imageCount}.${image.metadata?.format}`;
  writeFileSync(`./output/${filename}`, image.content);
  console.log(`Imagem salva: ${filename}`);
}
```

### Validação de Documento

```typescript
import { ValidateDocumentUseCaseImpl } from 'docx-parser';

const validator = new ValidateDocumentUseCaseImpl();
const result = await validator.validate(buffer);

if (!result.isValid) {
  console.log('Documento inválido:');
  result.errors.forEach(error => {
    console.log(`- ${error.message} (${error.code})`);
  });
} else {
  console.log('Documento válido!');
}
```

## 🔧 Arquitetura

A biblioteca segue Clean Architecture com 4 camadas:

- **Domain**: Tipos, interfaces e regras de negócio
- **Application**: Use cases e lógica de aplicação
- **Infrastructure**: Implementações concretas (JSZip, XML parsing)
- **Interfaces**: API pública e controllers

```
src/
├── domain/           # Entidades e regras de negócio
├── application/      # Use cases e lógica de aplicação
├── infrastructure/   # Adaptadores e implementações
└── interfaces/       # API pública
```

## 🚨 Tratamento de Erros

```typescript
import { DocxParseError } from 'docx-parser';

try {
  for await (const element of parseDocx(invalidBuffer)) {
    console.log(element);
  }
} catch (error) {
  if (error instanceof DocxParseError) {
    console.log('Erro específico do DOCX:', error.message);
  } else {
    console.log('Erro geral:', error);
  }
}
```

## 📝 Performance Tips

1. **Use streaming**: Prefira `parseDocx()` ao invés de `parseDocxToArray()` para documentos grandes
2. **Filtre conteúdo**: Desative `includeImages` se não precisar de imagens
3. **Chunk size**: Ajuste `chunkSize` conforme o tamanho dos documentos
4. **Limite imagens**: Use `maxImageSize` para evitar imagens muito grandes

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🐛 Reportar Bugs

Abra uma issue no GitHub com:
- Versão da biblioteca
- Arquivo DOCX de exemplo (se possível)
- Código que reproduz o problema
- Erro completo

---

**Feito com ❤️ e TypeScript**

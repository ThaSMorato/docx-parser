# GitHub Actions Setup

Este diretório contém as GitHub Actions para automatizar o processo de CI/CD da biblioteca DOCX Parser.

## 📦 NPM Publishing Action

A action `npm-publish.yml` automatiza todo o processo de publicação no NPM com versionamento semântico baseado nos commits.

### 🔧 Setup Necessário

#### 1. Configurar NPM Token

1. **Acesse [npmjs.com](https://www.npmjs.com)** e faça login
2. Vá para **Access Tokens** → **Generate New Token**
3. Escolha **Automation** token type
4. Copie o token gerado

5. **No GitHub:**
   - Vá para **Settings** → **Secrets and variables** → **Actions**
   - Clique em **New repository secret**
   - Nome: `NPM_TOKEN`
   - Valor: Cole o token do NPM

#### 2. Verificar Permissões do Repositório

Certifique-se de que as Actions têm permissão de escrita:

1. **Settings** → **Actions** → **General**
2. Em **Workflow permissions**, selecione:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**

#### 3. Configurar Package Name

Verifique se o nome do package no `package.json` está correto:

```json
{
  "name": "@thasmorato/docx-parser",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

### 🚀 Como Funciona

#### Trigger Automático
A action roda automaticamente quando você faz push na branch `main`:

```bash
git push origin main
```

#### Fluxo da Action

1. **Setup pnpm** → Configura pnpm v8 no ambiente
2. **Testes** → Roda todos os testes unitários, integração e E2E
3. **Linting** → Verifica qualidade do código
4. **Análise de Commits** → Determina tipo de bump (major/minor/patch)
5. **Bump de Versão** → Atualiza `package.json` automaticamente
6. **Build** → Compila o código TypeScript
7. **Publish NPM** → Publica no registro NPM
8. **GitHub Release** → Cria release com changelog

#### Versionamento Baseado em Commits

**MAJOR (Breaking Changes):**
```bash
git commit -m "MAJOR: refactor all API"
git commit -m "feat: new API with BREAKING CHANGE"
```

**MINOR (New Features):**
```bash
git commit -m "MINOR: add checkbox detection"
git commit -m "feat: implement footnote parsing"
```

**PATCH (Bug Fixes - Default):**
```bash
git commit -m "fix: resolve table parsing bug"
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
```

### 📊 Status da Action

Você pode acompanhar o progresso:

1. **GitHub Actions Tab** → Ver execução em tempo real
2. **NPM Package** → https://www.npmjs.com/package/@thasmorato/docx-parser
3. **GitHub Releases** → Ver changelog automático

### 🛠️ Troubleshooting

#### Action Falhou nos Testes
```bash
# Rode localmente primeiro
pnpm test
pnpm lint
pnpm build
```

#### NPM Publish Falhou
- Verifique se `NPM_TOKEN` está configurado
- Confirme se você tem permissão para publicar o package
- Veja se o nome do package está disponível

#### Versão Não Foi Bumped
- Verifique se o commit message segue o padrão
- Confirme se não há `[skip ci]` no commit
- Veja os logs da action para detalhes

#### Primeira Publicação
Se for a primeira vez publicando:

1. **Certifique-se** que o package name está disponível no NPM
2. **Confirme** que você tem uma conta NPM válida
3. **Verifique** se o token tem permissões de publish

### 🎯 Comandos Úteis

```bash
# Testar localmente antes do push
pnpm prepublishOnly

# Trigger manual da action (via GitHub UI)
# Actions → NPM Publish → Run workflow

# Pular CI temporariamente
git commit -m "docs: typo fix [skip ci]"

# Ver logs detalhados
# GitHub → Actions → Última execução
```

### 📋 Checklist de Setup

- [ ] NPM_TOKEN configurado nos secrets
- [ ] Permissões de escrita habilitadas para Actions
- [ ] Package name disponível e correto
- [ ] Testes passando localmente (`pnpm test`)
- [ ] Linting sem erros críticos (`pnpm lint`)
- [ ] Build funcionando (`pnpm build`)

### 🔄 Fluxo de Trabalho Recomendado

1. **Desenvolva** em feature branch
2. **Teste** localmente com `pnpm test`
3. **Merge** para main com commit message apropriado
4. **Aguarde** a action completar
5. **Verifique** a publicação no NPM
6. **Confirme** o release no GitHub

### 🔧 Diferenças do pnpm

A action foi configurada para usar **pnpm** ao invés de npm:

- ✅ **Setup pnpm**: Instala pnpm v8 automaticamente
- ✅ **Cache pnpm**: Usa cache do pnpm para velocidade
- ✅ **pnpm-lock.yaml**: Commita o lockfile correto
- ✅ **pnpm publish**: Usa comando de publish do pnpm
- ✅ **--no-git-checks**: Evita conflitos com git durante publish

---

**💡 Dica**: Use commits descritivos que indiquem claramente o tipo de mudança para garantir o versionamento correto!

# Automatic Versioning System

This repository uses an automatic versioning system that analyzes commit messages to determine the appropriate version bump type.

## How It Works

When you push to the `main` branch, the GitHub Action will:

1. **Analyze commit messages** since the last release
2. **Determine version bump type** based on commit patterns
3. **Run tests and linting** to ensure quality
4. **Bump the version** in package.json
5. **Create a git tag** with the new version
6. **Publish to NPM** automatically
7. **Create a GitHub Release** with changelog

## Commit Message Patterns

### MAJOR Version Bump (Breaking Changes)
Use when making incompatible API changes:

```bash
git commit -m "MAJOR: refactor all lib"
git commit -m "MAJOR: remove deprecated methods"
git commit -m "MAJOR: change parseDocx API signature"
```

**Alternative patterns that trigger MAJOR:**
```bash
git commit -m "feat: new API with BREAKING CHANGE"
git commit -m "refactor: BREAKING CHANGE - remove old interface"
```

### MINOR Version Bump (New Features)
Use when adding functionality in a backward-compatible manner:

```bash
git commit -m "MINOR: add checkbox detection feature"
git commit -m "MINOR: implement footnote parsing"
git commit -m "feat: add document validation"
git commit -m "feature: support for page elements"
```

### PATCH Version Bump (Bug Fixes)
Used for backward-compatible bug fixes (default behavior):

```bash
git commit -m "fix: resolve parsing error with tables"
git commit -m "docs: update README examples"
git commit -m "chore: update dependencies"
git commit -m "test: add more unit tests"
```

## Version Bump Priority

The system checks commit messages in this order:

1. **MAJOR** (highest priority)
   - `MAJOR:` prefix
   - `BREAKING CHANGE` anywhere in commit

2. **MINOR** (medium priority)
   - `MINOR:` prefix
   - `feat:` or `feature:` prefix

3. **PATCH** (default)
   - Any other commit type
   - `fix:`, `docs:`, `chore:`, `test:`, etc.

## Examples

### Scenario 1: Multiple Commits with Different Types
```bash
git commit -m "fix: resolve table parsing bug"
git commit -m "docs: update API documentation"
git commit -m "MINOR: add new image extraction feature"
```
**Result**: MINOR version bump (because MINOR has higher priority than PATCH)

### Scenario 2: Breaking Change
```bash
git commit -m "feat: new parsing API with BREAKING CHANGE"
git commit -m "docs: update examples for new API"
```
**Result**: MAJOR version bump (because of BREAKING CHANGE)

### Scenario 3: Only Bug Fixes
```bash
git commit -m "fix: handle empty documents"
git commit -m "test: add edge case tests"
git commit -m "chore: update lint rules"
```
**Result**: PATCH version bump (default behavior)

## Manual Triggering

You can also manually trigger the workflow:

1. Go to **Actions** tab in GitHub
2. Select **NPM Publish** workflow
3. Click **Run workflow**
4. Choose the branch (usually `main`)

## Required Secrets

Make sure these secrets are configured in your repository:

### NPM_TOKEN
1. Go to [npmjs.com](https://www.npmjs.com)
2. Login to your account
3. Go to **Access Tokens** → **Generate New Token**
4. Choose **Automation** token type
5. Copy the token
6. In GitHub: **Settings** → **Secrets and variables** → **Actions**
7. Add new secret: `NPM_TOKEN` with the copied value

### GITHUB_TOKEN
This is automatically provided by GitHub Actions, no configuration needed.

## Workflow Behavior

### Successful Flow
```
Push to main → Run tests → Analyze commits → Bump version →
Create tag → Build package → Publish to NPM → Create GitHub Release
```

### Failure Handling
- If **tests fail**: Workflow stops, no version bump or publish
- If **linting fails**: Workflow stops, no version bump or publish
- If **NPM publish fails**: Version was already bumped, manual intervention needed

## Skip CI

To skip the entire workflow, include `[skip ci]` in your commit message:

```bash
git commit -m "docs: minor typo fix [skip ci]"
```

## Best Practices

1. **Use descriptive commit messages** that clearly indicate the type of change
2. **Test locally** before pushing to main
3. **Use feature branches** for development, merge to main when ready to release
4. **Review the generated changelog** in GitHub Releases
5. **Monitor NPM package** after publishing to ensure it's available

## Troubleshooting

### Version Not Bumped
- Check if commit messages match the expected patterns
- Verify the workflow ran successfully in GitHub Actions
- Look for `[skip ci]` in commit messages

### NPM Publish Failed
- Check if `NPM_TOKEN` secret is configured correctly
- Verify package name is available on NPM
- Check if you have publish permissions for the package

### Tests Failed
- Run tests locally: `npm test`
- Fix any failing tests before pushing
- Check linting: `npm run lint`

---

**Note**: The first release will be a PATCH bump from the current version in package.json. Subsequent releases will be based on commit message analysis.

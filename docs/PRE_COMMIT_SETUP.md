# Pre-commit Setup Guide

This project uses pre-commit hooks to ensure code quality and consistency.

## What are Pre-commit Hooks?

Pre-commit hooks are scripts that run automatically before you commit code. They check and fix formatting issues, catch common errors, and enforce code quality standards.

## Installation

### 1. Install Poetry Dependencies

```bash
poetry install
```

This will install all development dependencies including:

- `black` - Python code formatter
- `isort` - Python import sorter
- `flake8` - Python linter
- `pre-commit` - Hook framework
- `bandit` - Security checker
- `pytest` - Testing framework

### 2. Install Pre-commit Hooks

```bash
poetry run pre-commit install
```

This installs the hooks into your local `.git/hooks/` directory.

## What Gets Checked?

The pre-commit hooks will automatically:

### Python Files

- ✅ Format code with **Black** (88 char line length)
- ✅ Sort imports with **isort** (Black-compatible)
- ✅ Lint with **flake8** (catch common errors)
- ✅ Security scan with **bandit**

### JavaScript/TypeScript/CSS/HTML

- ✅ Format with **Prettier** (using `.prettierrc` config)

### Markdown Files

- ✅ Lint and fix with **markdownlint** (using `.markdownlint.json`)

### YAML Files

- ✅ Lint with **yamllint**

### All Files

- ✅ Remove trailing whitespace
- ✅ Ensure files end with newline
- ✅ Check for large files (>1MB)
- ✅ Check for merge conflicts
- ✅ Detect secrets/credentials
- ✅ Use Unix line endings (LF)

## Usage

### Automatic (Recommended)

Once installed, hooks run automatically before each commit:

```bash
git add .
git commit -m "Your commit message"
# Hooks run automatically here
```

If any hook fails:

1. The commit will be blocked
2. Files will be auto-fixed (when possible)
3. Review the changes
4. Stage the fixed files: `git add .`
5. Try committing again

### Manual Run

Run all hooks on all files:

```bash
poetry run pre-commit run --all-files
```

Run specific hook:

```bash
poetry run pre-commit run black --all-files
poetry run pre-commit run prettier --all-files
poetry run pre-commit run markdownlint --all-files
```

### Update Hooks

Update to the latest versions:

```bash
poetry run pre-commit autoupdate
```

## Skipping Hooks (Emergency Only)

**Not recommended**, but if absolutely necessary:

```bash
git commit --no-verify -m "Emergency commit"
```

## Troubleshooting

### Hooks not running

```bash
# Reinstall
poetry run pre-commit uninstall
poetry run pre-commit install
```

### Clear hook cache

```bash
poetry run pre-commit clean
poetry run pre-commit install-hooks
```

### Check configuration

```bash
poetry run pre-commit run --all-files --verbose
```

## CI/CD Integration

Pre-commit hooks can also run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run pre-commit
  run: |
    poetry install
    poetry run pre-commit run --all-files
```

## Configuration Files

- `.pre-commit-config.yaml` - Hook configuration
- `.prettierrc` - Prettier settings
- `.markdownlint.json` - Markdown rules
- `pyproject.toml` - Black, isort, bandit settings
- `.secrets.baseline` - Secrets detection baseline

## Best Practices

1. **Run manually first**: Before your first commit, run `poetry run pre-commit run --all-files`
2. **Stage incrementally**: If hooks make changes, review them before re-committing
3. **Keep hooks updated**: Run `poetry run pre-commit autoupdate` monthly
4. **Don't skip hooks**: They catch issues early and save time

## Benefits

- 🚀 **Consistent Code Style** - No more formatting debates
- 🐛 **Early Bug Detection** - Catch issues before they reach CI/CD
- 🔒 **Security** - Detect credentials and security issues
- ⚡ **Fast Feedback** - Fix issues locally before pushing
- 👥 **Team Alignment** - Everyone follows the same standards

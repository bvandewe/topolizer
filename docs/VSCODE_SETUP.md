# VS Code Configuration Setup

This project is now configured with automatic formatting for Python, JavaScript, HTML, CSS/SCSS, and Markdown.

## Required VS Code Extensions

The following extensions need to be installed (VS Code should prompt you to install them when you open the project):

1. **Python Support**
   - `ms-python.python` - Python language support
   - `ms-python.vscode-pylance` - Fast Python language server
   - `ms-python.black-formatter` - Black Python formatter

2. **Web Development**
   - `esbenp.prettier-vscode` - Prettier formatter for JS/HTML/CSS
   - `dbaeumer.vscode-eslint` - ESLint for JavaScript linting

3. **Markdown**
   - `DavidAnson.vscode-markdownlint` - Markdown linting and formatting

4. **General**
   - `editorconfig.editorconfig` - EditorConfig support
   - `streetsidesoftware.code-spell-checker` - Spell checker

## Automatic Configuration

Once the extensions are installed, the following will happen automatically:

### Python

- Poetry virtual environment (`.venv`) will be auto-activated when opening terminals
- Code will be formatted with Black on save
- Import statements will be organized on save

### JavaScript/TypeScript

- Code will be formatted with Prettier on save
- ESLint will run for linting

### HTML

- Files will be formatted with Prettier on save

### CSS/SCSS/SASS

- Files will be formatted with Prettier on save

### Markdown

- Files will be formatted with markdownlint on save
- Linting rules from `.markdownlint.json` will be applied
- Auto-fix will run on save

## Configuration Files

The following configuration files have been created:

- `.vscode/settings.json` - VS Code workspace settings
- `.vscode/extensions.json` - Recommended extensions
- `.prettierrc` - Prettier formatter configuration
- `.prettierignore` - Files to exclude from Prettier
- `.editorconfig` - Editor settings for all file types
- `.markdownlint.json` - Markdown linting rules (already existed)

## Manual Setup Steps

1. **Install Extensions**: When you open VS Code, you should see a notification to install recommended extensions. Click "Install All".

2. **Verify Python Environment**: Open a Python file and check the bottom-left corner of VS Code to ensure the Poetry virtual environment (`.venv`) is selected.

3. **Test Formatting**:
   - Open any Python file and save it → should format with Black
   - Open any JavaScript file and save it → should format with Prettier
   - Open any Markdown file and save it → should format with markdownlint

## Troubleshooting

### Python virtual environment not activating

- Command Palette (`Cmd+Shift+P`) → "Python: Select Interpreter"
- Choose the interpreter in `.venv/bin/python`

### Formatter not working

- Check that the extension is installed and enabled
- Check the bottom-right corner of VS Code for any formatter errors
- Try reloading VS Code window: Command Palette → "Developer: Reload Window"

### Black formatter not found

- Make sure Black is installed in your Poetry environment:

  ```bash
  poetry add --group dev black
  ```

## Formatting Settings Summary

| File Type | Formatter | Format on Save | Configuration |
|-----------|-----------|----------------|---------------|
| Python    | Black     | ✅ Yes         | Default Black settings (88 char line) |
| JavaScript| Prettier  | ✅ Yes         | `.prettierrc` |
| HTML      | Prettier  | ✅ Yes         | `.prettierrc` |
| CSS/SCSS  | Prettier  | ✅ Yes         | `.prettierrc` |
| Markdown  | markdownlint | ✅ Yes      | `.markdownlint.json` |
| JSON      | Prettier  | ✅ Yes         | `.prettierrc` |

## Additional Features

- **Trailing whitespace**: Automatically trimmed on save
- **Final newline**: Automatically added to all files on save
- **Import organization**: Python imports automatically sorted on save

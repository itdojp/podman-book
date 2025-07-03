# Content Validation System

Comprehensive validation for markdown content integrity and quality assurance.

## Overview

The enhanced content validation system provides thorough checking of:
- Markdown syntax correctness
- Internal and external link validity
- Image references and accessibility
- Metadata consistency
- Heading structure
- Duplicate IDs and anchors
- Content quality issues

## Usage

### Basic Validation
```bash
npm run validate
```

### Auto-Fix Mode
```bash
npm run validate:fix
# or
npm run validate -- --fix
```

### Generate Reports
```bash
npm run validate:report
# or
npm run validate -- --report
```

### Combined Options
```bash
# Fix issues and generate report
npm run validate -- --fix --report --verbose

# Strict mode validation
npm run validate -- --strict
```

## Validation Checks

### 1. Markdown Syntax Validation

**Checks for:**
- Malformed link syntax `[text]` without URL
- Unclosed code blocks
- Unbalanced emphasis markers (`*` or `**`)
- Hard tabs (recommends spaces)
- Invalid markdown structures

**Auto-fixable:**
- Malformed links (adds empty parentheses)
- Hard tabs (converts to spaces)
- Some emphasis issues

### 2. Metadata Validation

**Required Fields:**
- `title` - Document title (error if missing)

**Recommended Fields:**
- `description` - Brief description
- `order` - Numeric ordering value
- `status` - draft, review, or published

**Auto-fixable:**
- Missing title (generates from filename)
- Invalid order value (converts to number)

### 3. Link Validation

**Checks:**
- Internal link targets exist
- Anchor references are valid
- External link format is correct
- Link text is not empty
- Cross-file anchor references

**Examples:**
```markdown
[Valid internal link](./chapter02/index.md)
[Valid anchor link](#section-heading)
[Valid external link](https://example.com)

[Invalid - missing URL]
[Invalid - broken link](./nonexistent.md)
[Invalid - broken anchor](#nonexistent-heading)
```

### 4. Image Validation

**Checks:**
- Image files exist at specified paths
- Alt text is provided (accessibility)
- Image paths are correctly formatted

**Examples:**
```markdown
![Valid image with alt text](./images/diagram.png)
![](./images/photo.jpg)  # Warning: missing alt text
![Missing image](./images/nonexistent.png)  # Error
```

### 5. Anchor and ID Validation

**Checks:**
- Duplicate heading IDs
- Duplicate explicit anchor IDs
- Broken anchor references
- Cross-file anchor validation

**How IDs are generated:**
```markdown
# Hello World  -> #hello-world
## Test Section! -> #test-section
### 2.1 Numbers -> #21-numbers
```

### 6. Heading Structure

**Checks:**
- Sequential heading levels (no skipping)
- Multiple h1 headings (warns if more than one)
- Proper heading hierarchy

**Examples:**
```markdown
# Title (h1)
## Section (h2)
### Subsection (h3)  # Valid

# Title
### Subsection  # Warning: skipped h2
```

## Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--fix` | Automatically fix fixable issues | `npm run validate -- --fix` |
| `--report` | Generate validation reports | `npm run validate -- --report` |
| `--verbose` | Show detailed validation progress | `npm run validate -- --verbose` |
| `--strict` | Fail on warnings (not just errors) | `npm run validate -- --strict` |

## Reports

Three report formats are generated in `validation-reports/`:

### 1. HTML Report (`validation-report.html`)
- Visual dashboard with statistics
- Color-coded issues by severity
- Suggestions for each issue
- Responsive design for easy viewing

### 2. JSON Report (`validation-report.json`)
```json
{
  "timestamp": "2024-03-15T10:30:45.123Z",
  "summary": {
    "filesChecked": 25,
    "totalIssues": 8,
    "errors": 3,
    "warnings": 5,
    "fixed": 2
  },
  "errors": [...],
  "warnings": [...]
}
```

### 3. Markdown Report (`validation-report.md`)
- Detailed issue breakdown
- Organized by severity
- Copy-paste friendly format
- Includes fix suggestions

## Auto-Fix Capabilities

The `--fix` flag can automatically resolve:

### Metadata Issues
- Missing title (generates from filename)
- Invalid order values
- Basic frontmatter formatting

### Markdown Issues
- Hard tabs → spaces
- Malformed links → adds empty URL
- Some whitespace issues

### Content Issues
- Empty link text warnings
- Missing image alt text

**Note:** Not all issues are auto-fixable. Critical errors like broken links or missing files require manual intervention.

## Exit Codes

- `0` - All checks passed (warnings allowed)
- `1` - One or more errors found
- `1` - Warnings found (only with `--strict`)

## Integration Examples

### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit

npm run validate || {
  echo "Content validation failed. Fix errors before committing."
  exit 1
}
```

### CI/CD Pipeline
```yaml
# GitHub Actions
- name: Validate Content
  run: npm run validate -- --strict
  
- name: Upload Validation Report
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: validation-report
    path: validation-reports/
```

### Scheduled Validation
```yaml
# Run weekly content audit
on:
  schedule:
    - cron: '0 0 * * 0'  # Sunday midnight
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run validate:report
      - uses: actions/upload-artifact@v3
        with:
          name: weekly-validation
          path: validation-reports/
```

## Best Practices

### 1. Regular Validation
```bash
# Before commits
npm run validate

# During development
npm run validate -- --fix

# Weekly audits
npm run validate:report
```

### 2. Progressive Enhancement
1. Start by fixing all errors
2. Address warnings incrementally
3. Use `--strict` mode for production

### 3. Team Workflow
- Run validation in CI/CD
- Share validation reports
- Document exceptions in README
- Use auto-fix for consistency

## Troubleshooting

### Common Issues

**"File not found" errors:**
- Check file paths are relative to current file
- Ensure case sensitivity matches
- Verify files aren't in .gitignore

**Duplicate ID warnings:**
- Headings generate IDs automatically
- Make headings unique or use explicit anchors
- Check for conflicts across files

**Fix not working:**
- Some issues require manual intervention
- Check file permissions
- Review suggested fixes in report

### Debug Mode
```bash
# Verbose output for debugging
npm run validate -- --verbose

# Check specific directory
cd src/chapters && npm run validate
```

## Configuration

While the validator works with sensible defaults, you can customize behavior:

### Exclude Patterns
Files ending with `.draft.md` or `.private.md` are automatically excluded.

### Custom Validation Rules
Extend the validator for project-specific rules:

```javascript
// custom-validator.js
const { ContentValidator } = require('./scripts/content-validator-enhanced');

class CustomValidator extends ContentValidator {
  async validateFile(filePath) {
    await super.validateFile(filePath);
    
    // Add custom validation
    const content = this.fileContents.get(filePath);
    if (content.includes('TODO')) {
      this.addIssue(
        'custom',
        'warning',
        filePath,
        0,
        'TODO comment found',
        'Complete or remove TODO items'
      );
    }
  }
}
```

## Performance

The validator is optimized for large documentation projects:

- Parallel file processing where possible
- Caches file contents for cross-referencing
- Minimal file I/O operations
- Efficient regex patterns

Typical performance:
- Small project (< 50 files): < 1 second
- Medium project (50-200 files): 1-3 seconds  
- Large project (200+ files): 3-10 seconds

The enhanced content validation system ensures high-quality, consistent documentation that follows best practices for accessibility, maintainability, and user experience.

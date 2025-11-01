# JSDoc Documentation Setup

JSDoc has been configured for the CareRoute backend. This guide will help you get started.

## Quick Start

### 1. Install Dependencies

First, install the JSDoc dependencies:

```bash
cd backend
npm install
```

This will install:
- `jsdoc` - Documentation generator
- `docdash` - Beautiful theme for JSDoc

### 2. Generate Documentation

Generate the documentation from your code:

```bash
npm run docs:generate
```

This will create a `docs/` folder with HTML documentation.

### 3. View Documentation

View the generated documentation:

```bash
npm run docs:serve
```

This will:
- Start a local web server
- Open the documentation in your browser automatically
- The docs will be available at `http://localhost:8080`

### 4. Clean Documentation

To remove the generated docs:

```bash
npm run docs:clean
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run docs:generate` | Generate HTML documentation from JSDoc comments |
| `npm run docs:serve` | Start a local server to view docs |
| `npm run docs:clean` | Remove generated documentation |

## How to Document Your Code

Add JSDoc comments above your functions, classes, and modules:

```javascript
/**
 * Authenticate user with email and password
 * @param {string} email - User email address
 * @param {string} password - User password
 * @returns {Promise<Object>} User object and session
 */
async function login(email, password) {
  // Implementation...
}
```

See `CODE_DOCUMENTATION_GUIDE.md` in the root directory for detailed examples.

## Documentation Structure

The generated documentation includes:

- **Modules**: Organized by file/directory
- **Classes**: All class definitions
- **Functions**: All function documentation
- **Parameters**: Documented function parameters
- **Return Types**: Documented return values
- **Examples**: Code examples if provided

## Configuration

The JSDoc configuration is in `jsdoc.config.json`. You can customize:

- Source directories to include/exclude
- Output directory
- Theme and styling
- Templates and plugins

## Tips

1. **Start Small**: Document your most important functions first
2. **Be Consistent**: Use the same documentation style throughout
3. **Include Examples**: Add `@example` tags for complex functions
4. **Document Public APIs**: Focus on functions others will use
5. **Keep It Updated**: Update docs when you change code

## Next Steps

1. Add JSDoc comments to your key functions
2. Run `npm run docs:generate` to see your documentation
3. Share the docs with your team!

## Troubleshooting

**Docs not generating?**
- Make sure you ran `npm install` first
- Check that JSDoc comments use proper syntax
- Verify `jsdoc.config.json` exists

**Can't see docs in browser?**
- Make sure you ran `npm run docs:generate` first
- Check that the `docs/` folder was created
- Try opening `docs/index.html` directly

**Missing documentation?**
- Ensure functions have JSDoc comments above them
- Check that source files are included in `jsdoc.config.json`
- Verify file patterns match (`.js`, `.jsx`)


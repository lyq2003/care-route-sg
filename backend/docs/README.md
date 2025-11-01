# Backend API Documentation

This directory contains automatically generated API documentation for the CareRoute backend.

## Generating Documentation

To generate the documentation:

```bash
npm run docs:generate
```

## Viewing Documentation

After generating, you can view the documentation:

```bash
npm run docs:serve
```

This will open the documentation in your browser at `http://localhost:8080`.

## Documentation Structure

- **Controllers**: API route handlers (`src/controllers/`)
- **Services**: Business logic layer (`src/services/`)
- **Middleware**: Authentication and socket middleware (`src/middleware/`)
- **Routes**: Route definitions (`src/routes/`)
- **Domain**: Domain models and enums (`src/domain/`)
- **Config**: Configuration files (`src/config/`)

## Note

This documentation is generated from JSDoc comments in the source code. To update the documentation, add or modify JSDoc comments in the source files and regenerate.


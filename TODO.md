# pangu.js TODO List

> Note: When completing a task, move it from "To Do" to "Completed" section to maintain history.

## Completed

- [x] Chrome Extension Manifest V3 compatibility
- [x] Migrate all source code to TypeScript
- [x] Replace Webpack/Babel with Vite
- [x] Replace Mocha/Chai/Karma with Vitest/Playwright
- [x] Fix all failing tests (106/106 passing)
- [x] Add UMD build format support
- [x] Update dependencies to latest versions
- [x] Pin devDependencies to exact versions
- [x] Remove old test dependencies from package.json
- [x] Create PRIVACY.md for Chrome extension
- [x] Update CLAUDE.md with TypeScript commands
- [x] Add source maps for debugging (enabled in vite.config.ts)
- [x] Enable full TypeScript strict mode (noImplicitAny: true)
- [x] Set up ESLint for linting
- [x] Set up Prettier for formatting
- [x] Add eslint-plugin-unicorn with node: prefix rule
- [x] Create `publish-package` script for version management
- [x] Set up GitHub Actions CI/CD workflow
- [x] Add npm publish workflow with security best practices
- [x] Run ESLint and fix all node: prefix violations

## To Do

### High Priority

- [ ] Update Chrome Extension to use new TypeScript builds
- [ ] Remove Angular.js from Chrome Extension (200KB+ savings)
- [ ] Rewrite popup.js and options.js in TypeScript

### Chrome Extension Enhancement

- [ ] Use Vite to build Chrome Extension
- [ ] Modernize UI (remove jQuery/Angular dependencies)
- [ ] Add TypeScript types for Chrome Extension API
- [ ] Update extension icons for high DPI displays

### Code Quality

- [ ] Add pre-commit hooks for linting and testing
- [ ] Add test coverage reporting

### Future Enhancements

- [ ] Implement tree-shaking optimizations
- [ ] Add ES2020+ features with proper transpilation
- [ ] Consider monorepo structure for better organization
- [ ] Add changelog generation with standard-version
- [ ] Publish to JSR (JavaScript Registry) in addition to npm

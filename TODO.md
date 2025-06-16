# pangu.js TODO List

## ✅ Completed

- [x] Migrate all source code to TypeScript
- [x] Replace Webpack/Babel with Vite
- [x] Replace Mocha/Chai/Karma with Vitest/Playwright
- [x] Fix all failing tests (106/106 passing)
- [x] Add UMD build format support
- [x] Update dependencies to latest versions
- [x] Pin devDependencies to exact versions
- [x] Remove old test dependencies from package.json
- [x] Bump version to 5.0.0
- [x] Create PRIVACY.md for Chrome extension
- [x] Update CLAUDE.md with TypeScript commands
- [x] Consolidate modernization documentation
- [x] Add source maps for debugging (enabled in vite.config.ts)
- [x] Chrome Extension Manifest V3 compatibility
- [x] Add minification for production builds (Vite default)

## 📋 To Do

### High Priority

- [ ] Build and test the npm package
- [ ] Publish npm package to registry
- [ ] Update Chrome Extension to use new TypeScript builds
- [ ] Remove Angular.js from Chrome Extension (200KB+ savings)
- [ ] Rewrite popup.js and options.js in TypeScript
- [ ] Set up GitHub Actions CI/CD
- [ ] Update README.md with TypeScript usage examples
- [ ] Add browser and Node.js usage documentation

### Code Quality

- [ ] Set up ESLint 9 with TypeScript support
- [ ] Add Prettier or Biome for code formatting
- [ ] Enable full TypeScript strict mode (currently `noImplicitAny: false`)
- [ ] Configure TypeScript coverage reporting
- [ ] Add pre-commit hooks for linting and formatting

### Cleanup

- [x] Migrate from .npmignore to 'files' field in package.json
- [x] Update package.json keywords and description  
- [x] Clean up unused npm scripts

### Chrome Extension Enhancement

- [ ] Use Vite to build Chrome Extension
- [ ] Add hot reload for extension development
- [ ] Modernize UI (remove jQuery/Angular dependencies)
- [ ] Add TypeScript types for Chrome Extension API
- [ ] Update extension icons for high DPI displays

### Future Enhancements

- [ ] Consider esbuild for faster Node.js builds
- [ ] Consider pnpm for better package management
- [ ] Add benchmarks and performance tests
- [ ] Implement tree-shaking optimizations
- [ ] Add ES2020+ features with proper transpilation
- [ ] Consider monorepo structure for better organization

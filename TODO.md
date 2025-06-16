# pangu.js TODO List

## ✅ Completed

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

## 📋 To Do

### High Priority

- [ ] Update Chrome Extension to use new TypeScript builds
- [ ] Remove Angular.js from Chrome Extension (200KB+ savings)
- [ ] Rewrite popup.js and options.js in TypeScript
- [ ] Set up GitHub Actions CI/CD

### Code Quality

- [ ] Set up ESLint 9 with TypeScript support
- [ ] Add Prettier or Biome for code formatting

### Chrome Extension Enhancement

- [ ] Use Vite to build Chrome Extension
- [ ] Modernize UI (remove jQuery/Angular dependencies)
- [ ] Add TypeScript types for Chrome Extension API
- [ ] Update extension icons for high DPI displays

### Future Enhancements

- [ ] Implement tree-shaking optimizations
- [ ] Add ES2020+ features with proper transpilation
- [ ] Consider monorepo structure for better organization

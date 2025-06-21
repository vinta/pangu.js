# pangu.js TODO List

**Last Updated:** June 21, 2025, 7:13 PM

> Note: When completing a task, move it from "To Do" to "Completed" section to maintain history.

## Completed

- [x] Chrome Extension Manifest V3 compatibility
- [x] Migrate all source code to TypeScript
- [x] Replace Webpack/Babel with Vite
- [x] Replace Mocha/Chai/Karma with Vitest/Playwright
- [x] Add UMD build format support
- [x] Enable full TypeScript strict mode
- [x] Set up ESLint and Prettier
- [x] Create `publish-package` script for version management
- [x] Set up GitHub Actions CI/CD workflow
- [x] Refactor TypeScript configuration with separate tsconfig files for node/browser
- [x] Add ES2020+ features with proper transpilation (target: ES2022)

## To Do

### High Priority

- [ ] Update Chrome Extension to use new TypeScript builds
  - Currently using old pangu.min.js v4.0.7 instead of new dist/ builds
- [ ] Remove Angular.js from Chrome Extension (200KB+ savings)
  - Still using Angular.js 1.2.9 with jQuery 2.1.0
- [ ] Rewrite popup.js and options.js in TypeScript
  - Both files are still plain JavaScript in browser_extensions/chrome/js/

### Chrome Extension Enhancement

- [ ] Use Vite to build Chrome Extension
  - No Vite config exists for extension build
- [ ] Modernize UI (remove jQuery/Angular dependencies)
  - jQuery 2.1.0 and Angular.js 1.2.9 still in use
- [ ] Add TypeScript types for Chrome Extension API
  - No @types/chrome package installed
- [ ] Update extension icons for high DPI displays

### Future Enhancements

- [ ] Implement tree-shaking optimizations
- [ ] Consider monorepo structure for better organization
- [ ] Add changelog generation with standard-version
- [ ] Publish to JSR (JavaScript Registry) in addition to npm

# Financial Kompas - Hardening Roadmap

This document outlines the next steps to improve the robustness, testability, and maintainability of the Financial Kompas application.

## Completed ✓
- [x] Extract core pure calculation functions to `src/engine.js`
- [x] Add comprehensive Jest test suite in `test/engine.test.js`
- [x] Define JSON Schema for PARAMS validation (`params.schema.json`)
- [x] Set up GitHub Actions workflow for automated testing
- [x] Document installation and testing procedures

## High Priority Tasks

### 1. Integrate Engine Module into Main Application
- [ ] Refactor `script.js` to import and use functions from `src/engine.js`
- [ ] Replace duplicate calculation logic in `calculateNetherlands()` with `calculateNLNettoPure()`
- [ ] Ensure no regression in UI functionality
- [ ] Test all user scenarios after integration

### 2. Add Runtime Parameter Validation
- [ ] Install and configure a JSON Schema validator (e.g., `ajv`)
- [ ] Validate `config.json` against `params.schema.json` on application load
- [ ] Display user-friendly error messages for invalid configuration
- [ ] Add validation to CI/CD pipeline

### 3. Expand Test Coverage
- [ ] Add tests for French income tax calculation (progressive brackets, family parts)
- [ ] Add tests for Belgian tax calculation
- [ ] Add edge case tests (extreme values, boundary conditions)
- [ ] Add integration tests that validate full calculation flows
- [ ] Achieve >90% code coverage on calculation functions

### 4. Domain Expert Review
- [ ] Have tax professionals review Dutch tax calculations
- [ ] Verify French tax rules (especially PFU, IFI, quotient familial)
- [ ] Validate Belgian social contributions and tax calculations
- [ ] Document assumptions and approximations
- [ ] Add citations to official tax documentation

## Medium Priority Tasks

### 5. Code Quality Improvements
- [ ] Add JSDoc comments to all functions in `script.js`
- [ ] Set up ESLint with appropriate rules
- [ ] Add Prettier for code formatting
- [ ] Refactor large functions into smaller, testable units
- [ ] Remove dead code and unused variables

### 6. Enhanced Testing Infrastructure
- [ ] Add test coverage reporting (Jest coverage)
- [ ] Set up snapshot testing for breakdown text generation
- [ ] Add performance benchmarks for calculation functions
- [ ] Create test fixtures for realistic scenarios
- [ ] Add visual regression testing for UI components

### 7. Improved Error Handling
- [ ] Add try-catch blocks around all calculation functions in UI code
- [ ] Display validation errors to users in a friendly way
- [ ] Log errors for debugging (with privacy considerations)
- [ ] Add fallback values for missing or invalid parameters
- [ ] Implement graceful degradation for browser compatibility

## Lower Priority Tasks

### 8. Documentation
- [ ] Create user guide with examples
- [ ] Document calculation methodologies
- [ ] Add inline help/tooltips for complex fields
- [ ] Create FAQ section
- [ ] Add multilingual support for documentation

### 9. Advanced Features
- [ ] Add ability to save/load scenarios
- [ ] Implement scenario comparison (side-by-side)
- [ ] Add historical parameter sets (previous tax years)
- [ ] Create exportable PDF reports
- [ ] Add charts/visualizations for tax breakdown

### 10. Performance Optimization
- [ ] Minimize bundle size (if using bundler)
- [ ] Lazy load non-critical resources
- [ ] Cache calculation results for unchanged inputs
- [ ] Optimize re-renders in UI

## Future Considerations

### Security & Privacy
- [ ] Ensure no sensitive data is logged or transmitted
- [ ] Add Content Security Policy headers
- [ ] Review third-party dependencies for vulnerabilities
- [ ] Add disclaimer about unofficial calculations

### Accessibility
- [ ] Ensure WCAG 2.1 AA compliance
- [ ] Test with screen readers
- [ ] Add keyboard navigation support
- [ ] Improve color contrast and text sizing

### Browser Compatibility
- [ ] Test on all major browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Add polyfills if needed
- [ ] Document minimum supported browser versions

---

## How to Contribute

1. Pick a task from this list
2. Create a feature branch
3. Implement the change with tests
4. Submit a pull request with clear description
5. Ensure all CI checks pass

## Questions or Suggestions?

Please open an issue in the repository to discuss priorities, suggest new tasks, or ask questions about the roadmap.

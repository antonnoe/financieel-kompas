# Financieel Kompas

A comprehensive tax comparison calculator for comparing income and wealth taxation between the Netherlands, Belgium, and France. This tool helps individuals and couples understand their tax obligations and net income across different European tax jurisdictions.

## Features

- 🇳🇱 **Netherlands Tax Calculations**: Box 1 (work/pension), Box 3 (wealth), social contributions
- 🇧🇪 **Belgium Tax Calculations**: Progressive income tax, social security, municipal tax
- 🇫🇷 **France Tax Calculations**: Progressive income tax, PFU investment tax, IFI wealth tax, quotient familial
- 👨‍👩‍👧‍👦 **Household Types**: Support for singles and couples with children
- 💼 **Income Sources**: Salary, business income, pensions, annuities, investment income
- 📊 **Detailed Breakdowns**: Comprehensive analysis of taxes and deductions

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- For development/testing: Node.js 18.x or 20.x

### Running the Application

Simply open `index.html` in your web browser. No installation or build process required for basic usage.

## Development

### Installation

```bash
# Clone the repository
git clone https://github.com/antonnoe/financieel-kompas.git
cd financieel-kompas

# Install dependencies
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

Current test coverage: **94.56%** on core calculation functions

The test suite includes:
- 37 comprehensive tests
- Unit tests for all core calculation functions
- Edge case and error handling tests
- Integration tests for realistic scenarios

## Project Structure

```
financieel-kompas/
├── index.html              # Main application HTML
├── script.js               # Main application logic and UI
├── style.css               # Application styling
├── config.json             # Tax parameters and configuration
├── src/
│   └── engine.js          # Core calculation engine (pure functions)
├── test/
│   └── engine.test.js     # Jest test suite
├── params.schema.json      # JSON Schema for parameter validation
├── TODO.md                 # Roadmap and future improvements
├── package.json            # Node.js dependencies and scripts
└── .github/
    └── workflows/
        └── nodejs-test.yml # GitHub Actions CI workflow
```

## Core Calculation Engine

The `src/engine.js` module contains pure, testable calculation functions:

### `computeFamilyParts(isCouple, children)`
Calculates French quotient familial (family parts) for tax calculation.

### `computePFUTax(investmentIncome, params)`
Calculates PFU (flat tax) on investment income in France.

### `computeIFI(propertyWealth, params)`
Calculates IFI (wealth tax on property) in France using progressive brackets.

### `calculateNLNettoPure(pensionIncome, salary, businessIncome, isAboveAOW, params)`
Calculates net income for Netherlands Box 1 with proper tax credits and deductions.

## Configuration

Tax parameters are defined in `config.json`. The file includes:

- Tax rates and brackets for NL, BE, and FR
- Social contribution percentages
- Tax credits and deductions
- Exemptions and thresholds

To modify parameters, edit `config.json` according to the schema in `params.schema.json`.

## Testing

Tests are written using Jest and cover:

1. **Family Parts Calculation**: Validates quotient familial logic
2. **PFU Tax**: Tests flat tax on investment income
3. **IFI Wealth Tax**: Progressive bracket calculations
4. **NL Net Income**: Comprehensive Dutch tax calculation tests
5. **Error Handling**: Input validation and edge cases
6. **Integration Scenarios**: Realistic multi-country scenarios

## Continuous Integration

GitHub Actions automatically runs tests on:
- Every push to `main`, `develop`, or `copilot/**` branches
- Every pull request to `main` or `develop`
- Multiple Node.js versions (18.x, 20.x)

## Next Steps

See [TODO.md](TODO.md) for the complete roadmap. High priority tasks include:

1. **Integrate Engine**: Replace duplicate logic in `script.js` with `src/engine.js`
2. **Parameter Validation**: Add runtime validation using `params.schema.json`
3. **Expand Tests**: Cover French and Belgian calculations
4. **Domain Review**: Verify calculations with tax professionals

## Contributing

1. Pick a task from [TODO.md](TODO.md)
2. Create a feature branch
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

## Limitations and Disclaimers

⚠️ **Important**: This calculator provides estimates based on simplified models of tax systems. It should not be used as the sole basis for financial decisions.

- Tax rules are complex and change frequently
- Many edge cases and special situations are not modeled
- Always consult with qualified tax professionals
- Calculations are for informational purposes only

### Known Limitations

- French pension calculations use simplified assumptions
- Belgian municipal tax uses average rates
- Special deductions and credits may not be fully modeled
- Cross-border tax treaties are not fully considered

## License

ISC

## Support

For questions, issues, or suggestions:
- Open an issue in the repository
- Refer to the [TODO.md](TODO.md) for planned improvements
- Check test files for example usage

## Acknowledgments

This project aims to help individuals understand complex tax scenarios across European jurisdictions. It is an educational tool and should be used in conjunction with professional tax advice.

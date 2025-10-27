# Copilot Instructions for Financieel Kompas

## Project Overview

Financieel Kompas is a privacy-focused financial comparison tool that helps Dutch and Belgian citizens compare the tax and financial implications of living in France versus their home country (Netherlands or Belgium).

**Key Features:**
- Compare net income after taxes and social contributions for NL/BE vs FR
- Support for various income types (salary, business, pensions, investments)
- Tax calculations for Netherlands, Belgium, and France
- Wealth tax calculations (Box 3 for NL, IFI for France)
- Privacy-first: All calculations run locally in the browser, no data is stored or transmitted

## Technology Stack

This is a **vanilla JavaScript project** with no build tools or dependencies:
- **HTML**: Single-page application (`index.html`)
- **CSS**: Custom styling (`style.css`) with CSS variables
- **JavaScript**: Pure vanilla JS (`script.js`), no frameworks
- **Configuration**: Tax parameters stored in `config.json`

## Project Structure

```
/
├── index.html        # Main HTML structure with form inputs and results display
├── script.js         # Core calculation logic and DOM manipulation
├── style.css         # Styling with CSS variables and responsive design
└── config.json       # Tax parameters and rates for NL, BE, and FR
```

## Code Style & Conventions

### JavaScript
- Use ES6+ features (arrow functions, const/let, template literals)
- DOM elements cached at initialization for performance
- Event delegation pattern for input changes
- Functions organized by country (calculateNetherlands, calculateBelgium, calculateFrance)
- Helper functions prefixed with descriptive names (e.g., `getAOWDateInfo`, `formatCurrency`)
- Comments in Dutch for domain-specific terminology

### HTML
- Semantic HTML5 elements
- Uses `<details>` for collapsible sections
- Input elements use range sliders with visible value outputs
- Country-specific fields toggle with CSS classes (`.nl-specific`, `.be-specific`, `.fr-specific`)
- Accessibility: tooltips use data attributes for explanations

### CSS
- CSS custom properties (variables) for theming in `:root`
- Mobile-first responsive design
- BEM-like naming for component-specific classes
- Sticky positioning for results bar
- Dutch class names for consistency with content

### Configuration
- `config.json` contains all tax rates, thresholds, and allowances
- Organized by country (NL, BE, FR)
- Uses "Infinity" as string for unlimited tax brackets (converted in JS)
- All monetary values in euros

## Key Domain Knowledge

### Tax Systems
1. **Netherlands (NL)**
   - Box 1: Income tax with progressive rates
   - Box 3: Wealth tax with deemed return (forfaitair rendement)
   - AOW: State pension (Algemene Ouderdomswet)
   - Zvw: Healthcare contribution
   - Tax credits: General (AHK) and labor (Arbeidskorting)

2. **Belgium (BE)**
   - Federal tax with progressive rates
   - Municipal tax (gemeentebelasting) added on top
   - RSZ: Social security contributions for employees
   - Professional expense allowance (forfait beroepskosten)
   - BSZB: Special social security contribution
   - Roerende voorheffing: Withholding tax on investments

3. **France (FR)**
   - Progressive income tax with quotient familial (parts per household member)
   - Social contributions on various income types
   - PFU (Prélèvement Forfaitaire Unique): Flat tax on investment income
   - IFI (Impôt sur la Fortune Immobilière): Wealth tax on real estate >€1.3M
   - Abattements: Deductions for business income and seniors
   - Tax credits: e.g., 50% for home help services

### Important Calculations
- **AOW eligibility**: Based on birthdate, with gradual increase to age 67
- **Work years**: Maximum 50 years combined EU work years (NL/BE + FR)
- **Pension timing**: State pension starts at AOW age, private pensions can vary
- **Annuity (Lijfrente)**: Partially taxed in France based on age when started
- **Tax treaties**: Different income types taxed in different countries

## Development Guidelines

### Making Changes

1. **Tax Calculations**: 
   - Modify calculation functions in `script.js` (search for `calculate` prefix)
   - Update tax parameters in `config.json`
   - Always maintain the breakdown structure for transparency

2. **UI Changes**:
   - HTML structure changes require updating DOM element selectors in `initializeApp()`
   - Keep input/output element pairs synchronized (slider + value display)
   - Maintain country-specific field visibility logic

3. **Adding New Features**:
   - Follow the existing pattern: input → calculation → output → breakdown
   - Update `generateBreakdown()` to include new calculations in the analysis text
   - Ensure proper simulation date handling (future scenarios)

### Testing & Validation

**No automated tests exist.** Manual testing is required:

1. **Browser Testing**: Open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge)
2. **Functionality Testing**:
   - Test both single and couple scenarios
   - Test both NL and BE comparison modes
   - Verify calculations with known test cases
   - Check that simulation date affects pension eligibility correctly
3. **UI Testing**:
   - Verify all sliders update their display values
   - Check country-specific fields show/hide correctly
   - Ensure results bar remains sticky on scroll
   - Test on mobile viewport sizes

### Common Pitfall to Avoid

- **Simulation Date**: Always use the simulation date (not current date) when determining pension eligibility and age-based calculations
- **Work Years**: Enforce maximum of 50 combined years across countries
- **Tax Treaties**: Respect which country taxes which income type (e.g., government pensions taxed in source country)
- **Lijfrente Fractions**: Tax-free portion depends on age when annuity *started*, not current age

## Language & Content

- **UI Language**: Dutch (Nederlands)
- **Code Comments**: Dutch for domain terminology, English for technical concepts is acceptable
- **User-Facing Text**: Always in Dutch
- **Currency**: Euro (€) with Dutch number formatting (e.g., "€ 1.234")

## Privacy & Security

- **No Server-Side Code**: Everything runs in the browser
- **No Analytics**: No tracking or data collection
- **No External Dependencies**: No CDN links, all resources local
- **Privacy Notice**: Prominently displayed to users

## When Making Changes

1. Preserve the privacy-first architecture (no external calls)
2. Maintain accuracy of tax calculations - verify against official sources
3. Keep the tool accessible and easy to use
4. Update the breakdown/analysis text to explain new calculations
5. Test thoroughly with various scenarios (single/couple, young/old, different income types)
6. Document any tax law changes with inline comments

## Resources for Tax Information

When updating tax parameters, consult:
- Netherlands: Belastingdienst.nl
- Belgium: Financien.belgium.be, Socialsecurity.belgium.be
- France: Service-public.fr
- Cross-border: Grensinfo.nl

## Questions?

For tax law interpretation or complex scenarios, remember this is a simplified educational tool. Complex cases should always be referred to qualified tax advisors.

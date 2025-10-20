# Landing Wizard Documentation

## Overview

The landing wizard is a user-friendly onboarding experience that guides users through essential questions before accessing the main Financial Kompas tool. It collects key information and pre-fills the main form, making the tool more accessible for first-time users.

## Features

The wizard consists of 4 steps:

1. **Country Selection**: Choose between Netherlands (🇳🇱) or Belgium (🇧🇪) for comparison with France
2. **Household Type**: Select either single (👤) or couple (👥) 
3. **Birth Date**: Enter birth year and month (years populated from 1940 to current year minus 18)
4. **Emigration Date**: Optional emigration/scenario date (for future planning)

## Architecture

### Files

- **partials/landing-step.html**: HTML markup for the wizard UI with inline styles
- **assets/landing.js**: JavaScript logic for wizard navigation, validation, and data transfer
- **assets/landing.css**: Additional CSS for animations and responsive design
- **index.html**: Main file with integrated landing wizard

### Data Flow

1. User completes wizard steps
2. Answers are validated in real-time
3. On completion, data is:
   - Saved to localStorage under key `fk_landing`
   - Transferred to main form fields
   - Used to call main app functions (`updateComparisonCountry`, `updateHouseholdType`, `updateScenario`)
4. Landing wizard is hidden and main form is displayed

### localStorage Format

```javascript
{
  "country": "NL",           // or "BE"
  "household": "single",     // or "couple"
  "birthYear": 1960,        // number
  "birthMonth": 1,          // 1-12
  "emigrationYear": 2030,   // number or null
  "emigrationMonth": 6,     // 1-12 or null
  "timestamp": "2025-10-20T..."
}
```

### Custom Event

After completion, the wizard dispatches a custom event:

```javascript
document.addEventListener('fk:landing:complete', function(event) {
  console.log(event.detail); // Contains all landing data
});
```

## Integration with Main Form

The landing wizard transfers data to these main form fields:

- `birth-year-1`: Birth year for Partner 1
- `birth-month-1`: Birth month for Partner 1
- `sim-year`: Simulation/emigration year
- `sim-month`: Simulation/emigration month

It also calls these main app functions if available:
- `updateComparisonCountry(country)`: Sets NL or BE comparison
- `updateHouseholdType(isCouple)`: Sets single or couple mode
- `updateScenario()`: Triggers recalculation

## Styling

### Color Scheme

- **H1 Color**: `#800000` (maroon) - per requirement
- **Primary Button**: `#003366` (dark blue)
- **Selected State**: `#003366` background with white text
- **Disclaimer**: Green background (`#e6f4ea`) with left border

### Accessibility

- All buttons and selects have proper IDs
- ARIA labels on date selects
- Focus states with visible outlines
- Keyboard navigation support
- Responsive design for mobile devices

## Testing Locally

### Option 1: Direct File Access

1. Navigate to the repository directory
2. Open `index.html` in a web browser
3. The landing wizard should appear first
4. Complete all 4 steps
5. Main form should appear with pre-filled data

### Option 2: Local Server

```bash
# Using Python 3
python3 -m http.server 8000

# Or using Node.js (http-server)
npx http-server .

# Then open http://localhost:8000
```

### Option 3: HTMLPreview

View online without cloning:
```
https://htmlpreview.github.io/?https://github.com/antonnoe/financieel-kompas/blob/finish-extract-engine/index.html
```

## Testing Checklist

- [ ] Landing wizard appears on page load
- [ ] Main form is hidden initially
- [ ] Step 1: Country buttons are clickable and show selected state
- [ ] Step 1: Next button is disabled until country is selected
- [ ] Step 2: Household buttons work correctly
- [ ] Step 3: Birth year dropdown is populated (1940 to current-18)
- [ ] Step 3: Birth month dropdown has all 12 months
- [ ] Step 3: Next button is disabled until both are selected
- [ ] Step 4: Emigration fields are optional (can be left empty)
- [ ] Back buttons navigate to previous steps
- [ ] Completion button transfers data to main form
- [ ] Landing wizard hides after completion
- [ ] Main form displays after completion
- [ ] Main form fields are pre-filled correctly
- [ ] Country comparison is set (NL or BE)
- [ ] Household type is set (single or couple)
- [ ] localStorage contains `fk_landing` key with correct data
- [ ] Custom event `fk:landing:complete` is dispatched

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- localStorage support
- ES6 JavaScript
- CSS3

## Troubleshooting

### Landing wizard doesn't appear
- Check that `assets/landing.js` is loaded
- Check browser console for errors
- Verify `#landing-step` element exists in HTML

### Main form doesn't show after completion
- Check that `#main-form` element exists
- Verify `script.js` is loaded
- Check console for JavaScript errors

### Data not transferring to main form
- Verify main form field IDs match expected names
- Check that `script.js` exposes global functions
- Look for timing issues (the code uses 100ms delay)

### localStorage not saving
- Check browser privacy settings
- Verify localStorage is enabled
- Check for quota exceeded errors

## Future Enhancements

Potential improvements:
- Progress indicator showing 1/4, 2/4, etc.
- Animation between steps
- Save and resume functionality
- Skip landing wizard option for returning users
- Pre-fill from URL parameters
- Validation messages for invalid dates
- Integration with analytics (privacy-preserving)

## Maintenance

### Updating Year Ranges

Birth years are calculated dynamically:
- Start: 1940 (configurable in `landing.js`)
- End: Current year - 18 (minimum age)

Emigration years are also dynamic:
- Start: Current year - 10
- End: Current year + 20

### Modifying Steps

To add or modify steps:
1. Add new step HTML in `partials/landing-step.html`
2. Update navigation buttons in `assets/landing.js`
3. Add validation logic for new step
4. Update `completeLanding()` to handle new data
5. Update this documentation

## Support

For issues or questions:
- Check browser console for errors
- Review this documentation
- Test in a different browser
- Clear localStorage and try again
- Check that all files are present and loaded correctly

---

Last updated: October 2025

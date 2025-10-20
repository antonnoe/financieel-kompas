/**
 * Financial Kompas - Core Calculation Engine
 * 
 * Pure calculation functions extracted from the main application.
 * These functions are stateless, side-effect free, and testable.
 * They operate on numeric inputs and return structured results.
 */

/**
 * Computes the number of family parts (quotient familial) for French tax calculation.
 * 
 * @param {boolean} isCouple - Whether the household is a couple
 * @param {number} children - Number of dependent children
 * @returns {number} Number of family parts for tax calculation
 * 
 * Rules:
 * - Single person: 1 part
 * - Couple: 2 parts
 * - First 2 children: 0.5 parts each
 * - 3rd+ children: 1 part each
 */
function computeFamilyParts(isCouple, children) {
    // Validate inputs
    if (typeof isCouple !== 'boolean') {
        throw new TypeError('isCouple must be a boolean');
    }
    if (!Number.isFinite(children) || children < 0) {
        throw new TypeError('children must be a non-negative number');
    }

    const baseParts = isCouple ? 2 : 1;
    const childrenCount = Math.floor(children);
    
    let childParts = 0;
    if (childrenCount <= 2) {
        childParts = childrenCount * 0.5;
    } else {
        // First 2 children: 0.5 each = 1 part
        // Remaining children: 1 part each
        childParts = 1 + (childrenCount - 2) * 1;
    }
    
    return baseParts + childParts;
}

/**
 * Computes the PFU (Prélèvement Forfaitaire Unique) tax on investment income in France.
 * 
 * @param {number} investmentIncome - Total investment income (dividends, interest, etc.)
 * @param {Object} params - Tax parameters
 * @param {number} params.pfuTarief - PFU tax rate (typically 12.8%)
 * @param {number} params.pfuSocialRate - PFU social contributions rate (typically 17.2%)
 * @returns {Object} Object with pfuTax, pfuSocial, and total
 */
function computePFUTax(investmentIncome, params) {
    // Validate inputs
    if (!Number.isFinite(investmentIncome) || investmentIncome < 0) {
        throw new TypeError('investmentIncome must be a non-negative number');
    }
    if (!params || typeof params !== 'object') {
        throw new TypeError('params must be an object');
    }
    if (!Number.isFinite(params.pfuTarief) || params.pfuTarief < 0 || params.pfuTarief > 1) {
        throw new TypeError('params.pfuTarief must be a number between 0 and 1');
    }
    if (!Number.isFinite(params.pfuSocialRate) || params.pfuSocialRate < 0 || params.pfuSocialRate > 1) {
        throw new TypeError('params.pfuSocialRate must be a number between 0 and 1');
    }

    const pfuTax = investmentIncome * params.pfuTarief;
    const pfuSocial = investmentIncome * params.pfuSocialRate;
    
    return {
        pfuTax,
        pfuSocial,
        total: pfuTax + pfuSocial
    };
}

/**
 * Computes the IFI (Impôt sur la Fortune Immobilière) wealth tax on property in France.
 * Uses a progressive bracket system.
 * 
 * @param {number} propertyWealth - Total value of taxable property
 * @param {Object} params - IFI parameters
 * @param {number} params.threshold - Minimum wealth threshold (typically 1,300,000 EUR)
 * @param {Array} params.brackets - Array of {grens: number, tarief: number} objects
 * @returns {number} Total IFI tax amount
 * 
 * Note: Property value below threshold is not taxed.
 * Brackets apply progressively to amounts within each range.
 */
function computeIFI(propertyWealth, params) {
    // Validate inputs
    if (!Number.isFinite(propertyWealth) || propertyWealth < 0) {
        throw new TypeError('propertyWealth must be a non-negative number');
    }
    if (!params || typeof params !== 'object') {
        throw new TypeError('params must be an object');
    }
    if (!Number.isFinite(params.threshold) || params.threshold < 0) {
        throw new TypeError('params.threshold must be a non-negative number');
    }
    if (!Array.isArray(params.brackets) || params.brackets.length === 0) {
        throw new TypeError('params.brackets must be a non-empty array');
    }

    // If below threshold, no tax
    if (propertyWealth <= params.threshold) {
        return 0;
    }

    let tax = 0;
    let previousLimit = 800000; // First bracket starts at 800k (always 0% rate)
    
    for (const bracket of params.brackets) {
        const currentLimit = bracket.grens === Infinity ? Infinity : Number(bracket.grens);
        const rate = Number(bracket.tarief);
        
        if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
            throw new TypeError('bracket tarief must be a number between 0 and 1');
        }
        
        // If wealth is below this bracket's lower bound, we're done
        if (propertyWealth <= previousLimit) {
            break;
        }
        
        // Calculate the amount in this bracket
        const amountInBracket = Math.max(0, Math.min(propertyWealth, currentLimit) - previousLimit);
        tax += amountInBracket * rate;
        
        previousLimit = currentLimit;
        
        // If we've processed the bracket containing the total wealth, we're done
        if (propertyWealth <= currentLimit) {
            break;
        }
    }
    
    return tax;
}

/**
 * Calculates net income for Netherlands Box 1 income (work and pension).
 * This is a simplified version for testing core tax calculation logic.
 * 
 * @param {number} pensionIncome - Pension and annuity income
 * @param {number} salary - Salary income
 * @param {number} businessIncome - Business income (before profit exemption)
 * @param {boolean} isAboveAOW - Whether person is above state pension age
 * @param {Object} params - NL tax parameters (BOX1 and SOCIALE_LASTEN.ZVW_PERCENTAGE)
 * @returns {Object} Object with bruto, tax, and netto amounts
 */
function calculateNLNettoPure(pensionIncome, salary, businessIncome, isAboveAOW, params) {
    // Validate inputs
    if (!Number.isFinite(pensionIncome) || pensionIncome < 0) {
        throw new TypeError('pensionIncome must be a non-negative number');
    }
    if (!Number.isFinite(salary) || salary < 0) {
        throw new TypeError('salary must be a non-negative number');
    }
    if (!Number.isFinite(businessIncome) || businessIncome < 0) {
        throw new TypeError('businessIncome must be a non-negative number');
    }
    if (typeof isAboveAOW !== 'boolean') {
        throw new TypeError('isAboveAOW must be a boolean');
    }
    if (!params || typeof params !== 'object') {
        throw new TypeError('params must be an object');
    }

    // Extract parameters with defaults
    const mkbVrijstelling = params.MKB_WINSTVRIJSTELLING || 0;
    const zvwPercentage = params.ZVW_PERCENTAGE || 0;
    const tariefOnderAOW = params.TARIEVEN_ONDER_AOW || [0.3697, 0.495];
    const tariefBovenAOW = params.TARIEVEN_BOVEN_AOW || [0.1907, 0.495];
    const grensSchijf1 = params.GRENS_SCHIJF_1 || 75518;
    const ahkMax = params.ALGEMENE_HEFFINGSKORTING_MAX || 3362;
    const arbeidskortingMax = params.ARBEIDSKORTING_MAX || 5532;
    const hkAfbouwStart = params.HK_AFBOUW_START || 24813;
    const hkAfbouwFactor = params.HK_AFBOUW_FACTOR || 0.0663;

    // Calculate taxable business income (after MKB profit exemption)
    const taxableBusinessIncome = businessIncome > 0 ? businessIncome * (1 - mkbVrijstelling) : 0;
    
    // Calculate ZVW (health insurance contribution) on business income
    const zvw = taxableBusinessIncome * zvwPercentage;
    
    // Total gross income for tax calculation
    const brutoIncome = pensionIncome + salary + taxableBusinessIncome;
    
    // Handle edge cases
    if (brutoIncome <= 0 && zvw <= 0) {
        return { bruto: 0, tax: 0, netto: 0 };
    }
    if (brutoIncome <= 0 && zvw > 0) {
        return { bruto: 0, tax: zvw, netto: -zvw };
    }
    
    // Select tax rates based on age
    const taxRates = isAboveAOW ? tariefBovenAOW : tariefOnderAOW;
    
    // Calculate income tax using progressive brackets
    let incomeTax = 0;
    if (brutoIncome <= grensSchijf1) {
        incomeTax = brutoIncome * taxRates[0];
    } else {
        incomeTax = (grensSchijf1 * taxRates[0]) + ((brutoIncome - grensSchijf1) * taxRates[1]);
    }
    
    // Calculate tax credits
    let arbeidskorting = (salary > 0 || businessIncome > 0) ? arbeidskortingMax : 0;
    let algHeffingskorting = ahkMax;
    
    // Apply means testing (afbouw) for general tax credit
    if (brutoIncome > hkAfbouwStart) {
        algHeffingskorting = Math.max(0, algHeffingskorting - ((brutoIncome - hkAfbouwStart) * hkAfbouwFactor));
    }
    
    // No tax credits above second bracket
    if (brutoIncome >= grensSchijf1) {
        algHeffingskorting = 0;
    }
    
    // Apply afbouw for arbeidskorting (simplified)
    const akAfbouwStart = 39957;
    if (brutoIncome > akAfbouwStart) {
        arbeidskorting = Math.max(0, arbeidskorting - ((brutoIncome - akAfbouwStart) * 0.0651));
    }
    
    // Final tax after credits
    incomeTax = Math.max(0, incomeTax - algHeffingskorting - arbeidskorting);
    
    const totalTax = incomeTax + zvw;
    
    return {
        bruto: brutoIncome,
        tax: totalTax,
        netto: brutoIncome - totalTax
    };
}

// Export functions for use in Node.js tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        computeFamilyParts,
        computePFUTax,
        computeIFI,
        calculateNLNettoPure
    };
}

/**
 * Tests for Financial Kompas Core Calculation Engine
 * 
 * These tests validate the pure calculation functions against known scenarios.
 */

const {
    computeFamilyParts,
    computePFUTax,
    computeIFI,
    calculateNLNettoPure
} = require('../src/engine.js');

describe('computeFamilyParts', () => {
    test('single person with no children', () => {
        expect(computeFamilyParts(false, 0)).toBe(1);
    });

    test('couple with no children', () => {
        expect(computeFamilyParts(true, 0)).toBe(2);
    });

    test('single person with 1 child', () => {
        expect(computeFamilyParts(false, 1)).toBe(1.5);
    });

    test('couple with 2 children', () => {
        expect(computeFamilyParts(true, 2)).toBe(3);
    });

    test('couple with 3 children', () => {
        // Base 2 + first 2 children (1) + 1 additional child (1) = 4
        expect(computeFamilyParts(true, 3)).toBe(4);
    });

    test('couple with 5 children', () => {
        // Base 2 + first 2 children (1) + 3 additional children (3) = 6
        expect(computeFamilyParts(true, 5)).toBe(6);
    });

    test('single person with 4 children', () => {
        // Base 1 + first 2 children (1) + 2 additional children (2) = 4
        expect(computeFamilyParts(false, 4)).toBe(4);
    });

    test('handles decimal children by flooring', () => {
        expect(computeFamilyParts(true, 2.7)).toBe(3);
    });

    test('throws error for invalid isCouple', () => {
        expect(() => computeFamilyParts('true', 0)).toThrow(TypeError);
        expect(() => computeFamilyParts(null, 0)).toThrow(TypeError);
    });

    test('throws error for negative children', () => {
        expect(() => computeFamilyParts(true, -1)).toThrow(TypeError);
    });

    test('throws error for non-numeric children', () => {
        expect(() => computeFamilyParts(true, 'two')).toThrow(TypeError);
    });
});

describe('computePFUTax', () => {
    test('calculates PFU on investment income', () => {
        const result = computePFUTax(10000, {
            pfuTarief: 0.128,
            pfuSocialRate: 0.172
        });
        
        expect(result.pfuTax).toBeCloseTo(1280, 2);
        expect(result.pfuSocial).toBeCloseTo(1720, 2);
        expect(result.total).toBeCloseTo(3000, 2);
    });

    test('handles zero investment income', () => {
        const result = computePFUTax(0, {
            pfuTarief: 0.128,
            pfuSocialRate: 0.172
        });
        
        expect(result.pfuTax).toBe(0);
        expect(result.pfuSocial).toBe(0);
        expect(result.total).toBe(0);
    });

    test('calculates with different rates', () => {
        const result = computePFUTax(5000, {
            pfuTarief: 0.15,
            pfuSocialRate: 0.20
        });
        
        expect(result.pfuTax).toBe(750);
        expect(result.pfuSocial).toBe(1000);
        expect(result.total).toBe(1750);
    });

    test('throws error for negative investment income', () => {
        expect(() => computePFUTax(-1000, { pfuTarief: 0.128, pfuSocialRate: 0.172 }))
            .toThrow(TypeError);
    });

    test('throws error for missing params', () => {
        expect(() => computePFUTax(10000, null)).toThrow(TypeError);
    });

    test('throws error for invalid pfuTarief', () => {
        expect(() => computePFUTax(10000, { pfuTarief: 1.5, pfuSocialRate: 0.172 }))
            .toThrow(TypeError);
        expect(() => computePFUTax(10000, { pfuTarief: -0.1, pfuSocialRate: 0.172 }))
            .toThrow(TypeError);
    });
});

describe('computeIFI', () => {
    const ifiParams = {
        threshold: 1300000,
        brackets: [
            { grens: 800000, tarief: 0.0 },
            { grens: 1300000, tarief: 0.005 },
            { grens: 2570000, tarief: 0.007 },
            { grens: 5000000, tarief: 0.01 },
            { grens: 10000000, tarief: 0.0125 },
            { grens: Infinity, tarief: 0.015 }
        ]
    };

    test('no tax below or at threshold', () => {
        expect(computeIFI(1000000, ifiParams)).toBe(0);
        expect(computeIFI(1299999, ifiParams)).toBe(0);
        expect(computeIFI(1300000, ifiParams)).toBe(0);
    });

    test('tax just above threshold', () => {
        // At 1,300,001: only the 800k-1.3M bracket applies
        // (1,300,001 - 800,000) * 0.005 = 2,500.005
        expect(computeIFI(1300001, ifiParams)).toBeCloseTo(2500.005, 2);
    });

    test('tax in second bracket', () => {
        // At 1,500,000:
        // (1,300,000 - 800,000) * 0.005 = 2,500
        // (1,500,000 - 1,300,000) * 0.007 = 1,400
        // Total: 3,900
        expect(computeIFI(1500000, ifiParams)).toBe(3900);
    });

    test('tax in third bracket', () => {
        // At 3,000,000:
        // (1,300,000 - 800,000) * 0.005 = 2,500
        // (2,570,000 - 1,300,000) * 0.007 = 8,890
        // (3,000,000 - 2,570,000) * 0.01 = 4,300
        // Total: 15,690
        expect(computeIFI(3000000, ifiParams)).toBe(15690);
    });

    test('handles very large property values', () => {
        // Test that it doesn't throw errors and calculates something
        const result = computeIFI(50000000, ifiParams);
        expect(result).toBeGreaterThan(0);
        expect(Number.isFinite(result)).toBe(true);
    });

    test('throws error for negative property wealth', () => {
        expect(() => computeIFI(-100000, ifiParams)).toThrow(TypeError);
    });

    test('throws error for missing params', () => {
        expect(() => computeIFI(2000000, null)).toThrow(TypeError);
    });

    test('throws error for invalid brackets', () => {
        expect(() => computeIFI(2000000, { threshold: 1300000, brackets: [] }))
            .toThrow(TypeError);
        expect(() => computeIFI(2000000, { threshold: 1300000, brackets: 'invalid' }))
            .toThrow(TypeError);
    });
});

describe('calculateNLNettoPure', () => {
    const nlParams = {
        MKB_WINSTVRIJSTELLING: 0.127,
        ZVW_PERCENTAGE: 0.0526,
        TARIEVEN_ONDER_AOW: [0.3697, 0.495],
        TARIEVEN_BOVEN_AOW: [0.1907, 0.495],
        GRENS_SCHIJF_1: 75518,
        ALGEMENE_HEFFINGSKORTING_MAX: 3362,
        ARBEIDSKORTING_MAX: 5532,
        HK_AFBOUW_START: 24813,
        HK_AFBOUW_FACTOR: 0.0663
    };

    test('calculates for pension income only (above AOW)', () => {
        const result = calculateNLNettoPure(20000, 0, 0, true, nlParams);
        
        expect(result.bruto).toBe(20000);
        expect(result.tax).toBeGreaterThan(0);
        expect(result.netto).toBeLessThan(result.bruto);
        expect(result.netto).toBeGreaterThan(0);
    });

    test('calculates for salary income only (below AOW)', () => {
        const result = calculateNLNettoPure(0, 40000, 0, false, nlParams);
        
        expect(result.bruto).toBe(40000);
        expect(result.tax).toBeGreaterThan(0);
        expect(result.netto).toBeLessThan(result.bruto);
        // Should benefit from arbeidskorting
        expect(result.netto).toBeGreaterThan(30000);
    });

    test('calculates for business income with MKB exemption', () => {
        const businessIncome = 30000;
        const result = calculateNLNettoPure(0, 0, businessIncome, false, nlParams);
        
        // Business income should be reduced by MKB exemption
        const expectedBruto = businessIncome * (1 - nlParams.MKB_WINSTVRIJSTELLING);
        expect(result.bruto).toBeCloseTo(expectedBruto, 2);
        
        // Should have ZVW contribution
        const expectedZVW = expectedBruto * nlParams.ZVW_PERCENTAGE;
        expect(result.tax).toBeGreaterThan(expectedZVW);
    });

    test('handles combined income sources', () => {
        const result = calculateNLNettoPure(10000, 20000, 15000, false, nlParams);
        
        const expectedBusinessTaxable = 15000 * (1 - nlParams.MKB_WINSTVRIJSTELLING);
        const expectedBruto = 10000 + 20000 + expectedBusinessTaxable;
        
        expect(result.bruto).toBeCloseTo(expectedBruto, 2);
        expect(result.netto).toBeGreaterThan(0);
        expect(result.netto).toBeLessThan(result.bruto);
    });

    test('handles zero income', () => {
        const result = calculateNLNettoPure(0, 0, 0, true, nlParams);
        
        expect(result.bruto).toBe(0);
        expect(result.tax).toBe(0);
        expect(result.netto).toBe(0);
    });

    test('applies different tax rates for above/below AOW', () => {
        const income = 50000;
        const belowAOW = calculateNLNettoPure(income, 0, 0, false, nlParams);
        const aboveAOW = calculateNLNettoPure(income, 0, 0, true, nlParams);
        
        // Tax should be lower for above AOW (lower first bracket rate)
        expect(aboveAOW.tax).toBeLessThan(belowAOW.tax);
        expect(aboveAOW.netto).toBeGreaterThan(belowAOW.netto);
    });

    test('high income reaches second tax bracket', () => {
        const highIncome = 100000;
        const result = calculateNLNettoPure(0, highIncome, 0, false, nlParams);
        
        expect(result.bruto).toBe(highIncome);
        // At this income level, should lose tax credits and pay significant tax
        expect(result.tax).toBeGreaterThan(35000);
        expect(result.netto).toBeLessThan(65000);
    });

    test('throws error for invalid inputs', () => {
        expect(() => calculateNLNettoPure(-1000, 0, 0, true, nlParams)).toThrow(TypeError);
        expect(() => calculateNLNettoPure(0, -500, 0, true, nlParams)).toThrow(TypeError);
        expect(() => calculateNLNettoPure(0, 0, -300, true, nlParams)).toThrow(TypeError);
        expect(() => calculateNLNettoPure(10000, 0, 0, 'yes', nlParams)).toThrow(TypeError);
        expect(() => calculateNLNettoPure(10000, 0, 0, true, null)).toThrow(TypeError);
    });

    test('arbeidskorting only applies with work income', () => {
        const pensionOnly = calculateNLNettoPure(30000, 0, 0, true, nlParams);
        const salaryOnly = calculateNLNettoPure(0, 30000, 0, false, nlParams);
        
        // Salary should have arbeidskorting, resulting in lower tax
        expect(salaryOnly.tax).toBeLessThan(pensionOnly.tax);
    });
});

describe('Integration tests', () => {
    test('realistic scenario: couple with children in France', () => {
        // Couple with 2 children
        const parts = computeFamilyParts(true, 2);
        expect(parts).toBe(3);
        
        // With some investment income
        const pfu = computePFUTax(5000, {
            pfuTarief: 0.128,
            pfuSocialRate: 0.172
        });
        expect(pfu.total).toBe(1500);
    });

    test('realistic scenario: wealthy property owner in France', () => {
        const ifiParams = {
            threshold: 1300000,
            brackets: [
                { grens: 800000, tarief: 0.0 },
                { grens: 1300000, tarief: 0.005 },
                { grens: 2570000, tarief: 0.007 },
                { grens: 5000000, tarief: 0.01 },
                { grens: 10000000, tarief: 0.0125 },
                { grens: Infinity, tarief: 0.015 }
            ]
        };
        
        // Property worth 2 million EUR
        const ifi = computeIFI(2000000, ifiParams);
        expect(ifi).toBeGreaterThan(0);
        expect(ifi).toBeLessThan(20000); // Reasonable sanity check
    });

    test('realistic scenario: Dutch worker with business income', () => {
        const nlParams = {
            MKB_WINSTVRIJSTELLING: 0.127,
            ZVW_PERCENTAGE: 0.0526,
            TARIEVEN_ONDER_AOW: [0.3697, 0.495],
            TARIEVEN_BOVEN_AOW: [0.1907, 0.495],
            GRENS_SCHIJF_1: 75518,
            ALGEMENE_HEFFINGSKORTING_MAX: 3362,
            ARBEIDSKORTING_MAX: 5532,
            HK_AFBOUW_START: 24813,
            HK_AFBOUW_FACTOR: 0.0663
        };
        
        // Worker with 50k salary and 20k business income
        const result = calculateNLNettoPure(0, 50000, 20000, false, nlParams);
        
        expect(result.bruto).toBeGreaterThan(60000); // Salary + reduced business
        expect(result.netto).toBeGreaterThan(40000); // Should have reasonable take-home
        expect(result.netto).toBeLessThan(result.bruto);
    });
});

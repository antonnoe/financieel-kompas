// Audit test for socialBreakdown consistency
// Run locally: node assets/tests/test-audit-social-breakdown.js
const fs = require('fs');
const vm = require('vm');
const path = require('path');

// This test runs script.js in a minimal JS VM with a mocked DOM to extract the calculator functions' output.
// It expects that calculateFrance and calculateBelgium are available in the VM's global scope after loading.

function createMockDOM() {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(`<!doctype html><html><body><div id="calculation-breakdown"></div></body></html>`);
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
}

function runTest() {
  try {
    createMockDOM();
    const scriptPath = path.join(__dirname, '..', '..', 'script.js');
    const code = fs.readFileSync(scriptPath, 'utf8');
    // Run the script in a VM so it defines functions in global scope
    vm.runInThisContext(code, { filename: scriptPath });

    // Now call updateScenario with a small controlled input via exposed functions
    // The script defines calculateFrance and calculateBelgium in global scope (top-level functions)
    if (typeof calculateFrance !== 'function' || typeof calculateBelgium !== 'function') {
      console.error('Required functions not available. Ensure script.js is compatible with running in Node + jsdom.');
      process.exit(2);
    }

    const sample = {
      isCouple: false,
      children: 0,
      cak: false,
      homeHelp: 0,
      wealthFinancial: 10000,
      wealthProperty: 0,
      p1: { birthYear: 1980, birthMonth: 1, salary: 50000, business: 0, pensionPublic: 0, pensionPrivate: 0, lijfrente: 0, bePension: 0, incomeWealth: 10000, frWorkYears: 0, beWorkYears: 0, aowYears: 0, lijfrenteStartAge: 'aow' }
    };

    const fr = calculateFrance(sample, 'NL');
    const be = calculateBelgium(sample);

    function sumSocial(breakdown) {
      if (!breakdown) return 0;
      const sb = breakdown.socialBreakdown || {};
      return (sb.pension||0) + (sb.salary||0) + (sb.business||0) + (sb.lijfrente||0) + (sb.pfu||0) + (sb.bePension||0);
    }

    const frSum = sumSocial(fr.breakdown);
    const frReported = fr.breakdown.socialBreakdown ? fr.breakdown.socialBreakdown.total : fr.breakdown.socialeLasten || 0;

    const beSum = sumSocial(be.breakdown);
    const beReported = be.breakdown.socialBreakdown ? be.breakdown.socialBreakdown.total : be.breakdown.socialeLasten || 0;

    console.log('FR social sum components:', frSum, 'reported total:', frReported);
    console.log('BE social sum components:', beSum, 'reported total:', beReported);

    const eps = 1e-6;
    if (Math.abs(frSum - frReported) > eps) { console.error('FR social breakdown mismatch'); process.exit(2); }
    if (Math.abs(beSum - beReported) > eps) { console.error('BE social breakdown mismatch'); process.exit(2); }

    console.log('Audit passed: socialBreakdown components sum equals reported totals for sample case.');
    process.exit(0);
  } catch (err) {
    console.error('Audit test error:', err);
    process.exit(2);
  }
}

runTest();
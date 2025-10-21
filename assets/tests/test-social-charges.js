// Simple node test runner for social-charges module
// Run: node assets/tests/test-social-charges.js
const path = require('path');
const Social = require('../modules/social-charges.js');
const cfg = require('../config/social-params-2025.json');

function approxEqual(a,b,tol=1) {
  return Math.abs(a-b) <= tol;
}

function run(){
  console.log('Running social-charges smoke tests (2025 defaults)...');
  const amounts = { salary: 50000, business: 0, pension: 0, wealthIncome: 10000, lijfrente: 0 };
  const frEmp = Social.calcEmployeeSocial('FR', amounts, cfg);
  console.log('FR employee total:', frEmp.total, 'breakdown:', frEmp.breakdown);
  if (!approxEqual(frEmp.total, (50000*cfg.FR.SOCIALE_LASTEN.SALARIS) + (10000*cfg.FR.SOCIALE_LASTEN.PFU))) {
    console.error('FR employee calc deviates from expected');
    process.exit(2);
  }
  const nlEmp = Social.calcEmployeeSocial('NL', amounts, cfg);
  console.log('NL employee total:', nlEmp.total, 'breakdown:', nlEmp.breakdown);
  const beEmp = Social.calcEmployeeSocial('BE', amounts, cfg);
  console.log('BE employee total:', beEmp.total, 'breakdown:', beEmp.breakdown);
  console.log('All checks passed (basic).');
}
run();
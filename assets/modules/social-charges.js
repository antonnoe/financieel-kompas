// Lightweight social-charges module
// Usage:
//   const cfg = require('../config/social-params-2025.json');
//   const { calcEmployeeSocial, calcEmployerSocial } = SocialCharges(cfg);
//   const emp = calcEmployeeSocial('FR', { salary: 50000, business:0, pension:0 }, '2025');
(function(root, factory){
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SocialCharges = factory();
})(this, function(){
  function normalizeConfig(cfg){
    // basic fallback structure
    cfg = cfg || {};
    return cfg;
  }

  // calcEmployeeSocial(country, amounts, config, options)
  // amounts: { salary, business, pension, wealthIncome, lijfrente }
  // returns: { employee: number, employer: number (if computed), total: number, breakdown: {...} }
  function calcEmployeeSocial(country, amounts, config){
    config = normalizeConfig(config);
    const c = config[country] || {};
    const s = amounts || {};
    const breakdown = {};
    let employee = 0;
    // Salary contributions (percentage on gross salary)
    const salaryP = (c.SOCIALE_LASTEN && c.SOCIALE_LASTEN.SALARIS) || 0;
    const salaire = s.salary || 0;
    const salaryContrib = salaire * salaryP;
    breakdown.salary = salaryContrib;
    employee += salaryContrib;

    // Pension / lijfrente contributions (e.g. fraction on taxable part)
    const lijfrenteRate = (c.SOCIALE_LASTEN && c.SOCIALE_LASTEN.LIJFRENTE_TARIEF) || 0;
    const lijfrenteBase = s.lijfrente || 0;
    const lijfrenteContrib = lijfrenteBase * lijfrenteRate;
    breakdown.lijfrente = lijfrenteContrib;
    employee += lijfrenteContrib;

    // For entrepreneurs: apply winst percentages if present
    const winstDienstP = (c.SOCIALE_LASTEN && c.SOCIALE_LASTEN.WINST_DIENSTEN) || 0;
    const winstVerhuurP = (c.SOCIALE_LASTEN && c.SOCIALE_LASTEN.WINST_VERHUUR) || 0;
    const business = s.business || 0;
    // naive split: treat all business as dienst for now (integration can pass type)
    const businessContrib = business * winstDienstP;
    breakdown.business = businessContrib;
    employee += businessContrib;

    // PFU/wealth contributions (if specified)
    const pfuP = (c.SOCIALE_LASTEN && c.SOCIALE_LASTEN.PFU) || 0;
    const wealth = s.wealthIncome || 0;
    const wealthContrib = wealth * pfuP;
    breakdown.wealth = wealthContrib;
    employee += wealthContrib;

    return { employee: round(employee), employer: 0, total: round(employee), breakdown };
  }

  // calcEmployerSocial(country, amounts, config)
  // Very simple: applies configured employer percentages on salary
  function calcEmployerSocial(country, amounts, config){
    config = normalizeConfig(config);
    const c = config[country] || {};
    const s = amounts || {};
    const salaire = s.salary || 0;
    const empRate = (c.SOCIALE_LASTEN && c.SOCIALE_LASTEN.EMPLOYER_SALARY_PERCENTAGE) || 0;
    const employer = salaire * empRate;
    return { employer: round(employer), breakdown: { employer } };
  }

  function round(v){ return Math.round((v + Number.EPSILON) * 100) / 100; }

  return {
    calcEmployeeSocial,
    calcEmployerSocial
  };
});
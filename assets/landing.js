// Landing-step wiring (assets/landing.js)
(function(){
  function populateLandingYears() {
    const start = new Date().getFullYear();
    const by = document.getElementById('landing-birthyear');
    const ey = document.getElementById('landing-emig-year');
    if(!by||!ey) return;
    for(let y = start; y >= 1900; y--) { const o=document.createElement('option'); o.value=y; o.textContent=y; by.appendChild(o); }
    for(let y = start; y <= start+5; y++) { const o=document.createElement('option'); o.value=y; o.textContent=y; ey.appendChild(o); }
  }

  function applyLandingAnswersToForm() {
    const country = document.querySelector('.landing-country.selected')?.dataset.country || document.getElementById('landing-country-nl')?.dataset.country;
    const household = document.getElementById('landing-household')?.value;
    const by = document.getElementById('landing-birthyear')?.value;
    const bm = document.getElementById('landing-birthmonth')?.value;
    const ey = document.getElementById('landing-emig-year')?.value;
    const em = document.getElementById('landing-emig-month')?.value;

    if(country && typeof updateComparisonCountry === 'function') updateComparisonCountry(country);
    if(household) { if(typeof updateHouseholdType === 'function') updateHouseholdType(household === 'couple'); }

    if(by && document.getElementById('birth-year-1')) document.getElementById('birth-year-1').value = by;
    if(bm && document.getElementById('birth-month-1')) document.getElementById('birth-month-1').value = bm;
    if(ey && document.getElementById('sim-year')) document.getElementById('sim-year').value = ey;
    if(em && document.getElementById('sim-month')) document.getElementById('sim-month').value = em;
  }

  function setupLandingHandlers() {
    const cnl = document.getElementById('landing-country-nl'), cbe = document.getElementById('landing-country-be');
    [cnl,cbe].forEach(btn => { if(!btn) return; btn.addEventListener('click', e => { document.querySelectorAll('.landing-country').forEach(b=>b.classList.remove('selected')); btn.classList.add('selected'); }); });
    document.getElementById('landing-submit')?.addEventListener('click', () => {
      const country = document.querySelector('.landing-country.selected')?.dataset.country;
      const household = document.getElementById('landing-household')?.value;
      const by = document.getElementById('landing-birthyear')?.value;
      const bm = document.getElementById('landing-birthmonth')?.value;
      const ey = document.getElementById('landing-emig-year')?.value;
      const em = document.getElementById('landing-emig-month')?.value;
      const err = document.getElementById('landing-error');
      if(!country || !household || !by || !bm || !ey || !em) {
        if(err) { err.style.display='block'; err.textContent='Vul alle velden in (land, huishouden, geboortejaar/maand en emigratiedatum).'; }
        return;
      }
      if(err) { err.style.display='none'; err.textContent=''; }
      applyLandingAnswersToForm();
      const landing = document.getElementById('landing-step'); if(landing) landing.style.display='none';
      const mainForm = document.getElementById('main-form'); if(mainForm) mainForm.style.display='block';
      if(typeof updateScenario === 'function') updateScenario();
    });
  }

  // Initialize when DOM ready
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { populateLandingYears(); setupLandingHandlers(); });
  } else {
    populateLandingYears(); setupLandingHandlers();
  }
})();
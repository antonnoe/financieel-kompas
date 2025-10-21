document.addEventListener('DOMContentLoaded', () => {
    // --- Globale variabelen ---
    let PARAMS; let isCouple = false; let initialLoad = true; let activeComparison = 'NL'; const MAX_WORK_YEARS = 50;
    let comparisonChoice, compareCountryResult, compareCountryLabel, compareCountryFlag;
    let householdType, partner2Section, inputs, outputs, valueOutputs;
    let pensionLabels;

    const getEl = (id) => document.getElementById(id);

    // --- Hulpfuncties ---
    function displayError(message) { console.error(message); const el=getEl('calculation-breakdown'); if(el) el.textContent=message; else document.body.innerHTML=`<p style="color:red;padding:20px;">${message}</p>`; }
    function checkSelectors() { if(!comparisonChoice||!householdType||!inputs||!outputs||!valueOutputs||!outputs.breakdown||!inputs.p1?.birthYear||!inputs.children||!outputs.compareBruto||!valueOutputs['compareBruto']) return displayError('Incomplete input data.'); }
    //... (rest of file unchanged from current script.js)

    // Inserted block:
    (function activateStartSheetOnLoad(){
      try {
        setTimeout(() => {
          const firstVisible = Array.from(document.querySelectorAll('input, select, textarea, button'))
            .find(el => el.offsetParent !== null);
          if (firstVisible) {
            try { firstVisible.focus(); } catch(e) {}
            try { firstVisible.scrollIntoView({behavior:'smooth', block:'center'}); } catch(e) {}
          }
          const startDetails = document.querySelector('details.module');
          if (startDetails && !startDetails.open) startDetails.open = true;
          const startBtn = document.querySelector('[data-action="start"], .start-button, #start-button, .btn-start');
          if (startBtn) try { startBtn.click(); } catch(e) {}
          console.log('Startblad auto-activeren uitgevoerd.');
        }, 250);
      } catch (err) {
        console.warn('Auto-activate startsheet failed (safe no-op):', err);
      }
    })();
});

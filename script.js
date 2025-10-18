document.addEventListener('DOMContentLoaded', () => {
    // --- Globale variabelen ---
    let PARAMS;
    let isCouple = false;
    let initialLoad = true;
    let activeComparison = 'NL';
    const MAX_WORK_YEARS = 50;
    let comparisonChoice, compareCountryResult, compareCountryLabel, compareCountryFlag;
    let householdType, partner2Section, inputs, outputs, valueOutputs;

    const getEl = (id) => document.getElementById(id);

    // --- Hulpfuncties ---
    function displayError(message) {
        console.error(message);
        const el = document.getElementById('calculation-breakdown');
        if (el) { el.textContent = message; }
        else { document.body.innerHTML = `<p style="color: red; padding: 20px;">${message}</p>`; }
    }

    function checkSelectors() {
        // Basic check for top-level objects
        if (!comparisonChoice || !householdType || !inputs || !outputs || !valueOutputs || !outputs.breakdown) {
             console.error("Een of meer hoofd-UI objecten (inputs, outputs etc.) ontbreken."); return false; }
        // Check a few critical nested elements
        if (!inputs.p1?.birthYear || !inputs.children || !outputs.compareBruto || !valueOutputs.p1?.aowYears ) {
            console.error("Een of meer kritieke UI sub-elementen (bv. birthYear, children slider) ontbreken."); return false; }
        return true;
    }

    // --- Initialisatie ---
    async function initializeApp() {
        console.log("Initializing application...");
        try { // 1. Load Config
            const response = await fetch('./config.json');
            if (!response.ok) throw new Error(`Config load failed: ${response.status}`);
            PARAMS = await response.json(); console.log("Config loaded.");
            // Fix Infinity strings
            const fixInf = (arr) => arr?.forEach(item => { if (item.grens === "Infinity") item.grens = Infinity; });
            fixInf(PARAMS?.FR?.INKOMSTENBELASTING?.SCHIJVEN); fixInf(PARAMS?.FR?.IFI?.SCHIJVEN); fixInf(PARAMS?.BE?.INKOMSTENBELASTING?.SCHIJVEN_2025);
            fixInf(PARAMS?.BE?.SOCIALE_LASTEN?.BIJZONDERE_BIJDRAGE_SCHIJVEN_GEZIN_2024); // Ook voor BSZB

        } catch (error) { displayError(`Fout laden config: ${error.message}.`); return; }

        // 2. Select DOM Elements
        console.log("Selecting DOM elements...");
        comparisonChoice = { nl: getEl('btn-nl'), be: getEl('btn-be') }; compareCountryResult = getEl('compare-country-result'); compareCountryLabel = getEl('compare-country-label'); compareCountryFlag = getEl('compare-country-flag');
        householdType = { single: getEl('btn-single'), couple: getEl('btn-couple') }; partner2Section = getEl('partner2-section');
        inputs = { children: getEl('slider-children'), cak: getEl('cak-contribution'), homeHelp: getEl('home-help'), wealthFinancial: getEl('slider-wealth-financial'), wealthProperty: getEl('slider-wealth-property'),
            p1: { birthYear: getEl('birth-year-1'), birthMonth: getEl('birth-month-1'), aowYears: getEl('aow-years-1'), frWorkYears: getEl('fr-work-years-1'), pensionPublic: getEl('slider-pension-public-1'), pensionPrivate: getEl('slider-pension-private-1'), lijfrente: getEl('slider-lijfrente-1'), lijfrenteDuration: getEl('lijfrente-duration-1'), incomeWealth: getEl('slider-income-wealth-1'), salary: getEl('slider-salary-1'), business: getEl('slider-business-1'), businessType: getEl('business-type-1') },
            p2: { birthYear: getEl('birth-year-2'), birthMonth: getEl('birth-month-2'), aowYears: getEl('aow-years-2'), frWorkYears: getEl('fr-work-years-2'), pensionPublic: getEl('slider-pension-public-2'), pensionPrivate: getEl('slider-pension-private-2'), lijfrente: getEl('slider-lijfrente-2'), lijfrenteDuration: getEl('lijfrente-duration-2'), incomeWealth: getEl('slider-income-wealth-2'), salary: getEl('slider-salary-2'), business: getEl('slider-business-2'), businessType: getEl('business-type-2') },};
        outputs = { compareBruto: getEl('compare-bruto'), compareTax: getEl('compare-tax'), compareNetto: getEl('compare-netto'), wealthTaxCompare: getEl('wealth-tax-compare'), frBruto: getEl('fr-bruto'), frTax: getEl('fr-tax'), frNetto: getEl('fr-netto'), wealthTaxFr: getEl('wealth-tax-fr'), wealthTaxFrExpl: getEl('wealth-tax-fr-expl'), conclusionBar: getEl('conclusion-bar'), conclusionValue: getEl('conclusion-value'), conclusionExpl: getEl('conclusion-expl'), estateTotalDisplay: getEl('estate-total-display'), breakdown: getEl('calculation-breakdown'),};
        valueOutputs = { p1: { aowYears: getEl('value-aow-years-1'), frWorkYears: getEl('value-fr-work-years-1'), pensionPublic: getEl('value-pension-public-1'), pensionPrivate: getEl('value-pension-private-1'), lijfrente: getEl('value-lijfrente-1'), incomeWealth: getEl('value-income-wealth-1'), salary: getEl('value-salary-1'), business: getEl('value-business-1') }, p2: { aowYears: getEl('value-aow-years-2'), frWorkYears: getEl('value-fr-work-years-2'), pensionPublic: getEl('value-pension-public-2'), pensionPrivate: getEl('value-pension-private-2'), lijfrente: getEl('value-lijfrente-2'), incomeWealth: getEl('value-income-wealth-2'), salary: getEl('value-salary-2'), business: getEl('value-business-2') }, children: getEl('value-children'), wealthFinancial: getEl('value-wealth-financial'), wealthProperty: getEl('value-wealth-property'),};

        // 3. Check Selectors
        if (!checkSelectors()) { displayError("Init mislukt: Kon UI-elementen niet vinden."); return; }
        console.log("DOM elements selected.");

        // 4. Setup
        populateDateDropdowns(); setupListeners();
        // Set initial state and trigger first calculation
        updateHouseholdType(false); // Default single
        updateComparisonCountry('NL'); // Default NL, triggers updateScenario
        console.log("Application initialized.");
    }

    // --- Core Functions ---
    const formatCurrency = (amount, withSign = false) => {
        const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
        const roundedAmount = Math.round(Math.abs(amount));
        return `${withSign ? sign + ' ' : ''}€ ${roundedAmount.toLocaleString('nl-NL')}`;
     };

     function populateDateDropdowns() {
        if (!inputs?.p1?.birthYear || !inputs?.p2?.birthYear) return;
        const currentYear = new Date().getFullYear(); const months = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
        [inputs.p1, inputs.p2].forEach(p => { if (!p || !p.birthYear || !p.birthMonth) return; const yS=p.birthYear, mS=p.birthMonth; if(yS.options.length>0) return; yS.innerHTML=''; mS.innerHTML=''; for(let y=currentYear-18; y>=1940; y--){ const o=new Option(y,y); if(y===1960)o.selected=true; yS.add(o); } months.forEach((m,i)=>mS.add(new Option(m,i+1))); });
     }

     function getAOWDateInfo(birthYear) {
        if (!birthYear || birthYear < 1940) return { years: 67, months: 0 }; if (birthYear <= 1957) return { years: 66, months: 4 }; if (birthYear === 1958) return { years: 66, months: 7 }; if (birthYear === 1959) return { years: 66, months: 10 }; return { years: 67, months: 0 };
     }

     function setupListeners() {
        if (!comparisonChoice || !householdType) return;
        if (comparisonChoice.nl) comparisonChoice.nl.addEventListener('click', () => updateComparisonCountry('NL')); if (comparisonChoice.be) comparisonChoice.be.addEventListener('click', () => updateComparisonCountry('BE'));
        if (householdType.single) householdType.single.addEventListener('click', () => updateHouseholdType(false)); if (householdType.couple) householdType.couple.addEventListener('click', () => updateHouseholdType(true));
        const rb = getEl('reset-btn'); if (rb) { rb.addEventListener('click', () => { if (!inputs?.p1?.birthYear) return; document.querySelectorAll('input[type="range"]').forEach(i => {if(i) i.value=0;}); document.querySelectorAll('input[type="checkbox"]').forEach(i => {if(i) i.checked=false;}); document.querySelectorAll('select:not([id*="birth"])').forEach(s => {if(s) s.selectedIndex=0;}); if (inputs.p1.birthYear) inputs.p1.birthYear.value = 1960; if (inputs.p2.birthYear) inputs.p2.birthYear.value = 1960; initialLoad = true; updateHouseholdType(false); updateComparisonCountry('NL'); });}
        const cb = getEl('copy-btn'); if (cb) { cb.addEventListener('click', () => { const txt = outputs?.breakdown?.textContent || ''; if (txt && !txt.includes("Welkom")) { navigator.clipboard.writeText(txt).then(() => { cb.textContent = 'Gekopieerd!'; setTimeout(() => { cb.textContent = '📋 Kopieer Analyse'; }, 2000); }).catch(err => { console.error('Kopieerfout:', err); alert('Kopiëren mislukt.'); }); } else { alert("Genereer analyse."); } });}
        const ic = getEl('input-panel'); if (ic) { ic.addEventListener('input', (e) => { if (e.target.matches('input, select')) { if (e.target.id.includes('aow-years') || e.target.id.includes('fr-work-years')) { adjustWorkYears(e.target.id); } updateScenario(); } });} else { console.error("#input-panel missing!"); }
     }

     function toggleCountrySpecificFields(countryCode) {
        document.querySelectorAll('.nl-specific').forEach(el => el.style.display = (countryCode === 'NL' ? '' : 'none')); // Use empty string to reset to default (block/flex)
        document.querySelectorAll('.be-specific').forEach(el => el.style.display = (countryCode === 'BE' ? '' : 'none'));
        document.querySelectorAll('.hide-for-be').forEach(el => el.style.display = (countryCode === 'BE' ? 'none' : '')); // Hide these FR fields when BE is active
     }

     function updateComparisonCountry(countryCode) {
         if (!comparisonChoice?.nl || !comparisonChoice?.be || !compareCountryLabel || !compareCountryFlag || !compareCountryResult) return;
        activeComparison = countryCode; comparisonChoice.nl.classList.toggle('active', activeComparison === 'NL'); comparisonChoice.be.classList.toggle('active', activeComparison === 'BE');
        if (activeComparison === 'NL') { compareCountryLabel.textContent = "Als u in Nederland woont"; compareCountryFlag.textContent = "🇳🇱"; compareCountryResult.style.borderColor = "var(--primary-color)"; }
        else if (activeComparison === 'BE') { compareCountryLabel.textContent = "Als u in België woont"; compareCountryFlag.textContent = "🇧🇪"; compareCountryResult.style.borderColor = "#FDDA25"; }
        toggleCountrySpecificFields(activeComparison);
        updateScenario(); // Always recalculate after country change
     }

     function updateHouseholdType(setToCouple) {
         if (!householdType?.single || !householdType?.couple || !partner2Section || !inputs?.p2) return;
        isCouple = setToCouple; householdType.single.classList.toggle('active', !isCouple); householdType.couple.classList.toggle('active', isCouple);
        partner2Section.style.display = isCouple ? 'flex' : 'none';
        if (!isCouple) { Object.keys(inputs.p2).forEach(key => { const el = inputs.p2[key]; if(el && (el.matches('input[type="range"]') || el.matches('input[type="checkbox"]') || el.matches('select:not([id*="birth"])'))) { if (el.type === 'range') el.value = 0; if (el.type === 'checkbox') el.checked = false; if (el.tagName === 'SELECT') el.selectedIndex = 0; } }); }
        updateScenario(); // Always recalculate after household type change
     }

     function getPartnerInput(partnerId) {
        if (!inputs || !inputs[partnerId] || !inputs[partnerId].birthYear) { console.error(`Partner data missing for ${partnerId}`); return null; }
        const p = inputs[partnerId]; const getNum = (el) => el ? Number(el.value) : 0; const getStr = (el, defaultVal) => el ? el.value : defaultVal;
        return { birthYear: getNum(p.birthYear), birthMonth: getNum(p.birthMonth), aowYears: getNum(p.aowYears), frWorkYears: getNum(p.frWorkYears), pensionPublic: getNum(p.pensionPublic), pensionPrivate: getNum(p.pensionPrivate), lijfrente: getNum(p.lijfrente), lijfrenteDuration: getNum(p.lijfrenteDuration), incomeWealth: getNum(p.incomeWealth), salary: getNum(p.salary), business: getNum(p.business), businessType: getStr(p.businessType, 'services') };
     }

     function adjustWorkYears(changedSliderId) {
         if (!inputs?.p1?.aowYears || !inputs?.p2?.aowYears) return;
         const adjust = (aowS, frS) => { if (!aowS || !frS) return; let aV=Number(aowS.value), fV=Number(frS.value); if(aV+fV>MAX_WORK_YEARS){ if(changedSliderId===aowS.id){fV=MAX_WORK_YEARS-aV;frS.value=fV;} else {aV=MAX_WORK_YEARS-fV;aowS.value=aV;} } };
         if (changedSliderId.includes('-1')) { adjust(inputs.p1.aowYears, inputs.p1.frWorkYears); } else if (changedSliderId.includes('-2') && isCouple) { adjust(inputs.p2.aowYears, inputs.p2.frWorkYears); } updateValueOutputsForYears();
     }

     function updateValueOutputsForYears() {
         if (!valueOutputs?.p1?.aowYears || !valueOutputs?.p2?.aowYears || !inputs?.p1?.aowYears || !inputs?.p2?.aowYears) return;
        if (valueOutputs.p1.aowYears && inputs.p1.aowYears) valueOutputs.p1.aowYears.textContent = inputs.p1.aowYears.value; if (valueOutputs.p1.frWorkYears && inputs.p1.frWorkYears) valueOutputs.p1.frWorkYears.textContent = inputs.p1.frWorkYears.value;
        if (isCouple && valueOutputs.p2.aowYears && inputs.p2.aowYears) valueOutputs.p2.aowYears.textContent = inputs.p2.aowYears.value; if (isCouple && valueOutputs.p2.frWorkYears && inputs.p2.frWorkYears) valueOutputs.p2.frWorkYears.textContent = inputs.p2.frWorkYears.value;
     }

     function updateScenario() {
        if (!PARAMS || !inputs || !outputs || !valueOutputs || !checkSelectors()) { console.warn("UpdateScenario called too early or selectors missing."); if (outputs?.breakdown) outputs.breakdown.textContent = "Laden..."; return; }
        try {
            const p1Input = getPartnerInput('p1'); if (!p1Input) throw new Error("P1 data invalid.");
            const p2Input = isCouple ? getPartnerInput('p2') : null; if (isCouple && !p2Input) throw new Error("P2 data invalid.");
            const inputValues = { isCouple, children: Number(inputs.children.value||0), cak: !!inputs.cak?.checked, homeHelp: Number(inputs.homeHelp.value||0), wealthFinancial: Number(inputs.wealthFinancial.value||0), wealthProperty: Number(inputs.wealthProperty.value||0), p1: p1Input, p2: p2Input };
            inputValues.estate = inputValues.wealthFinancial + inputValues.wealthProperty;

            // Update tooltips and values safely
            [ { p: p1Input, elData: inputs.p1 }, { p: p2Input, elData: inputs.p2 } ].forEach(item => { if (item.p && item.elData && item.elData.aowYears) { const max=50; item.elData.aowYears.max=max; const cur=Number(item.elData.aowYears.value||0); item.p.aowYears = Math.min(cur, max); if(cur>max) item.elData.aowYears.value=max; const tt = item.elData.aowYears.closest('.form-group')?.querySelector('.tooltip'); if(tt) tt.dataset.text = `Jaren AOW (max ${max}). NL+FR max 50.`; } });
            Object.keys(valueOutputs.p1 || {}).forEach(k => { if(valueOutputs.p1[k] && p1Input && p1Input[k]!==undefined) valueOutputs.p1[k].textContent = ['aowYears','frWorkYears'].includes(k) ? p1Input[k] : formatCurrency(p1Input[k]); });
            if(isCouple && p2Input) { Object.keys(valueOutputs.p2 || {}).forEach(k => { if(valueOutputs.p2[k] && p2Input[k]!==undefined) valueOutputs.p2[k].textContent = ['aowYears','frWorkYears'].includes(k) ? p2Input[k] : formatCurrency(p2Input[k]); }); }
            if (valueOutputs.children) valueOutputs.children.textContent = inputValues.children; if (valueOutputs.wealthFinancial) valueOutputs.wealthFinancial.textContent = formatCurrency(inputValues.wealthFinancial); if (valueOutputs.wealthProperty) valueOutputs.wealthProperty.textContent = formatCurrency(inputValues.wealthProperty); if (outputs.estateTotalDisplay) outputs.estateTotalDisplay.textContent = formatCurrency(inputValues.estate);

            // Calculations
            let compareResults = { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} };
            if (activeComparison === 'NL') { compareResults = calculateNetherlands(inputValues); }
            else if (activeComparison === 'BE') { compareResults = calculateBelgium(inputValues); }
            const frResults = calculateFrance(inputValues);

            // Update UI
            if (outputs.compareBruto) outputs.compareBruto.textContent = formatCurrency(compareResults.bruto); if (outputs.compareTax) outputs.compareTax.textContent = formatCurrency(compareResults.tax); if (outputs.compareNetto) outputs.compareNetto.textContent = formatCurrency(compareResults.netto); if (outputs.wealthTaxCompare) outputs.wealthTaxCompare.textContent = formatCurrency(compareResults.wealthTax);
            if (outputs.frBruto) outputs.frBruto.textContent = formatCurrency(frResults.bruto); if (outputs.frTax) outputs.frTax.textContent = formatCurrency(frResults.tax); if (outputs.frNetto) outputs.frNetto.textContent = formatCurrency(frResults.netto); if (outputs.wealthTaxFr) outputs.wealthTaxFr.textContent = formatCurrency(frResults.wealthTax); if (outputs.wealthTaxFrExpl) outputs.wealthTaxFrExpl.textContent = (frResults.wealthTax === 0 && inputValues.estate > 50000) ? "(Vastgoed < €1.3M)" : "";
            const frN = frResults.netto || 0, compN = compareResults.netto || 0, frW = frResults.wealthTax || 0, compW = compareResults.wealthTax || 0;
            const totalAdvantage = (frN - compN) + (compW - frW);
            if (outputs.conclusionValue) outputs.conclusionValue.textContent = formatCurrency(totalAdvantage, true); if (outputs.conclusionBar) outputs.conclusionBar.className = totalAdvantage >= 0 ? 'positive' : 'negative'; if (outputs.conclusionExpl) outputs.conclusionExpl.textContent = totalAdvantage >= 0 ? "Positief: voordeel in Frankrijk." : "Negatief: voordeel in vergeleken land.";
            if (outputs.breakdown) { if (initialLoad) { outputs.breakdown.innerHTML = `<p style="text-align: center;">Welkom! 🧭 Vul data in.</p>`; initialLoad = false; } else { outputs.breakdown.textContent = generateBreakdown(inputValues, compareResults, frResults); } }

        } catch (error) { console.error("Fout in updateScenario:", error); displayError(`Fout berekening: ${error.message}.`); }
     }

    // ===========================================
    // ===== HIER BEGINNEN DE REKENFUNCTIES =====
    // ===========================================

    // --- NEDERLAND ---
    function calculateNetherlands(vals) { /* ... (identiek aan vorige versie) ... */
        if (!PARAMS.NL) return { bruto: 0, tax: 0, netto: 0, wealthTax: 0 }; let cB=0, cT=0, cN=0; const P = [vals.p1, vals.p2].filter(p=>p);
        P.forEach(p=>{ const aDI=getAOWDateInfo(p.birthYear); const aM=new Date((p.birthYear||1900)+aDI.years, (p.birthMonth||1)-1+aDI.months); const iP=new Date()>aM; const cA=new Date().getFullYear()-(p.birthYear||1900); const lDN=p.lijfrenteDuration?Number(p.lijfrenteDuration):999; const lIA=cA<lDN;
            const cP=iP?(p.pensionPublic||0)+(p.pensionPrivate||0)+(lIA?(p.lijfrente||0):0):0; const cAOW=iP?(Number(p.aowYears||0)/50)*(vals.isCouple?PARAMS.AOW_BRUTO_COUPLE:PARAMS.AOW_BRUTO_SINGLE):0; const r=calculateNLNetto(cAOW+cP,p.salary||0,p.business||0,iP); cB+=r.bruto;cT+=r.tax;cN+=r.netto;});
        const v=vals.isCouple?PARAMS.NL.BOX3.VRIJSTELLING_COUPLE:PARAMS.NL.BOX3.VRIJSTELLING_SINGLE; const wT=Math.max(0,(vals.wealthFinancial||0)-v)*PARAMS.NL.BOX3.FORFAITAIR_RENDEMENT*PARAMS.NL.BOX3.TARIEF; return {bruto:cB, tax:cT, netto:cN, wealthTax:wT, breakdown: {}}; // Added empty breakdown
    }
     function calculateNLNetto(pI, s, b, iA) { /* ... (identiek aan vorige versie) ... */
        if (!PARAMS.NL) return { bruto: 0, tax: 0, netto: 0 }; const wNV=b*(1-PARAMS.NL.BOX1.MKB_WINSTVRIJSTELLING); const zB=b>0?wNV:0; const z=zB*PARAMS.NL.SOCIALE_LASTEN.ZVW_PERCENTAGE; const br=pI+s+wNV; if(br<=0&&z<=0)return{bruto:0,tax:0,netto:0}; if(br<=0&&z>0)return{bruto:0,tax:z,netto:-z}; let t=0; const T=iA?PARAMS.NL.BOX1.TARIEVEN_BOVEN_AOW:PARAMS.NL.BOX1.TARIEVEN_ONDER_AOW; const gS1=PARAMS.NL.BOX1.GRENS_SCHIJF_1; if(br<=gS1){t=br*T[0];}else{t=(gS1*T[0])+((br-gS1)*T[1]);} let aK=(s>0||b>0?PARAMS.NL.BOX1.ARBEIDSKORTING_MAX:0); let alK=PARAMS.NL.BOX1.ALGEMENE_HEFFINGSKORTING_MAX; const hAS=PARAMS.NL.BOX1.HK_AFBOUW_START; if(br>hAS){alK=Math.max(0,PARAMS.NL.BOX1.ALGEMENE_HEFFINGSKORTING_MAX-((br-hAS)*PARAMS.NL.BOX1.HK_AFBOUW_FACTOR));} if(br>=gS1){alK=0;} const akAS=39957; if(br>akAS){aK=Math.max(0,PARAMS.NL.BOX1.ARBEIDSKORTING_MAX-((br-akAS)*0.0651));} t=t-alK-aK; t=Math.max(0,t); const tT=t+z; return {bruto:br, tax:tT, netto:br-tT};
    }

    // --- FRANKRIJK ---
    function calculateFrance(vals) { /* ... (identiek aan vorige versie) ... */
        if (!PARAMS.FR || !PARAMS.NL) return { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} }; let bINLB=0, tA=0, tPP=0, tL=0, tLo=0, tW=0, iPH=false; let tBFA={services:0, rental:0}; let tEY=0; const P=[vals.p1, vals.p2].filter(p=>p);
        P.forEach(p=>{ const aDI=getAOWDateInfo(p.birthYear); const aM=new Date((p.birthYear||1900)+aDI.years,(p.birthMonth||1)-1+aDI.months); const iP=new Date()>aM; if(iP)iPH=true; const cA=new Date().getFullYear()-(p.birthYear||1900); const lDN=p.lijfrenteDuration?Number(p.lijfrenteDuration):999; const lIA=cA<lDN; tEY+=Number(p.aowYears||0)+Number(p.frWorkYears||0); bINLB+=iP?(p.pensionPublic||0):0; tA+=iP?(Number(p.aowYears||0)/50)*(vals.isCouple?PARAMS.AOW_BRUTO_COUPLE:PARAMS.AOW_BRUTO_SINGLE):0; tPP+=iP?(p.pensionPrivate||0):0; tL+=iP&&lIA?(p.lijfrente||0):0; tLo+=p.salary||0; tW+=p.business||0; tBFA[p.businessType||'services']+=(p.business||0);});
        const fPR=tEY>=PARAMS.FR_PENSION_YEARS_REQUIRED?PARAMS.FR_PENSION_RATE:PARAMS.FR_PENSION_RATE*(tEY/(PARAMS.FR_PENSION_YEARS_REQUIRED||1)); const tFWY=(vals.p1?.frWorkYears||0)+(vals.p2?.frWorkYears||0); const fSP=(PARAMS.FR_PENSION_YEARS_REQUIRED||1)>0?(tFWY/(PARAMS.FR_PENSION_YEARS_REQUIRED||1))*PARAMS.FR_PENSION_AVG_SALARY*fPR:0; const fSPA=iPH?fSP:0;
        const tIV=(vals.p1?.incomeWealth||0)+(vals.p2?.incomeWealth||0); const pT=tIV*PARAMS.FR.INKOMSTENBELASTING.PFU_TARIEF; const pSL=tIV*PARAMS.FR.SOCIALE_LASTEN.PFU; const nlTR=PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0]||0.1907; const nINL=bINLB*(1-nlTR); const tPIF=tA+tPP+tL+fSPA; const sLP=tPIF*PARAMS.FR.SOCIALE_LASTEN.PENSIOEN; const sLS=tLo*PARAMS.FR.SOCIALE_LASTEN.SALARIS; const sLW=(tBFA.services*PARAMS.FR.SOCIALE_LASTEN.WINST_DIENSTEN)+(tBFA.rental*PARAMS.FR.SOCIALE_LASTEN.WINST_VERHUUR); const tSL=sLP+sLS+sLW; const wNA=(tBFA.services*(1-PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_WINST_DIENSTEN))+(tBFA.rental*(1-PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_WINST_VERHUUR)); let bI=(tPIF+tLo+wNA)-sLP-sLS; const aC=vals.cak?PARAMS.FR.CAK_BIJDRAGE_GEMIDDELD:0; bI-=aC; let a65=0;
        if(iPH){ const aP=P.filter(p=>{const aI=getAOWDateInfo(p.birthYear);const aMo=new Date((p.birthYear||1900)+aI.years,(p.birthMonth||1)-1+aI.months);return new Date()>aMo;}).length; const iBFA=tPIF; const d1=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.DREMPEL1; const d2=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.DREMPEL2; const af1=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.AFTREK1; const af2=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.AFTREK2; if(iBFA<=d1*aP){a65=af1*aP;}else if(iBFA<=d2*aP){a65=af2*aP;}} bI-=a65;
        const parts=(vals.isCouple?2:1)+(vals.children>2?(vals.children-2)*1+1:(vals.children||0)*0.5); const iPP=parts>0?Math.max(0,bI)/parts:0;
        let bPP=0,vG=0; PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN.forEach(s=>{const cG=s.grens===Infinity?Infinity:Number(s.grens); bPP+=Math.max(0,Math.min(iPP,cG)-vG)*s.tarief; vG=cG;});
        let tax = bPP * parts;
        const bP = vals.isCouple ? 2 : 1; const cP = parts - bP; let tWC = 0;
        if (cP > 0 && bP > 0) { const iPB = Math.max(0, bI) / bP; vG = 0; PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN.forEach(s=>{const cG=s.grens===Infinity?Infinity:Number(s.grens); tWC+=Math.max(0,Math.min(iPB,cG)-vG)*s.tarief; vG=cG;}); tWC*=bP; const mV=cP*2*PARAMS.FR.INKOMSTENBELASTING.QUOTIENT_PLAFOND_PER_HALF_PART; const cA=tWC-tax; if (cA > mV) { tax = tWC - mV; } }
        const bK=(vals.homeHelp||0)*PARAMS.FR.HULP_AAN_HUIS_KREDIET_PERCENTAGE; tax=tax-bK;
        const bIF=tPIF+tLo+tW+tIV; const br=bIF+bINLB; const tIF=tSL+pSL+pT+Math.max(0,tax);
        const nt=(bIF-(tSL+pSL+pT))+nINL-Math.max(0,tax)+(tax<0?Math.abs(tax):0); let wT=0; const wPN=vals.wealthProperty||0;
        if(wPN>PARAMS.FR.IFI.DREMPEL_START){let tA=wPN;wT=0;let pL=800000;for(const s of PARAMS.FR.IFI.SCHIJVEN){const cG=s.grens===Infinity?Infinity:Number(s.grens);if(tA<=pL)break; const aIS=Math.max(0,Math.min(tA,cG)-pL); wT+=aIS*s.tarief; pL=cG; if(tA<=cG)break;}}
        return {bruto:br,tax:tIF,netto:nt,wealthTax:wT, breakdown:{socialeLasten:tSL+pSL,aftrekCak:aC,belastingKrediet:bK,tax:Math.max(0,tax)+pT,calculatedTaxIB:tax,parts:parts,nettoInkomenUitNL:nINL,brutoInFR:bIF,brutoInkomenVoorNLBelasting:bINLB,frStatePension:fSPA}};
    }

    // --- BELGIË ---
    function calculateBelgium(vals) {
        if (!PARAMS.BE || !PARAMS.NL) return { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} };
        let tB=0, tBI_voor_kosten=0, tSL=0, tIV=0, tRV=0, nPNLB=0, nPBEB=0;
        const P=[vals.p1, vals.p2].filter(p=>p); const PB=PARAMS.BE;

        P.forEach(p=>{
            const s=p.salary||0, b=p.business||0; const pP=p.pensionPublic||0, pPr=p.pensionPrivate||0;
            const l=p.lijfrente||0, iW=p.incomeWealth||0; const aY=p.aowYears||0;

            const rW=s*PB.SOCIALE_LASTEN.WERKNEMER_RSZ_PERCENTAGE; const nettoLoonVoorKosten=s-rW; tSL+=rW; tBI_voor_kosten+=nettoLoonVoorKosten; tB+=s;
            let rZ=0; if(b>0){let iR=b,vG=0; PB.SOCIALE_LASTEN.ZELFSTANDIGE_SCHIJVEN.forEach(sch=>{const cG=Number(sch.grens);let bIS=Math.max(0,Math.min(iR,cG-vG));rZ+=bIS*sch.tarief;iR-=bIS;vG=cG;});} const nettoWinstVoorKosten=b-rZ; tSL+=rZ; tBI_voor_kosten+=nettoWinstVoorKosten; tB+=b;
            const aDI=getAOWDateInfo(p.birthYear); const aM=new Date((p.birthYear||1900)+aDI.years,(p.birthMonth||1)-1+aDI.months); const iP=new Date()>aM; const cA=new Date().getFullYear()-(p.birthYear||1900); const lDN=p.lijfrenteDuration?Number(p.lijfrenteDuration):999; const lIA=cA<lDN;
            const cAOW=iP?(aY/50)*(vals.isCouple?PARAMS.AOW_BRUTO_COUPLE:PARAMS.AOW_BRUTO_SINGLE):0; const cABP=iP?pP:0; const cP=iP?pPr:0; const cL=(iP&&lIA)?l:0;
            if(cABP>0){nPNLB+=cABP;} const tOP=cAOW+cP+cL; if(tOP>PB.INKOMSTENBELASTING.PENSIOEN_NL_DREMPEL_VOOR_BELASTING_IN_NL){nPNLB+=tOP;}else{nPBEB+=tOP;}
            tIV+=iW;
        });

        const nlTR=PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0]||0.1907; const nINL=nPNLB*(1-nlTR);
        tB+=nPNLB+nPBEB+tIV; // Bruto inclusief pensioen en vermogeninkomsten

        // Vereenvoudigde Forfaitaire Beroepskosten (3% op eerste schijf, max ~€3000 - aanpassen indien nodig)
        const forfaitKosten = Math.min(tBI_voor_kosten * 0.03, 3000) * (isCouple ? 2 : 1); // Ruwe schatting, per persoon
        const tBI_na_kosten = Math.max(0, tBI_voor_kosten - forfaitKosten);

        // Voeg BE belast pensioen toe NA kostenberekening
        const totaalBelastbaarInkomen = tBI_na_kosten + nPBEB;

        // Roerende Voorheffing (RV)
        const spaarRenteDeel = tIV / 2, overigRenteDividendDeel = tIV / 2;
        const vrijstellingSpaarPP = PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_VRIJSTELLING_SPAAR_PP;
        const vrijstellingSpaarTotaal = vrijstellingSpaarPP * (vals.isCouple ? 2 : 1);
        const belasteSpaarRente = Math.max(0, spaarRenteDeel - vrijstellingSpaarTotaal);
        const rvSpaar = belasteSpaarRente * PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_TARIEF_SPAAR;

        // Dividenddeel (50% van overig) apart voor vrijstelling
        const dividendDeelOverig = overigRenteDividendDeel / 2;
        const renteDeelOverig = overigRenteDividendDeel / 2;
        const vrijstellingDividendPP = PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_VRIJSTELLING_DIVIDEND_PP;
        const vrijstellingDividendTotaal = vrijstellingDividendPP * (vals.isCouple ? 2 : 1);
        // Teruggave via PB benaderen door vrijstelling vooraf toe te passen
        const belastbaarDividend = Math.max(0, dividendDeelOverig - vrijstellingDividendTotaal);
        const rvOverig = (belastbaarDividend + renteDeelOverig) * PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_TARIEF_ALGEMEEN;
        tRV = rvSpaar + rvOverig;

        // Federale Belasting
        let fB=0, iRF=totaalBelastbaarInkomen, vGF=0; PB.INKOMSTENBELASTING.SCHIJVEN_2025.forEach(sch=>{const g=sch.grens;let bIS=Math.max(0,Math.min(iRF,g-vGF));fB+=bIS*sch.tarief;iRF-=bIS;vGF=g;});
        let tV=PB.INKOMSTENBELASTING.BASIS_VRIJSTELLING*(vals.isCouple?2:1); const nC=vals.children||0;
        if(nC>0){const kA=PB.INKOMSTENBELASTING.VRIJSTELLING_PER_KIND; const extraKind=PB.INKOMSTENBELASTING.EXTRA_VRIJSTELLING_KIND_MEER_DAN_3; if(nC===1)tV+=kA[0]; else if(nC===2)tV+=kA[1]; else if(nC===3)tV+=kA[2]; else if(nC>3){tV+=kA[2]+(nC-3)*extraKind;}}
        const lT=PB.INKOMSTENBELASTING.SCHIJVEN_2025[0].tarief; const bK=Math.min(totaalBelastbaarInkomen,tV)*lT; fB=Math.max(0,fB-bK);
        const gB=fB*PB.INKOMSTENBELASTING.GEMEENTEBELASTING_GEMIDDELD;

        // Bijzondere Sociale Zekerheidsbijdrage (BSZB) - Vereenvoudigd o.b.v. totaal belastbaar inkomen gezin
        let bszb = 0;
        const bszbSchijven = PB.SOCIALE_LASTEN.BIJZONDERE_BIJDRAGE_SCHIJVEN_GEZIN_2024;
        for (const schijf of bszbSchijven) {
            if (totaalBelastbaarInkomen < schijf.grens) {
                bszb = schijf.bijdrage;
                break;
            }
        }
        // Max bijdrage is al de laatste schijfwaarde

        const totaleTax = tSL + fB + gB + tRV + bszb; // BSZB toegevoegd
        const nt = tB - totaleTax + nINL; const wT = 0;
        return { bruto:tB, tax:totaleTax, netto:nt, wealthTax:wT, breakdown:{nettoInkomenUitNL:nINL, socialeLasten:tSL, bszb: bszb, federaleBelasting:fB, gemeentebelasting:gB, roerendeVoorheffing:tRV }};
    }

    // --- BREAKDOWN ---
    function generateBreakdown(vals, compare, fr) {
        if (!vals || !compare || !fr || !compare.breakdown || !fr.breakdown) { return "Fout: Analyse data incompleet."; }
        const wf=vals.wealthFinancial||0, wp=vals.wealthProperty||0; const est=wf+wp;
        const getRetirementProjection = (p, partnerIndex) => { /* ... (identiek) ... */ if(!p)return'';const aDI=getAOWDateInfo(p.birthYear);const aM=new Date((p.birthYear||1900)+aDI.years,(p.birthMonth||1)-1+aDI.months);const pL=vals.isCouple?`(P${partnerIndex+1})`:'';if(new Date()<aM){const n=new Date();let yD=aM.getFullYear()-n.getFullYear();let mD=aM.getMonth()-n.getMonth();if(mD<0){yD--;mD+=12;}return `\n    ↳ Pensioen${pL} over ${yD}j,${mD}m`;}return `\n    ↳ Pensioen${pL} loopt`; };
        const projP1 = getRetirementProjection(vals.p1, 0); const projP2 = vals.p2 ? getRetirementProjection(vals.p2, 1) : '';
        let compTitle = "...", compContent = "...";

        if (activeComparison === 'NL') {
            const vS=PARAMS.NL?.BOX3?.VRIJSTELLING_SINGLE||0, vC=PARAMS.NL?.BOX3?.VRIJSTELLING_COUPLE||0;
            compTitle = "Nederland 🇳🇱";
            compContent = `Bruto: ${formatCurrency(compare.bruto)} | Lasten: ${formatCurrency(compare.tax)} (IB+Zvw) | Netto: ${formatCurrency(compare.netto)}
Vermogen (Box 3): Fin: ${formatCurrency(wf)} / Vrijst: ${formatCurrency(vals.isCouple?vC:vS)} | Aanslag: ${formatCurrency(compare.wealthTax)}`;
        } else if (activeComparison === 'BE') {
            const nlTR=PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0]||0.1907; const div=(1-nlTR);
            const bNP=div!==0?(compare.breakdown.nettoInkomenUitNL||0)/div:0;
            compTitle = "België 🇧🇪";
            compContent = `Bruto: ${formatCurrency(compare.bruto)} (NL pensioen bruto: ${formatCurrency(bNP)}) | Netto: ${formatCurrency(compare.netto)}
Lasten Totaal: ${formatCurrency(compare.tax)}
  ↳ RSZ/INASTI: -${formatCurrency(compare.breakdown.socialeLasten||0)}
  ↳ Bijz. Soc. Bijdrage: -${formatCurrency(compare.breakdown.bszb||0)}
  ↳ Roer. Voorh.: -${formatCurrency(compare.breakdown.roerendeVoorheffing||0)} (30%/15% na vrijst.)
  ↳ Fed. PB: ${formatCurrency(compare.breakdown.federaleBelasting||0)} + Gem. Belast. (~7.2%): ${formatCurrency(compare.breakdown.gemeentebelasting||0)}
Vermogen: Aanslag: ${formatCurrency(compare.wealthTax)} (Geen alg. vermogensbelasting)`; // Breakdown aangepast
        }
        // **HIER DE FIX: formatCurrency gebruiken**
        return `
Analyse ${activeComparison}-FR | ${vals.isCouple ? 'Partners' : 'Alleenst.'}, Kind: ${vals.children||0} | Verm: ${formatCurrency(est)} (${formatCurrency(wf)} fin / ${formatCurrency(wp)} vast) ${projP1}${projP2}
------------------------------------------
${compTitle}
${compContent}
------------------------------------------
Frankrijk 🇫🇷
Bruto: ${formatCurrency(fr.bruto)} (NL pens: ${formatCurrency(fr.breakdown.brutoInkomenVoorNLBelasting||0)}, FR pens: ${formatCurrency(fr.breakdown.frStatePension||0)}) | Netto: ${formatCurrency(fr.netto)}
Lasten: ${formatCurrency(fr.tax)} (Soc: -${formatCurrency(fr.breakdown.socialeLasten||0)} | CAK: -${formatCurrency(fr.breakdown.aftrekCak||0)} | IB: ${formatCurrency(fr.breakdown.tax||0)} [Credit: +${formatCurrency(fr.breakdown.belastingKrediet||0)}, Parts: ${fr.breakdown.parts||0}])
IFI: Vastgoed: ${formatCurrency(wp)} | Aanslag: ${formatCurrency(fr.wealthTax)} (> €1.3M)
        `;
    }

    // --- Start Applicatie ---
    initializeApp();

}); // Einde DOMContentLoaded listener

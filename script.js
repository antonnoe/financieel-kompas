document.addEventListener('DOMContentLoaded', () => {
    // Globale variabelen bovenaan
    let PARAMS;
    let isCouple = false;
    let initialLoad = true;
    let activeComparison = 'NL';
    const MAX_WORK_YEARS = 50;

    // DOM Element Selectors - Worden pas gevuld in initializeApp
    let comparisonChoice, compareCountryResult, compareCountryLabel, compareCountryFlag;
    let householdType, partner2Section, inputs, outputs, valueOutputs;

    const getEl = (id) => document.getElementById(id); // Hulpfunctie

    // --- Hulpfuncties ---
    function displayError(message) {
        console.error(message);
        const breakdownElement = document.getElementById('calculation-breakdown');
        if (breakdownElement) {
            breakdownElement.textContent = message;
        } else {
            document.body.innerHTML = `<p style="color: red; padding: 20px;">${message}</p>`;
        }
    }

    function checkSelectors() {
        if (!comparisonChoice || !compareCountryResult || !compareCountryLabel || !compareCountryFlag ||
            !householdType || !partner2Section || !inputs || !outputs || !valueOutputs ||
            !inputs.children || !inputs.p1 || !inputs.p2 || !outputs.breakdown || !valueOutputs.p1 || !valueOutputs.p2 ||
            !inputs.p1.birthYear || !outputs.compareBruto || !valueOutputs.p1.aowYears) {
             console.error("Een of meer essentiële UI-elementen konden niet worden gevonden tijdens initialisatie.");
            return false;
        }
        // Extra check for deeper elements might be redundant now, but keep for safety
         if (!inputs.p1.birthYear || !outputs.compareBruto || !valueOutputs.p1.aowYears) {
              console.error("Een of meer diepere UI-elementen konden niet worden gevonden.");
              return false;
         }
        return true;
    }

    // --- Kern Initialisatie Functie ---
    async function initializeApp() {
        console.log("Attempting to initialize application...");
        try { // 1. Laad Config
            const response = await fetch('./config.json');
            if (!response.ok) { throw new Error(`Kon config.json niet laden. Status: ${response.status}.`); }
            PARAMS = await response.json(); console.log("Config loaded successfully.");
             if (PARAMS?.FR?.INKOMSTENBELASTING?.SCHIJVEN?.[4]) PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN[4].grens = Infinity;
             if (PARAMS?.FR?.IFI?.SCHIJVEN?.[5]) PARAMS.FR.IFI.SCHIJVEN[5].grens = Infinity;
             if (PARAMS?.BE?.INKOMSTENBELASTING?.SCHIJVEN_2025?.[3]) PARAMS.BE.INKOMSTENBELASTING.SCHIJVEN_2025[3].grens = Infinity;
        } catch (error) { displayError(`Fout bij laden config: ${error.message}.`); return; }

        // 2. Selecteer DOM Elementen
        console.log("Selecting DOM elements...");
        comparisonChoice = { nl: getEl('btn-nl'), be: getEl('btn-be') }; compareCountryResult = getEl('compare-country-result'); compareCountryLabel = getEl('compare-country-label'); compareCountryFlag = getEl('compare-country-flag');
        householdType = { single: getEl('btn-single'), couple: getEl('btn-couple') }; partner2Section = getEl('partner2-section');
        inputs = { children: getEl('slider-children'), cak: getEl('cak-contribution'), homeHelp: getEl('home-help'), wealthFinancial: getEl('slider-wealth-financial'), wealthProperty: getEl('slider-wealth-property'),
            p1: { birthYear: getEl('birth-year-1'), birthMonth: getEl('birth-month-1'), aowYears: getEl('aow-years-1'), frWorkYears: getEl('fr-work-years-1'), pensionPublic: getEl('slider-pension-public-1'), pensionPrivate: getEl('slider-pension-private-1'), lijfrente: getEl('slider-lijfrente-1'), lijfrenteDuration: getEl('lijfrente-duration-1'), incomeWealth: getEl('slider-income-wealth-1'), salary: getEl('slider-salary-1'), business: getEl('slider-business-1'), businessType: getEl('business-type-1') },
            p2: { birthYear: getEl('birth-year-2'), birthMonth: getEl('birth-month-2'), aowYears: getEl('aow-years-2'), frWorkYears: getEl('fr-work-years-2'), pensionPublic: getEl('slider-pension-public-2'), pensionPrivate: getEl('slider-pension-private-2'), lijfrente: getEl('slider-lijfrente-2'), lijfrenteDuration: getEl('lijfrente-duration-2'), incomeWealth: getEl('slider-income-wealth-2'), salary: getEl('slider-salary-2'), business: getEl('slider-business-2'), businessType: getEl('business-type-2') },};
        outputs = { compareBruto: getEl('compare-bruto'), compareTax: getEl('compare-tax'), compareNetto: getEl('compare-netto'), wealthTaxCompare: getEl('wealth-tax-compare'), frBruto: getEl('fr-bruto'), frTax: getEl('fr-tax'), frNetto: getEl('fr-netto'), wealthTaxFr: getEl('wealth-tax-fr'), wealthTaxFrExpl: getEl('wealth-tax-fr-expl'), conclusionBar: getEl('conclusion-bar'), conclusionValue: getEl('conclusion-value'), conclusionExpl: getEl('conclusion-expl'), estateTotalDisplay: getEl('estate-total-display'), breakdown: getEl('calculation-breakdown'),};
        valueOutputs = { p1: { aowYears: getEl('value-aow-years-1'), frWorkYears: getEl('value-fr-work-years-1'), pensionPublic: getEl('value-pension-public-1'), pensionPrivate: getEl('value-pension-private-1'), lijfrente: getEl('value-lijfrente-1'), incomeWealth: getEl('value-income-wealth-1'), salary: getEl('value-salary-1'), business: getEl('value-business-1') }, p2: { aowYears: getEl('value-aow-years-2'), frWorkYears: getEl('value-fr-work-years-2'), pensionPublic: getEl('value-pension-public-2'), pensionPrivate: getEl('value-pension-private-2'), lijfrente: getEl('value-lijfrente-2'), incomeWealth: getEl('value-income-wealth-2'), salary: getEl('value-salary-2'), business: getEl('value-business-2') }, children: getEl('value-children'), wealthFinancial: getEl('value-wealth-financial'), wealthProperty: getEl('value-wealth-property'),};

        // 3. Controleer Selectors
        if (!checkSelectors()) { displayError("Init mislukt: Kon UI-elementen niet vinden."); return; }
        console.log("DOM elements selected successfully.");

        // 4. Setup
        populateDateDropdowns(); setupListeners(); updateHouseholdType(false); updateComparisonCountry('NL');
        console.log("Application initialized successfully.");
    }

    // --- Functies ---
     const formatCurrency = (amount, withSign = false) => {
        const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
        const roundedAmount = Math.round(Math.abs(amount));
        return `${withSign ? sign + ' ' : ''}€ ${roundedAmount.toLocaleString('nl-NL')}`;
     };
     function populateDateDropdowns() {
        if (!inputs?.p1?.birthYear || !inputs?.p2?.birthYear) return;
        const currentYear = new Date().getFullYear(); const months = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
        [inputs.p1, inputs.p2].forEach(p => { if (!p || !p.birthYear || !p.birthMonth) return; const yearSelect = p.birthYear, monthSelect = p.birthMonth; if (yearSelect.options.length > 0) return;
            yearSelect.innerHTML = ''; monthSelect.innerHTML = ''; for (let year = currentYear - 18; year >= 1940; year--) { const option = new Option(year, year); if (year === 1960) option.selected = true; yearSelect.add(option); }
            months.forEach((month, index) => monthSelect.add(new Option(month, index + 1))); });
     }
     function getAOWDateInfo(birthYear) {
        if (!birthYear || birthYear < 1940) return { years: 67, months: 0 }; if (birthYear <= 1957) return { years: 66, months: 4 }; if (birthYear === 1958) return { years: 66, months: 7 }; if (birthYear === 1959) return { years: 66, months: 10 }; return { years: 67, months: 0 };
     }
     function setupListeners() {
        if (!comparisonChoice || !householdType) return;
        if (comparisonChoice.nl) comparisonChoice.nl.addEventListener('click', () => updateComparisonCountry('NL')); if (comparisonChoice.be) comparisonChoice.be.addEventListener('click', () => updateComparisonCountry('BE'));
        if (householdType.single) householdType.single.addEventListener('click', () => updateHouseholdType(false)); if (householdType.couple) householdType.couple.addEventListener('click', () => updateHouseholdType(true));
        const resetButton = getEl('reset-btn'); if (resetButton) { resetButton.addEventListener('click', () => { if (!inputs?.p1?.birthYear) return; console.log("Reset."); document.querySelectorAll('input[type="range"]').forEach(i => {if(i) i.value=0;}); document.querySelectorAll('input[type="checkbox"]').forEach(i => {if(i) i.checked=false;}); document.querySelectorAll('select:not([id*="birth"])').forEach(s => {if(s) s.selectedIndex=0;}); if (inputs.p1.birthYear) inputs.p1.birthYear.value = 1960; if (inputs.p2.birthYear) inputs.p2.birthYear.value = 1960; initialLoad = true; updateHouseholdType(false); updateComparisonCountry('NL'); });}
        const copyButton = getEl('copy-btn'); if (copyButton) { copyButton.addEventListener('click', () => { const txt = outputs?.breakdown?.textContent || ''; if (txt && !txt.includes("Welkom")) { navigator.clipboard.writeText(txt).then(() => { copyButton.textContent = 'Gekopieerd!'; setTimeout(() => { copyButton.textContent = '📋 Kopieer Analyse'; }, 2000); }).catch(err => { console.error('Kopieerfout:', err); alert('Kopiëren mislukt.'); }); } else { alert("Genereer eerst analyse."); } });}
        const inputContainer = getEl('input-panel'); if (inputContainer) { inputContainer.addEventListener('input', (e) => { if (e.target.matches('input, select')) { if (e.target.id.includes('aow-years') || e.target.id.includes('fr-work-years')) { adjustWorkYears(e.target.id); } updateScenario(); } });} else { console.error("#input-panel not found!"); }
     }
     function toggleCountrySpecificFields(countryCode) {
        console.log(`Toggling fields for: ${countryCode}`);
        document.querySelectorAll('.nl-specific').forEach(el => el.style.display = (countryCode === 'NL' ? 'block' : 'none'));
        document.querySelectorAll('.be-specific').forEach(el => el.style.display = (countryCode === 'BE' ? 'block' : 'none'));
        document.querySelectorAll('.hide-for-be').forEach(el => el.style.display = (countryCode === 'BE' ? 'none' : 'block'));
     }
     function updateComparisonCountry(countryCode) {
         if (!comparisonChoice?.nl || !comparisonChoice?.be || !compareCountryLabel || !compareCountryFlag || !compareCountryResult) return;
        activeComparison = countryCode; comparisonChoice.nl.classList.toggle('active', activeComparison === 'NL'); comparisonChoice.be.classList.toggle('active', activeComparison === 'BE');
        if (activeComparison === 'NL') { compareCountryLabel.textContent = "Als u in Nederland woont"; compareCountryFlag.textContent = "🇳🇱"; compareCountryResult.style.borderColor = "var(--primary-color)"; }
        else if (activeComparison === 'BE') { compareCountryLabel.textContent = "Als u in België woont"; compareCountryFlag.textContent = "🇧🇪"; compareCountryResult.style.borderColor = "#FDDA25"; }
        toggleCountrySpecificFields(activeComparison);
        if (typeof updateScenario === 'function') updateScenario(); else console.error("updateScenario not found");
     }
     function updateHouseholdType(setToCouple) {
         if (!householdType?.single || !householdType?.couple || !partner2Section || !inputs?.p2) return;
        isCouple = setToCouple; householdType.single.classList.toggle('active', !isCouple); householdType.couple.classList.toggle('active', isCouple);
        partner2Section.style.display = isCouple ? 'flex' : 'none';
        if (!isCouple) { Object.keys(inputs.p2).forEach(key => { const el = inputs.p2[key]; if(el && (el.matches('input[type="range"]') || el.matches('input[type="checkbox"]') || el.matches('select:not([id*="birth"])'))) { if (el.type === 'range') el.value = 0; if (el.type === 'checkbox') el.checked = false; if (el.tagName === 'SELECT') el.selectedIndex = 0; } }); }
        if (typeof updateScenario === 'function') updateScenario(); else console.error("updateScenario not found");
     }
     function getPartnerInput(partnerId) {
        if (!inputs || !inputs[partnerId]) { return null; } const p = inputs[partnerId]; const getNum = (el) => el ? Number(el.value) : 0; const getStr = (el, defaultVal) => el ? el.value : defaultVal; if (!p.birthYear) { return null; }
        return { birthYear: getNum(p.birthYear), birthMonth: getNum(p.birthMonth), aowYears: getNum(p.aowYears), frWorkYears: getNum(p.frWorkYears), pensionPublic: getNum(p.pensionPublic), pensionPrivate: getNum(p.pensionPrivate), lijfrente: getNum(p.lijfrente), lijfrenteDuration: getNum(p.lijfrenteDuration), incomeWealth: getNum(p.incomeWealth), salary: getNum(p.salary), business: getNum(p.business), businessType: getStr(p.businessType, 'services') };
     }
     function adjustWorkYears(changedSliderId) {
         if (!inputs?.p1?.aowYears || !inputs?.p2?.aowYears) return;
         const adjust = (aowSlider, frSlider) => { if (!aowSlider || !frSlider) return; let aowVal = Number(aowSlider.value), frVal = Number(frSlider.value); if (aowVal + frVal > MAX_WORK_YEARS) { if (changedSliderId === aowSlider.id) { frVal = MAX_WORK_YEARS - aowVal; frSlider.value = frVal; } else { aowVal = MAX_WORK_YEARS - frVal; aowSlider.value = aowVal; } } };
         if (changedSliderId.includes('-1')) { adjust(inputs.p1.aowYears, inputs.p1.frWorkYears); } else if (changedSliderId.includes('-2') && isCouple) { adjust(inputs.p2.aowYears, inputs.p2.frWorkYears); } updateValueOutputsForYears();
     }
     function updateValueOutputsForYears() {
         if (!valueOutputs?.p1?.aowYears || !valueOutputs?.p2?.aowYears || !inputs?.p1?.aowYears || !inputs?.p2?.aowYears) return;
        if (valueOutputs.p1.aowYears && inputs.p1.aowYears) valueOutputs.p1.aowYears.textContent = inputs.p1.aowYears.value; if (valueOutputs.p1.frWorkYears && inputs.p1.frWorkYears) valueOutputs.p1.frWorkYears.textContent = inputs.p1.frWorkYears.value;
        if (isCouple && valueOutputs.p2.aowYears && inputs.p2.aowYears) valueOutputs.p2.aowYears.textContent = inputs.p2.aowYears.value; if (isCouple && valueOutputs.p2.frWorkYears && inputs.p2.frWorkYears) valueOutputs.p2.frWorkYears.textContent = inputs.p2.frWorkYears.value;
     }
     function updateScenario() {
        if (!PARAMS || !inputs || !outputs || !valueOutputs) { console.warn("UpdateScenario called before initialization completed."); if (outputs?.breakdown) outputs.breakdown.textContent = "Laden..."; return; }
        try {
            const p1Input = getPartnerInput('p1'); if (!p1Input) throw new Error("Partner 1 data incompleet.");
            const p2Input = isCouple ? getPartnerInput('p2') : null; if (isCouple && !p2Input) throw new Error("Partner 2 data incompleet.");
            const childrenValue = inputs.children ? Number(inputs.children.value) : 0; const cakChecked = inputs.cak ? inputs.cak.checked : false; const homeHelpValue = inputs.homeHelp ? Number(inputs.homeHelp.value) : 0;
            const wealthFinancialValue = inputs.wealthFinancial ? Number(inputs.wealthFinancial.value) : 0; const wealthPropertyValue = inputs.wealthProperty ? Number(inputs.wealthProperty.value) : 0;
            const inputValues = { isCouple, children: childrenValue, cak: cakChecked, homeHelp: homeHelpValue, wealthFinancial: wealthFinancialValue, wealthProperty: wealthPropertyValue, p1: p1Input, p2: p2Input };
            inputValues.estate = inputValues.wealthFinancial + inputValues.wealthProperty;
            [ { p: p1Input, elData: inputs.p1 }, { p: p2Input, elData: inputs.p2 } ].forEach(item => { if (item.p && item.elData && item.elData.aowYears) { const max = 50; item.elData.aowYears.max = max; const cur = Number(item.elData.aowYears.value || 0); if (cur > max) { item.elData.aowYears.value = max; item.p.aowYears = max; } else { item.p.aowYears = cur; } const tt = item.elData.aowYears.closest('.form-group')?.querySelector('.tooltip'); if(tt) tt.dataset.text = `Jaren AOW (max ${max}). NL+FR max 50.`; } });
            Object.keys(valueOutputs.p1 || {}).forEach(k => { if(valueOutputs.p1[k] && p1Input && p1Input[k]!==undefined) { valueOutputs.p1[k].textContent = ['aowYears','frWorkYears'].includes(k) ? p1Input[k] : formatCurrency(p1Input[k]); } });
            if(isCouple && p2Input) { Object.keys(valueOutputs.p2 || {}).forEach(k => { if(valueOutputs.p2[k] && p2Input[k]!==undefined) { valueOutputs.p2[k].textContent = ['aowYears','frWorkYears'].includes(k) ? p2Input[k] : formatCurrency(p2Input[k]); } }); }
            if (valueOutputs.children) valueOutputs.children.textContent = inputValues.children; if (valueOutputs.wealthFinancial) valueOutputs.wealthFinancial.textContent = formatCurrency(inputValues.wealthFinancial); if (valueOutputs.wealthProperty) valueOutputs.wealthProperty.textContent = formatCurrency(inputValues.wealthProperty); if (outputs.estateTotalDisplay) outputs.estateTotalDisplay.textContent = formatCurrency(inputValues.estate);
            let compareResults = { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} };
            if (activeComparison === 'NL') { compareResults = calculateNetherlands(inputValues); } else if (activeComparison === 'BE') { compareResults = calculateBelgium(inputValues); }
            const frResults = calculateFrance(inputValues);
            if (outputs.compareBruto) outputs.compareBruto.textContent = formatCurrency(compareResults.bruto); if (outputs.compareTax) outputs.compareTax.textContent = formatCurrency(compareResults.tax); if (outputs.compareNetto) outputs.compareNetto.textContent = formatCurrency(compareResults.netto); if (outputs.wealthTaxCompare) outputs.wealthTaxCompare.textContent = formatCurrency(compareResults.wealthTax);
            if (outputs.frBruto) outputs.frBruto.textContent = formatCurrency(frResults.bruto); if (outputs.frTax) outputs.frTax.textContent = formatCurrency(frResults.tax); if (outputs.frNetto) outputs.frNetto.textContent = formatCurrency(frResults.netto); if (outputs.wealthTaxFr) outputs.wealthTaxFr.textContent = formatCurrency(frResults.wealthTax); if (outputs.wealthTaxFrExpl) outputs.wealthTaxFrExpl.textContent = (frResults.wealthTax === 0 && inputValues.estate > 50000) ? "(Vastgoed < €1.3M)" : "";
            const frN = typeof frResults.netto === 'number' ? frResults.netto : 0; const compN = typeof compareResults.netto === 'number' ? compareResults.netto : 0; const frW = typeof frResults.wealthTax === 'number' ? frResults.wealthTax : 0; const compW = typeof compareResults.wealthTax === 'number' ? compareResults.wealthTax : 0;
            const totalAdvantage = (frN - compN) + (compW - frW);
            if (outputs.conclusionValue) outputs.conclusionValue.textContent = formatCurrency(totalAdvantage, true); if (outputs.conclusionBar) outputs.conclusionBar.className = totalAdvantage >= 0 ? 'positive' : 'negative'; if (outputs.conclusionExpl) outputs.conclusionExpl.textContent = totalAdvantage >= 0 ? "Positief: voordeel in Frankrijk." : "Negatief: voordeel in vergeleken land.";
            if (outputs.breakdown) { if (initialLoad) { outputs.breakdown.innerHTML = `<p style="text-align: center;">Welkom! 🧭 Vul data in.</p>`; initialLoad = false; } else { outputs.breakdown.textContent = generateBreakdown(inputValues, compareResults, frResults); } }
            else { console.error("Breakdown element missing!"); }
        } catch (error) { console.error("Fout in updateScenario:", error); displayError(`Fout berekening: ${error.message}.`); }
     }

    // ===========================================
    // ===== HIER BEGINNEN DE REKENFUNCTIES =====
    // ===========================================

    // --- NEDERLAND ---
    function calculateNetherlands(vals) {
        if (!PARAMS.NL) { console.error("NL Params missing"); return { bruto: 0, tax: 0, netto: 0, wealthTax: 0 }; }
        let currentBruto = 0, currentTax = 0, currentNetto = 0;
        const partners = [vals.p1, vals.p2].filter(p => p);

        partners.forEach(p => {
            const aowDateInfo = getAOWDateInfo(p.birthYear);
            // Default month to 1 if missing
            const aowMoment = new Date(p.birthYear + aowDateInfo.years, (p.birthMonth || 1) - 1 + aowDateInfo.months);
            const isPensioner = new Date() > aowMoment;
            // Default birthYear to current year if missing to avoid NaN
            const currentAge = new Date().getFullYear() - (p.birthYear || new Date().getFullYear());
            const lijfrenteDurationNum = p.lijfrenteDuration ? Number(p.lijfrenteDuration) : 999;
            const lijfrenteIsActive = currentAge < lijfrenteDurationNum;

            // Use || 0 to provide default 0 if properties are missing/null/undefined
            const currentPension = isPensioner ? (p.pensionPublic || 0) + (p.pensionPrivate || 0) + (lijfrenteIsActive ? (p.lijfrente || 0) : 0) : 0;
            const currentAOW = isPensioner ? (Number(p.aowYears || 0) / 50) * (vals.isCouple ? PARAMS.AOW_BRUTO_COUPLE : PARAMS.AOW_BRUTO_SINGLE) : 0;

            const res = calculateNLNetto(currentAOW + currentPension, p.salary || 0, p.business || 0, isPensioner);
            currentBruto += res.bruto;
            currentTax += res.tax;
            currentNetto += res.netto;
        });

        const vrijstelling = vals.isCouple ? PARAMS.NL.BOX3.VRIJSTELLING_COUPLE : PARAMS.NL.BOX3.VRIJSTELLING_SINGLE;
        const wealthTax = Math.max(0, (vals.wealthFinancial || 0) - vrijstelling) * PARAMS.NL.BOX3.FORFAITAIR_RENDEMENT * PARAMS.NL.BOX3.TARIEF;

        return { bruto: currentBruto, tax: currentTax, netto: currentNetto, wealthTax };
    }

    function calculateNLNetto(pensionIncome, salary, business, isAOW) {
        if (!PARAMS.NL) return { bruto: 0, tax: 0, netto: 0 };

        const winstNaVrijstelling = business * (1 - PARAMS.NL.BOX1.MKB_WINSTVRIJSTELLING);
        const zvwBasis = business > 0 ? winstNaVrijstelling : 0;
        const zvw = zvwBasis * PARAMS.NL.SOCIALE_LASTEN.ZVW_PERCENTAGE;

        const bruto = pensionIncome + salary + winstNaVrijstelling;
        if (bruto <= 0 && zvw <= 0) return { bruto: 0, tax: 0, netto: 0 };
        if (bruto <= 0 && zvw > 0) return { bruto: 0, tax: zvw, netto: -zvw };

        let tax = 0;
        const tarieven = isAOW ? PARAMS.NL.BOX1.TARIEVEN_BOVEN_AOW : PARAMS.NL.BOX1.TARIEVEN_ONDER_AOW;
        const grensSchijf1 = PARAMS.NL.BOX1.GRENS_SCHIJF_1;

        if (bruto <= grensSchijf1) {
            tax = bruto * tarieven[0];
        } else {
            tax = (grensSchijf1 * tarieven[0]) + ((bruto - grensSchijf1) * tarieven[1]);
        }

        let arbeidskorting = (salary > 0 || business > 0 ? PARAMS.NL.BOX1.ARBEIDSKORTING_MAX : 0);
        let algemeneKorting = PARAMS.NL.BOX1.ALGEMENE_HEFFINGSKORTING_MAX;

        const hkAfbouwStart = PARAMS.NL.BOX1.HK_AFBOUW_START;
        if (bruto > hkAfbouwStart) {
            algemeneKorting = Math.max(0, PARAMS.NL.BOX1.ALGEMENE_HEFFINGSKORTING_MAX - ((bruto - hkAfbouwStart) * PARAMS.NL.BOX1.HK_AFBOUW_FACTOR));
        }
        if (bruto >= grensSchijf1) { algemeneKorting = 0; }

        const akAfbouwStart = 39957;
        if (bruto > akAfbouwStart) {
            arbeidskorting = Math.max(0, PARAMS.NL.BOX1.ARBEIDSKORTING_MAX - ((bruto - akAfbouwStart) * 0.0651));
        }

        tax = tax - algemeneKorting - arbeidskorting;
        tax = Math.max(0, tax);
        const totalTax = tax + zvw;
        return { bruto, tax: totalTax, netto: bruto - totalTax };
    }

    // --- FRANKRIJK ---
    function calculateFrance(vals) {
        if (!PARAMS.FR || !PARAMS.NL) { console.error("FR/NL Params missing"); return { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} }; }
        let brutoInkomenVoorNLBelasting = 0, totaalAOW = 0, totaalParticulierPensioen = 0, totaalLijfrente = 0, totaalLoon = 0, totaalWinst = 0, isPensionerHousehold = false;
        let totalBusinessForAbattement = { services: 0, rental: 0 }; let totalEUYears = 0;
        const partners = [vals.p1, vals.p2].filter(p => p);

        partners.forEach(p => {
            const aowDateInfo = getAOWDateInfo(p.birthYear); const aowMoment = new Date(p.birthYear + aowDateInfo.years,(p.birthMonth || 1)-1+aowDateInfo.months);
            const isPensioner = new Date() > aowMoment; if(isPensioner) isPensionerHousehold = true;
            const currentAge = new Date().getFullYear()-(p.birthYear||new Date().getFullYear()); const lijfrenteDurationNum = p.lijfrenteDuration?Number(p.lijfrenteDuration):999;
            const lijfrenteIsActive = currentAge < lijfrenteDurationNum; totalEUYears += Number(p.aowYears||0)+Number(p.frWorkYears||0);
            brutoInkomenVoorNLBelasting += isPensioner?(p.pensionPublic||0):0; totaalAOW += isPensioner?(Number(p.aowYears||0)/50)*(vals.isCouple?PARAMS.AOW_BRUTO_COUPLE:PARAMS.AOW_BRUTO_SINGLE):0;
            totaalParticulierPensioen += isPensioner?(p.pensionPrivate||0):0; totaalLijfrente += isPensioner&&lijfrenteIsActive?(p.lijfrente||0):0;
            totaalLoon += p.salary||0; totaalWinst += p.business||0; totalBusinessForAbattement[p.businessType||'services']+=(p.business||0);});

        const frPensionRate = totalEUYears >= PARAMS.FR_PENSION_YEARS_REQUIRED ? PARAMS.FR_PENSION_RATE : PARAMS.FR_PENSION_RATE * (totalEUYears / (PARAMS.FR_PENSION_YEARS_REQUIRED || 1)); // Avoid division by zero
        const totalFrWorkYears = (vals.p1?.frWorkYears || 0) + (vals.p2?.frWorkYears || 0);
        const frStatePension = (PARAMS.FR_PENSION_YEARS_REQUIRED || 1) > 0 ? (totalFrWorkYears / (PARAMS.FR_PENSION_YEARS_REQUIRED || 1)) * PARAMS.FR_PENSION_AVG_SALARY * frPensionRate : 0;
        const frStatePensionActive = isPensionerHousehold ? frStatePension : 0;

        const totaalInkomenVermogen = (vals.p1?.incomeWealth || 0) + (vals.p2?.incomeWealth || 0);
        const pfuTax = totaalInkomenVermogen * PARAMS.FR.INKOMSTENBELASTING.PFU_TARIEF; const pfuSocialeLasten = totaalInkomenVermogen * PARAMS.FR.SOCIALE_LASTEN.PFU;
        const nlTaxRate = PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0] || 0.1907;
        const nettoInkomenUitNL = brutoInkomenVoorNLBelasting * (1 - nlTaxRate);
        const totaalPensioenInFR = totaalAOW + totaalParticulierPensioen + totaalLijfrente + frStatePensionActive;
        const socialeLastenPensioen = totaalPensioenInFR * PARAMS.FR.SOCIALE_LASTEN.PENSIOEN; const socialeLastenSalaris = totaalLoon * PARAMS.FR.SOCIALE_LASTEN.SALARIS;
        const socialeLastenWinst = (totalBusinessForAbattement.services * PARAMS.FR.SOCIALE_LASTEN.WINST_DIENSTEN) + (totalBusinessForAbattement.rental * PARAMS.FR.SOCIALE_LASTEN.WINST_VERHUUR);
        const totaleSocialeLasten = socialeLastenPensioen + socialeLastenSalaris + socialeLastenWinst;
        const winstNaAbattement = (totalBusinessForAbattement.services * (1 - PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_WINST_DIENSTEN)) + (totalBusinessForAbattement.rental * (1 - PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_WINST_VERHUUR));
        let belastbaarInkomen = (totaalPensioenInFR + totaalLoon + winstNaAbattement) - socialeLastenPensioen - socialeLastenSalaris;
        const aftrekCak = vals.cak ? PARAMS.FR.CAK_BIJDRAGE_GEMIDDELD : 0; belastbaarInkomen -= aftrekCak;
        let abattement65plus = 0;
        if(isPensionerHousehold){ const aantalPensioners = partners.filter(p=>{const aI=getAOWDateInfo(p.birthYear);const aMo=new Date(p.birthYear+aI.years,(p.birthMonth||1)-1+aI.months);return new Date()>aMo;}).length; const iBFA=totaalPensioenInFR; const d1=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.DREMPEL1; const d2=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.DREMPEL2; const af1=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.AFTREK1; const af2=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.AFTREK2; if(iBFA<=d1*aantalPensioners){a65=af1*aantalPensioners;}else if(iBFA<=d2*aantalPensioners){a65=af2*aantalPensioners;}} belastbaarInkomen-=a65;
        const parts=(vals.isCouple?2:1)+(vals.children>2?(vals.children-2)*1+1:(vals.children||0)*0.5); const inkomenPerPart=parts>0?Math.max(0,belastbaarInkomen)/parts:0;
        let belastingPerPart=0,vorigeGrens=0; PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN.forEach(s=>{const cG=s.grens===Infinity?Infinity:Number(s.grens); belastingPerPart+=Math.max(0,Math.min(inkomenPerPart,cG)-vorigeGrens)*s.tarief; vorigeGrens=cG;});
        let tax = belastingPerPart * parts;
        const baseParts = vals.isCouple ? 2 : 1; const childParts = parts - baseParts; let taxWithoutChildren = 0;
        if (childParts > 0 && baseParts > 0) { const inkomenPerBasePart = Math.max(0, belastbaarInkomen) / baseParts; vorigeGrens = 0; PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN.forEach(s=>{const cG=s.grens===Infinity?Infinity:Number(s.grens); taxWithoutChildren+=Math.max(0,Math.min(inkomenPerBasePart,cG)-vorigeGrens)*s.tarief; vorigeGrens=cG;}); taxWithoutChildren*=baseParts; const maxVoordeel = childParts * 2 * PARAMS.FR.INKOMSTENBELASTING.QUOTIENT_PLAFOND_PER_HALF_PART; const currentAdvantage = taxWithoutChildren - tax; if (currentAdvantage > maxVoordeel) { tax = taxWithoutChildren - maxVoordeel; } }
        const belastingKrediet = (vals.homeHelp || 0) * PARAMS.FR.HULP_AAN_HUIS_KREDIET_PERCENTAGE; tax = tax - belastingKrediet;
        const brutoInFR = totaalPensioenInFR + totaalLoon + totaalWinst + totaalInkomenVermogen; const bruto = brutoInFR + brutoInkomenVoorNLBelasting;
        const taxInFr = totaleSocialeLasten + pfuSocialeLasten + pfuTax + Math.max(0, tax);
        const netto = (brutoInFR - (totaleSocialeLasten + pfuSocialeLasten + pfuTax)) + nettoInkomenUitNL - Math.max(0, tax) + (tax < 0 ? Math.abs(tax) : 0);
        let wealthTax = 0; const wealthPropNum = vals.wealthProperty || 0;
        if (wealthPropNum > PARAMS.FR.IFI.DREMPEL_START) { let taxedAmount = wealthPropNum; wealthTax = 0; let prevLimit = 800000; for (const schijf of PARAMS.FR.IFI.SCHIJVEN) { const currentGrens = schijf.grens === Infinity ? Infinity : Number(schijf.grens); if (taxedAmount <= prevLimit) break; const amountInSlice = Math.max(0, Math.min(taxedAmount, currentGrens) - prevLimit); wealthTax += amountInSlice * schijf.tarief; prevLimit = currentGrens; if (taxedAmount <= currentGrens) break; } }
        return { bruto, tax: taxInFr, netto, wealthTax, breakdown: { socialeLasten: totaleSocialeLasten + pfuSocialeLasten, aftrekCak, belastingKrediet, tax: Math.max(0, tax) + pfuTax, calculatedTaxIB: tax, parts, nettoInkomenUitNL, brutoInFR, brutoInkomenVoorNLBelasting, frStatePension: frStatePensionActive } };
    }

    // --- BELGIË ---
    function calculateBelgium(vals) {
        if (!PARAMS.BE || !PARAMS.NL) return { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} };
        let tB=0, tBI=0, tSL=0, tIV=0, tRV=0, nPNLB=0, nPBEB=0; const P=[vals.p1, vals.p2].filter(p=>p); const PB=PARAMS.BE;
        P.forEach(p=>{ const s=p.salary||0, b=p.business||0; const pP=p.pensionPublic||0, pPr=p.pensionPrivate||0; const l=p.lijfrente||0, iW=p.incomeWealth||0; const aY=p.aowYears||0; const rW=s*PB.SOCIALE_LASTEN.WERKNEMER_RSZ_PERCENTAGE; const bL=s-rW; tSL+=rW; tBI+=bL; tB+=s; let rZ=0; if(b>0){let iR=b, vG=0; PB.SOCIALE_LASTEN.ZELFSTANDIGE_SCHIJVEN.forEach(sch=>{const cG=Number(sch.grens);let bIS=Math.max(0,Math.min(iR,cG-vG));rZ+=bIS*sch.tarief;iR-=bIS;vG=cG;});} const bW=b-rZ; tSL+=rZ; tBI+=bW; tB+=b; const aDI=getAOWDateInfo(p.birthYear); const aM=new Date(p.birthYear+aDI.years,(p.birthMonth||1)-1+aDI.months); const iP=new Date()>aM; const cA=new Date().getFullYear()-(p.birthYear||new Date().getFullYear()); const lDN=p.lijfrenteDuration?Number(p.lijfrenteDuration):999; const lIA=cA<lDN; const cAOW=iP?(aY/50)*(vals.isCouple?PARAMS.AOW_BRUTO_COUPLE:PARAMS.AOW_BRUTO_SINGLE):0; const cABP=iP?pP:0; const cP=iP?pPr:0; const cL=(iP&&lIA)?l:0; if(cABP>0){nPNLB+=cABP;} const tOP=cAOW+cP+cL; if(tOP>PB.INKOMSTENBELASTING.PENSIOEN_NL_DREMPEL_VOOR_BELASTING_IN_NL){nPNLB+=tOP;}else{nPBEB+=tOP;} tIV+=iW;});
        const nlTR=PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0]||0.1907; const nINL=nPNLB*(1-nlTR); tBI+=nPBEB; tB+=nPNLB+nPBEB+tIV;
        const dD=tIV/2, rD=tIV/2; const vD=PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_VRIJSTELLING_DIVIDEND; const vDT=Math.min(dD,vD*(vals.isCouple?2:1)); const bD=dD-vDT; tRV=Math.max(0,bD+rD)*PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_TARIEF; let fB=0, iRF=tBI, vGF=0; PB.INKOMSTENBELASTING.SCHIJVEN_2025.forEach(sch=>{const g=sch.grens;let bIS=Math.max(0,Math.min(iRF,g-vGF));fB+=bIS*sch.tarief;iRF-=bIS;vGF=g;});
        let tV=PB.INKOMSTENBELASTING.BASIS_VRIJSTELLING*(vals.isCouple?2:1); const nC=vals.children||0; if(nC>0){const kA=PB.INKOMSTENBELASTING.VRIJSTELLING_PER_KIND; if(nC===1)tV+=kA[0]; else if(nC===2)tV+=kA[1]; else if(nC>=3){const ePK=kA[2]-kA[1]; tV+=kA[1]+(nC-2)*ePK;}} const lT=PB.INKOMSTENBELASTING.SCHIJVEN_2025[0].tarief; const bK=Math.min(tBI,tV)*lT; fB=Math.max(0,fB-bK);
        const gB=fB*PB.INKOMSTENBELASTING.GEMEENTEBELASTING_GEMIDDELD; const tT=tSL+fB+gB+tRV; const nt=tB-tT+nINL; const wT=0;
        return { bruto:tB,tax:tT,netto:nt,wealthTax:wT, breakdown:{nettoInkomenUitNL:nINL,socialeLasten:tSL,federaleBelasting:fB,gemeentebelasting:gB,roerendeVoorheffing:tRV}};
    }

    // --- BREAKDOWN ---
    function generateBreakdown(vals, compare, fr) {
         if (!vals || !compare || !fr || !compare.breakdown || !fr.breakdown) { return "Fout: Kon analyse niet genereren."; }
         const wealthFinancial = vals.wealthFinancial || 0, wealthProperty = vals.wealthProperty || 0; const estate = wealthFinancial + wealthProperty;
         const getRetirementProjection = (p, partnerIndex) => { if (!p) return ''; const aDI=getAOWDateInfo(p.birthYear); const aM=new Date(p.birthYear+aDI.years,(p.birthMonth||1)-1+aDI.months); const pL=vals.isCouple?`(P${partnerIndex+1})`:''; if(new Date()<aM){const n=new Date();let yD=aM.getFullYear()-n.getFullYear();let mD=aM.getMonth()-n.getMonth();if(mD<0){yD--;mD+=12;}return `\n    ↳ Pensioen${pL} over ${yD}j, ${mD}m`;} return `\n    ↳ Pensioen${pL} loopt`; };
         const projectionP1 = getRetirementProjection(vals.p1, 0); const projectionP2 = vals.p2 ? getRetirementProjection(vals.p2, 1) : '';
         let compareCountryTitle = "...", compareCountryContent = "...";
         if (activeComparison === 'NL') {
            const vS = PARAMS.NL?.BOX3?.VRIJSTELLING_SINGLE || 0; const vC = PARAMS.NL?.BOX3?.VRIJSTELLING_COUPLE || 0;
            compareCountryTitle = "Nederland 🇳🇱";
            compareCountryContent = `Bruto: ${formatCurrency(compare.bruto)} | Lasten: ${formatCurrency(compare.tax)} (IB+Zvw) | Netto: ${formatCurrency(compare.netto)}
Vermogen (Box 3): Fin: ${formatCurrency(wealthFinancial)} / Vrijst: ${formatCurrency(vals.isCouple ? vC : vS)} | Aanslag: ${formatCurrency(compare.wealthTax)}`;
         } else if (activeComparison === 'BE') {
            const nlTR = PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0] || 0.1907; const div = (1 - nlTR);
            const bNP = div !== 0 ? (compare.breakdown.nettoInkomenUitNL || 0) / div : 0;
            compareCountryTitle = "België 🇧🇪";
            compareCountryContent = `Bruto: ${formatCurrency(compare.bruto)} (NL pens: ${formatCurrency(bNP)}) | Netto: ${formatCurrency(compare.netto)}
Lasten: ${formatCurrency(compare.tax)} (RSZ: -${formatCurrency(compare.breakdown.socialeLasten||0)} | RV: -${formatCurrency(compare.breakdown.roerendeVoorheffing||0)} | Fed: ${formatCurrency(compare.breakdown.federaleBelasting||0)} | Gem: +${formatCurrency(compare.breakdown.gemeentebelasting||0)})
Vermogen: Aanslag: ${formatCurrency(compare.wealthTax)} (Geen alg. verm. belasting)`;
         }
         // Correctie: formatCurrency gebruiken (was in vorige versie al gecorrigeerd)
         return `
Analyse ${activeComparison}-FR Kompas | ${vals.isCouple ? 'Partners' : 'Alleenst.'}, Kind: ${vals.children||0} | Verm: ${formatCurrency(estate)} (${formatCurrency(wealthFinancial)} fin / ${formatCurrency(wealthProperty)} vast) ${projectionP1}${projectionP2}
------------------------------------------
${compareCountryTitle}
${compareCountryContent}
------------------------------------------
Frankrijk 🇫🇷
Bruto: ${formatCurrency(fr.bruto)} (NL pens: ${formatCurrency(fr.breakdown.brutoInkomenVoorNLBelasting||0)}, FR pens: ${formatCurrency(fr.breakdown.frStatePension||0)}) | Netto: ${formatCurrency(fr.netto)}
Lasten: ${formatCurrency(fr.tax)} (Soc: -${formatCurrency(fr.breakdown.socialeLasten||0)} | CAK: -${formatCurrency(fr.breakdown.aftrekCak||0)} | IB: ${formatCurrency(fr.breakdown.tax||0)} (Credit Hulp: +${formatCurrency(fr.breakdown.belastingKrediet||0)}, Parts: ${fr.breakdown.parts||0}))
IFI: Vastgoed: ${formatCurrency(wealthProperty)} | Aanslag: ${formatCurrency(fr.wealthTax)} (> €1.3M)
        `;
    }

    // --- Start de Applicatie ---
    initializeApp();

}); // Einde DOMContentLoaded listener

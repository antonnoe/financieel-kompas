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
    function displayError(message) { /* ... (identiek aan versie 6) ... */ 
        console.error(message);
        const breakdownElement = document.getElementById('calculation-breakdown'); 
        if (breakdownElement) {
            breakdownElement.textContent = message;
        } else {
            document.body.innerHTML = `<p style="color: red; padding: 20px;">${message}</p>`;
        }
    }

    function checkSelectors() { /* ... (identiek aan versie 6) ... */ 
        if (!comparisonChoice || !compareCountryResult || !compareCountryLabel || !compareCountryFlag ||
            !householdType || !partner2Section || !inputs || !outputs || !valueOutputs ||
            !inputs.children || !inputs.p1 || !inputs.p2 || !outputs.breakdown || !valueOutputs.p1 || !valueOutputs.p2) {
             console.error("Een of meer essentiële UI-elementen konden niet worden gevonden tijdens initialisatie.");
            return false;
        }
        if (!inputs.p1.birthYear || !outputs.compareBruto || !valueOutputs.p1.aowYears) {
              console.error("Een of meer diepere UI-elementen konden niet worden gevonden.");
              return false;
         }
        return true;
    }
    
    // --- Kern Initialisatie Functie ---
    async function initializeApp() { /* ... (identiek aan versie 6) ... */ 
        console.log("Attempting to initialize application...");
        
        // 1. Laad Configuratie
        try {
            const response = await fetch('./config.json'); 
            if (!response.ok) { throw new Error(`Kon config.json niet laden. Status: ${response.status}.`); }
            PARAMS = await response.json();
            console.log("Config loaded successfully.");

             // Fix Infinity strings
             if (PARAMS?.FR?.INKOMSTENBELASTING?.SCHIJVEN?.[4]) PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN[4].grens = Infinity;
             if (PARAMS?.FR?.IFI?.SCHIJVEN?.[5]) PARAMS.FR.IFI.SCHIJVEN[5].grens = Infinity;
             if (PARAMS?.BE?.INKOMSTENBELASTING?.SCHIJVEN_2025?.[3]) PARAMS.BE.INKOMSTENBELASTING.SCHIJVEN_2025[3].grens = Infinity;

        } catch (error) {
            displayError(`Fout bij laden configuratie: ${error.message}. Applicatie kan niet starten.`);
            return; 
        }

        // 2. Selecteer DOM Elementen
        console.log("Selecting DOM elements...");
        comparisonChoice = { nl: getEl('btn-nl'), be: getEl('btn-be') };
        compareCountryResult = getEl('compare-country-result');
        compareCountryLabel = getEl('compare-country-label');
        compareCountryFlag = getEl('compare-country-flag');
        householdType = { single: getEl('btn-single'), couple: getEl('btn-couple') };
        partner2Section = getEl('partner2-section');
        inputs = {
            children: getEl('slider-children'), cak: getEl('cak-contribution'), homeHelp: getEl('home-help'),
            wealthFinancial: getEl('slider-wealth-financial'), wealthProperty: getEl('slider-wealth-property'),
            p1: { birthYear: getEl('birth-year-1'), birthMonth: getEl('birth-month-1'), aowYears: getEl('aow-years-1'), frWorkYears: getEl('fr-work-years-1'), pensionPublic: getEl('slider-pension-public-1'), pensionPrivate: getEl('slider-pension-private-1'), lijfrente: getEl('slider-lijfrente-1'), lijfrenteDuration: getEl('lijfrente-duration-1'), incomeWealth: getEl('slider-income-wealth-1'), salary: getEl('slider-salary-1'), business: getEl('slider-business-1'), businessType: getEl('business-type-1') },
            p2: { birthYear: getEl('birth-year-2'), birthMonth: getEl('birth-month-2'), aowYears: getEl('aow-years-2'), frWorkYears: getEl('fr-work-years-2'), pensionPublic: getEl('slider-pension-public-2'), pensionPrivate: getEl('slider-pension-private-2'), lijfrente: getEl('slider-lijfrente-2'), lijfrenteDuration: getEl('lijfrente-duration-2'), incomeWealth: getEl('slider-income-wealth-2'), salary: getEl('slider-salary-2'), business: getEl('slider-business-2'), businessType: getEl('business-type-2') },
        };
        outputs = {
            compareBruto: getEl('compare-bruto'), compareTax: getEl('compare-tax'), compareNetto: getEl('compare-netto'), wealthTaxCompare: getEl('wealth-tax-compare'),
            frBruto: getEl('fr-bruto'), frTax: getEl('fr-tax'), frNetto: getEl('fr-netto'), wealthTaxFr: getEl('wealth-tax-fr'), wealthTaxFrExpl: getEl('wealth-tax-fr-expl'),
            conclusionBar: getEl('conclusion-bar'), conclusionValue: getEl('conclusion-value'), conclusionExpl: getEl('conclusion-expl'),
            estateTotalDisplay: getEl('estate-total-display'), breakdown: getEl('calculation-breakdown'),
        };
        valueOutputs = {
            p1: { aowYears: getEl('value-aow-years-1'), frWorkYears: getEl('value-fr-work-years-1'), pensionPublic: getEl('value-pension-public-1'), pensionPrivate: getEl('value-pension-private-1'), lijfrente: getEl('value-lijfrente-1'), incomeWealth: getEl('value-income-wealth-1'), salary: getEl('value-salary-1'), business: getEl('value-business-1') },
            p2: { aowYears: getEl('value-aow-years-2'), frWorkYears: getEl('value-fr-work-years-2'), pensionPublic: getEl('value-pension-public-2'), pensionPrivate: getEl('value-pension-private-2'), lijfrente: getEl('value-lijfrente-2'), incomeWealth: getEl('value-income-wealth-2'), salary: getEl('value-salary-2'), business: getEl('value-business-2') },
            children: getEl('value-children'), wealthFinancial: getEl('value-wealth-financial'), wealthProperty: getEl('value-wealth-property'),
        };

        // 3. Controleer Selectors
        if (!checkSelectors()) {
             displayError("Initialisatie mislukt: Kon essentiële UI-elementen niet vinden. Controleer de HTML ID's.");
             return; 
        }
        console.log("DOM elements selected successfully.");

        // 4. Voer de rest van de setup uit
        populateDateDropdowns();
        setupListeners();
        updateHouseholdType(false); // Stelt in en triggert updateScenario via updateComparisonCountry
        updateComparisonCountry('NL'); // Stelt in en triggert updateScenario
        console.log("Application initialized successfully.");
    }
    
    // --- Alle overige functies ---
     const formatCurrency = (amount, withSign = false) => { /* ... (identiek) ... */ 
        const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
        const roundedAmount = Math.round(Math.abs(amount));
        return `${withSign ? sign + ' ' : ''}€ ${roundedAmount.toLocaleString('nl-NL')}`;
     };
     function populateDateDropdowns() { /* ... (identiek) ... */ 
        if (!inputs?.p1?.birthYear || !inputs?.p2?.birthYear) return; 
        console.log("Populating date dropdowns...");
        const currentYear = new Date().getFullYear();
        const months = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
        [inputs.p1, inputs.p2].forEach(p => {
            if (!p || !p.birthYear || !p.birthMonth) return;
            const yearSelect = p.birthYear;
            const monthSelect = p.birthMonth;
            if (yearSelect.options.length > 0) return; 
            
            yearSelect.innerHTML = ''; monthSelect.innerHTML = '';
            for (let year = currentYear - 18; year >= 1940; year--) {
                const option = new Option(year, year);
                if (year === 1960) option.selected = true;
                yearSelect.add(option);
            }
            months.forEach((month, index) => monthSelect.add(new Option(month, index + 1)));
        });
        console.log("Date dropdowns populated.");
     }
     function getAOWDateInfo(birthYear) { /* ... (identiek) ... */ 
        if (!birthYear || birthYear < 1940) return { years: 67, months: 0 };
        if (birthYear <= 1957) return { years: 66, months: 4 };
        if (birthYear === 1958) return { years: 66, months: 7 };
        if (birthYear === 1959) return { years: 66, months: 10 };
        return { years: 67, months: 0 };
     }
     function setupListeners() { /* ... (identiek) ... */ 
        if (!comparisonChoice || !householdType) return;
        console.log("Setting up listeners...");
        
        if (comparisonChoice.nl) comparisonChoice.nl.addEventListener('click', () => updateComparisonCountry('NL'));
        if (comparisonChoice.be) comparisonChoice.be.addEventListener('click', () => updateComparisonCountry('BE'));

        if (householdType.single) householdType.single.addEventListener('click', () => updateHouseholdType(false));
        if (householdType.couple) householdType.couple.addEventListener('click', () => updateHouseholdType(true));

        const resetButton = getEl('reset-btn');
        if (resetButton) {
             resetButton.addEventListener('click', () => {
                 if (!inputs?.p1?.birthYear) return; 
                console.log("Reset button clicked.");
                document.querySelectorAll('input[type="range"]').forEach(input => { if(input) input.value = 0; });
                document.querySelectorAll('input[type="checkbox"]').forEach(input => { if(input) input.checked = false; });
                document.querySelectorAll('select').forEach(select => { if(select && !select.id.includes('birth')) select.selectedIndex = 0; });
                if (inputs.p1.birthYear) inputs.p1.birthYear.value = 1960;
                if (inputs.p2.birthYear) inputs.p2.birthYear.value = 1960;
                initialLoad = true;
                updateHouseholdType(false); 
                updateComparisonCountry('NL'); 
            });
        }

        const copyButton = getEl('copy-btn');
         if (copyButton) {
             copyButton.addEventListener('click', () => {
                 const breakdownContent = outputs?.breakdown?.textContent || outputs?.breakdown?.innerText;
                 if (breakdownContent && breakdownContent.trim() !== '' && !breakdownContent.includes("Begin met het invullen")) {
                     navigator.clipboard.writeText(breakdownContent).then(() => {
                         copyButton.textContent = 'Gekopieerd!';
                         setTimeout(() => { copyButton.textContent = '📋 Kopieer Analyse'; }, 2000);
                     }).catch(err => { console.error('Kopiëren mislukt:', err); alert('Kopiëren mislukt.'); });
                 } else { alert("Genereer eerst een analyse."); }
             });
         }

        const inputContainer = getEl('input-panel');
        if (inputContainer) {
            inputContainer.addEventListener('input', (e) => {
                if (e.target.matches('input, select')) {
                    if (e.target.id.includes('aow-years') || e.target.id.includes('fr-work-years')) { adjustWorkYears(e.target.id); }
                    updateScenario(); 
                }
            });
        } else { console.error("Input container #input-panel not found!"); }
        console.log("Listeners setup complete.");
     }

    // --- NIEUWE FUNCTIE: Togglen van land-specifieke velden ---
    function toggleCountrySpecificFields(countryCode) {
        console.log(`Toggling fields for country: ${countryCode}`);
        const nlFields = document.querySelectorAll('.nl-specific');
        const beFields = document.querySelectorAll('.be-specific');
        const frFieldsForBE = document.querySelectorAll('.hide-for-be'); // FR velden die voor BE verborgen moeten worden

        if (countryCode === 'NL') {
            nlFields.forEach(el => el.style.display = 'block'); // Of 'flex' als dat nodig is voor layout
            beFields.forEach(el => el.style.display = 'none');
            frFieldsForBE.forEach(el => el.style.display = 'block'); // Zorg dat FR velden zichtbaar zijn
        } else if (countryCode === 'BE') {
            nlFields.forEach(el => el.style.display = 'none');
            beFields.forEach(el => el.style.display = 'block'); // Of 'flex'
            frFieldsForBE.forEach(el => el.style.display = 'none'); // Verberg FR specifieke velden
        }
    }

     function updateComparisonCountry(countryCode) {
         if (!comparisonChoice?.nl || !comparisonChoice?.be || !compareCountryLabel || !compareCountryFlag || !compareCountryResult) return; 
        console.log("Updating comparison country to:", countryCode);
        activeComparison = countryCode;
        comparisonChoice.nl.classList.toggle('active', activeComparison === 'NL');
        comparisonChoice.be.classList.toggle('active', activeComparison === 'BE');

        if (activeComparison === 'NL') {
            compareCountryLabel.textContent = "Als u in Nederland woont";
            compareCountryFlag.textContent = "🇳🇱";
            compareCountryResult.style.borderColor = "var(--primary-color)"; 
        } else if (activeComparison === 'BE') {
            compareCountryLabel.textContent = "Als u in België woont";
            compareCountryFlag.textContent = "🇧🇪";
            compareCountryResult.style.borderColor = "#FDDA25"; 
        }
        
        // --- NIEUW: Roep de toggle functie aan ---
        toggleCountrySpecificFields(activeComparison); 
        
        if (typeof updateScenario === 'function') updateScenario(); 
        else console.error("updateScenario function not found");
     }

     function updateHouseholdType(setToCouple) { /* ... (identiek) ... */ 
         if (!householdType?.single || !householdType?.couple || !partner2Section || !inputs?.p2) return; 
        console.log("Updating household type to:", setToCouple ? "Couple" : "Single");
        isCouple = setToCouple;
        householdType.single.classList.toggle('active', !isCouple);
        householdType.couple.classList.toggle('active', isCouple);
        partner2Section.style.display = isCouple ? 'flex' : 'none';
        
        if (!isCouple) {
            Object.keys(inputs.p2).forEach(key => {
                 const el = inputs.p2[key];
                 if(el && (el.type === 'range' || el.type === 'checkbox' || el.tagName === 'SELECT')) {
                    if (el.type === 'range') el.value = 0;
                    if (el.type === 'checkbox') el.checked = false;
                    if (el.tagName === 'SELECT' && !el.id.includes('birth')) el.selectedIndex = 0;
                 }
            });
        }
        if (typeof updateScenario === 'function') updateScenario();
        else console.error("updateScenario function not found");
     }
     function getPartnerInput(partnerId) { /* ... (identiek) ... */ 
        if (!inputs || !inputs[partnerId]) { return null; }
        const p = inputs[partnerId];
        const getNum = (el) => el ? Number(el.value) : 0;
        const getStr = (el, defaultVal) => el ? el.value : defaultVal;
        if (!p.birthYear) { return null; } 

        return {
            birthYear: getNum(p.birthYear), birthMonth: getNum(p.birthMonth), aowYears: getNum(p.aowYears), frWorkYears: getNum(p.frWorkYears),
            pensionPublic: getNum(p.pensionPublic), pensionPrivate: getNum(p.pensionPrivate),
            lijfrente: getNum(p.lijfrente), lijfrenteDuration: getNum(p.lijfrenteDuration),
            incomeWealth: getNum(p.incomeWealth),
            salary: getNum(p.salary), business: getNum(p.business), businessType: getStr(p.businessType, 'services')
        };
     }
     function adjustWorkYears(changedSliderId) { /* ... (identiek) ... */ 
         if (!inputs?.p1?.aowYears || !inputs?.p2?.aowYears) return; 
         const adjust = (aowSlider, frSlider) => {
             if (!aowSlider || !frSlider) return; 
             let aowVal = Number(aowSlider.value);
             let frVal = Number(frSlider.value);
             if (aowVal + frVal > MAX_WORK_YEARS) {
                if (changedSliderId === aowSlider.id) {
                    frVal = MAX_WORK_YEARS - aowVal; frSlider.value = frVal;
                } else { aowVal = MAX_WORK_YEARS - frVal; aowSlider.value = aowVal; }
             }
         };
         if (changedSliderId.includes('-1')) { adjust(inputs.p1.aowYears, inputs.p1.frWorkYears); } 
         else if (changedSliderId.includes('-2') && isCouple) { adjust(inputs.p2.aowYears, inputs.p2.frWorkYears); }
         updateValueOutputsForYears();
     }
     function updateValueOutputsForYears() { /* ... (identiek) ... */ 
         if (!valueOutputs?.p1?.aowYears || !valueOutputs?.p2?.aowYears || !inputs?.p1?.aowYears || !inputs?.p2?.aowYears) return; 
        if (valueOutputs.p1.aowYears && inputs.p1.aowYears) valueOutputs.p1.aowYears.textContent = inputs.p1.aowYears.value;
        if (valueOutputs.p1.frWorkYears && inputs.p1.frWorkYears) valueOutputs.p1.frWorkYears.textContent = inputs.p1.frWorkYears.value;
        if (isCouple && valueOutputs.p2.aowYears && inputs.p2.aowYears) valueOutputs.p2.aowYears.textContent = inputs.p2.aowYears.value;
        if (isCouple && valueOutputs.p2.frWorkYears && inputs.p2.frWorkYears) valueOutputs.p2.frWorkYears.textContent = inputs.p2.frWorkYears.value;
     }
     function updateScenario() { /* ... (identiek aan versie 6, behalve de kortere breakdown/conclusion teksten) ... */
        if (!PARAMS || !inputs || !outputs || !valueOutputs) {
            console.warn("UpdateScenario called before initialization completed.");
            if (outputs?.breakdown) outputs.breakdown.textContent = "Applicatie is nog aan het laden...";
            return; 
        }
        console.log("--- updateScenario Start ---");
        try {
            const p1Input = getPartnerInput('p1');
            if (!p1Input) throw new Error("Partner 1 input kon niet worden gelezen."); 
            const p2Input = isCouple ? getPartnerInput('p2') : null;
            if (isCouple && !p2Input) throw new Error("Partner 2 input kon niet worden gelezen.");
            const childrenValue = inputs.children ? Number(inputs.children.value) : 0;
            const cakChecked = inputs.cak ? inputs.cak.checked : false;
            const homeHelpValue = inputs.homeHelp ? Number(inputs.homeHelp.value) : 0;
            const wealthFinancialValue = inputs.wealthFinancial ? Number(inputs.wealthFinancial.value) : 0;
            const wealthPropertyValue = inputs.wealthProperty ? Number(inputs.wealthProperty.value) : 0;
            const inputValues = { isCouple, children: childrenValue, cak: cakChecked, homeHelp: homeHelpValue, wealthFinancial: wealthFinancialValue, wealthProperty: wealthPropertyValue, p1: p1Input, p2: p2Input };
            inputValues.estate = inputValues.wealthFinancial + inputValues.wealthProperty;
            
             [ { p: p1Input, elData: inputs.p1 }, { p: p2Input, elData: inputs.p2 } ].forEach(item => { /* ... tooltip update ... */ 
                if (item.p && item.elData && item.elData.aowYears) { 
                    const maxAOWYears = 50; item.elData.aowYears.max = maxAOWYears;
                    const currentAOWValue = Number(item.elData.aowYears.value || 0); 
                    if (currentAOWValue > maxAOWYears) { item.elData.aowYears.value = maxAOWYears; item.p.aowYears = maxAOWYears; } 
                    else { item.p.aowYears = currentAOWValue; }
                    const labelElement = item.elData.aowYears.closest('.form-group')?.querySelector('label'); 
                    const tooltipSpan = labelElement?.querySelector('.tooltip');
                    if(tooltipSpan) tooltipSpan.dataset.text = `Jaren AOW (max ${maxAOWYears}). NL+FR max 50.`; // Kortere tooltip
                }
             });

            Object.keys(valueOutputs.p1 || {}).forEach(key => { if(valueOutputs.p1[key] && p1Input && p1Input[key] !== undefined) { valueOutputs.p1[key].textContent = ['aowYears', 'frWorkYears'].includes(key) ? p1Input[key] : formatCurrency(p1Input[key]); } });
            if(isCouple && p2Input) { Object.keys(valueOutputs.p2 || {}).forEach(key => { if(valueOutputs.p2[key] && p2Input[key] !== undefined) { valueOutputs.p2[key].textContent = ['aowYears', 'frWorkYears'].includes(key) ? p2Input[key] : formatCurrency(p2Input[key]); } }); }
            if (valueOutputs.children) valueOutputs.children.textContent = inputValues.children;
            if (valueOutputs.wealthFinancial) valueOutputs.wealthFinancial.textContent = formatCurrency(inputValues.wealthFinancial);
            if (valueOutputs.wealthProperty) valueOutputs.wealthProperty.textContent = formatCurrency(inputValues.wealthProperty);
            if (outputs.estateTotalDisplay) outputs.estateTotalDisplay.textContent = formatCurrency(inputValues.estate);

            let compareResults = { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} }; 
            if (activeComparison === 'NL') { compareResults = calculateNetherlands(inputValues); } 
            else if (activeComparison === 'BE') { compareResults = calculateBelgium(inputValues); }
            const frResults = calculateFrance(inputValues);
            
            if (outputs.compareBruto) outputs.compareBruto.textContent = formatCurrency(compareResults.bruto);
            if (outputs.compareTax) outputs.compareTax.textContent = formatCurrency(compareResults.tax);
            if (outputs.compareNetto) outputs.compareNetto.textContent = formatCurrency(compareResults.netto);
            if (outputs.wealthTaxCompare) outputs.wealthTaxCompare.textContent = formatCurrency(compareResults.wealthTax);
            if (outputs.frBruto) outputs.frBruto.textContent = formatCurrency(frResults.bruto);
            if (outputs.frTax) outputs.frTax.textContent = formatCurrency(frResults.tax);
            if (outputs.frNetto) outputs.frNetto.textContent = formatCurrency(frResults.netto);
            if (outputs.wealthTaxFr) outputs.wealthTaxFr.textContent = formatCurrency(frResults.wealthTax);
            if (outputs.wealthTaxFrExpl) outputs.wealthTaxFrExpl.textContent = (frResults.wealthTax === 0 && inputValues.estate > 50000) ? "(Vastgoed < €1.3M)" : "";
            
             const frNettoNum = typeof frResults.netto === 'number' ? frResults.netto : 0;
             const compareNettoNum = typeof compareResults.netto === 'number' ? compareResults.netto : 0;
             const frWealthTaxNum = typeof frResults.wealthTax === 'number' ? frResults.wealthTax : 0;
             const compareWealthTaxNum = typeof compareResults.wealthTax === 'number' ? compareResults.wealthTax : 0;
             const totalAdvantage = (frNettoNum - compareNettoNum) + (compareWealthTaxNum - frWealthTaxNum); 

            if (outputs.conclusionValue) outputs.conclusionValue.textContent = formatCurrency(totalAdvantage, true); // Ensure sign is shown
            if (outputs.conclusionBar) outputs.conclusionBar.className = totalAdvantage >= 0 ? 'positive' : 'negative';
            if (outputs.conclusionExpl) outputs.conclusionExpl.textContent = totalAdvantage >= 0 ? "Positief: voordeel in Frankrijk." : "Negatief: voordeel in vergeleken land."; 
            
             if (outputs.breakdown) { 
                if (initialLoad) {
                    outputs.breakdown.innerHTML = `<p style="padding: 15px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Welkom! 🧭 Vul geboortedatum en inkomen in.</p>`; 
                    initialLoad = false; 
                } else {
                    outputs.breakdown.textContent = generateBreakdown(inputValues, compareResults, frResults);
                }
             } else { console.error("Breakdown element not found!"); }
             console.log("UI Update complete.");
        } catch (error) {
            console.error("Fout in updateScenario:", error);
             displayError(`Fout tijdens berekening: ${error.message}.`);
        }
         console.log("--- updateScenario End ---");
     }

    // --- Rekenfuncties (calculateNetherlands, calculateNLNetto, calculateFrance, calculateBelgium) ---
     function calculateNetherlands(vals) { /* ... (identiek) ... */ 
        if (!PARAMS.NL) { console.error("NL Params missing"); return { bruto: 0, tax: 0, netto: 0, wealthTax: 0 }; }
        let currentBruto = 0, currentTax = 0, currentNetto = 0;
        const partners = [vals.p1, vals.p2].filter(p => p);
        partners.forEach(p => {
            const aowDateInfo = getAOWDateInfo(p.birthYear);
            const aowMoment = new Date(p.birthYear + aowDateInfo.years, (p.birthMonth || 1) - 1 + aowDateInfo.months);
            const isPensioner = new Date() > aowMoment;
            const currentAge = new Date().getFullYear() - (p.birthYear || new Date().getFullYear());
            const lijfrenteDurationNum = p.lijfrenteDuration ? Number(p.lijfrenteDuration) : 999; 
            const lijfrenteIsActive = currentAge < lijfrenteDurationNum;
            const currentPension = isPensioner ? (p.pensionPublic || 0) + (p.pensionPrivate || 0) + (lijfrenteIsActive ? (p.lijfrente || 0) : 0) : 0;
            const currentAOW = isPensioner ? (Number(p.aowYears || 0) / 50) * (vals.isCouple ? PARAMS.AOW_BRUTO_COUPLE : PARAMS.AOW_BRUTO_SINGLE) : 0;
            const res = calculateNLNetto(currentAOW + currentPension, p.salary || 0, p.business || 0, isPensioner); 
            currentBruto += res.bruto; currentTax += res.tax; currentNetto += res.netto;
        });
        const vrijstelling = vals.isCouple ? PARAMS.NL.BOX3.VRIJSTELLING_COUPLE : PARAMS.NL.BOX3.VRIJSTELLING_SINGLE;
        const wealthTax = Math.max(0, (vals.wealthFinancial || 0) - vrijstelling) * PARAMS.NL.BOX3.FORFAITAIR_RENDEMENT * PARAMS.NL.BOX3.TARIEF;
        return { bruto: currentBruto, tax: currentTax, netto: currentNetto, wealthTax };
    }
     function calculateNLNetto(pensionIncome, salary, business, isAOW) { /* ... (identiek) ... */ 
         if (!PARAMS.NL) return { bruto: 0, tax: 0, netto: 0 }; 
        const winstNaVrijstelling = business * (1 - PARAMS.NL.BOX1.MKB_WINSTVRIJSTELLING);
        const zvwBasis = business > 0 ? winstNaVrijstelling : 0; const zvw = zvwBasis * PARAMS.NL.SOCIALE_LASTEN.ZVW_PERCENTAGE;
        const bruto = pensionIncome + salary + winstNaVrijstelling;
        if (bruto <= 0 && zvw <= 0) return { bruto: 0, tax: 0, netto: 0 };
        if (bruto <= 0 && zvw > 0) return { bruto: 0, tax: zvw, netto: -zvw };
        let tax = 0; const tarieven = isAOW ? PARAMS.NL.BOX1.TARIEVEN_BOVEN_AOW : PARAMS.NL.BOX1.TARIEVEN_ONDER_AOW;
        const grensSchijf1 = PARAMS.NL.BOX1.GRENS_SCHIJF_1; 
        if (bruto <= grensSchijf1) { tax = bruto * tarieven[0]; } 
        else { tax = (grensSchijf1 * tarieven[0]) + ((bruto - grensSchijf1) * tarieven[1]); }
        let arbeidskorting = (salary > 0 || business > 0 ? PARAMS.NL.BOX1.ARBEIDSKORTING_MAX : 0); 
        let algemeneKorting = PARAMS.NL.BOX1.ALGEMENE_HEFFINGSKORTING_MAX;
        const hkAfbouwStart = PARAMS.NL.BOX1.HK_AFBOUW_START;
        if (bruto > hkAfbouwStart) { algemeneKorting = Math.max(0, PARAMS.NL.BOX1.ALGEMENE_HEFFINGSKORTING_MAX - ((bruto - hkAfbouwStart) * PARAMS.NL.BOX1.HK_AFBOUW_FACTOR)); }
        if (bruto >= grensSchijf1) { algemeneKorting = 0; }
        const akAfbouwStart = 39957; 
        if (bruto > akAfbouwStart) { arbeidskorting = Math.max(0, PARAMS.NL.BOX1.ARBEIDSKORTING_MAX - ((bruto - akAfbouwStart) * 0.0651)); }
        tax = tax - algemeneKorting - arbeidskorting; tax = Math.max(0, tax); 
        const totalTax = tax + zvw; return { bruto, tax: totalTax, netto: bruto - totalTax };
    }
     function calculateFrance(vals) { /* ... (identiek) ... */ 
        if (!PARAMS.FR || !PARAMS.NL) { console.error("FR/NL Params missing"); return { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} }; }
        let brutoInkomenVoorNLBelasting = 0, totaalAOW = 0, totaalParticulierPensioen = 0, totaalLijfrente = 0, totaalLoon = 0, totaalWinst = 0, isPensionerHousehold = false;
        let totalBusinessForAbattement = { services: 0, rental: 0 }; let totalEUYears = 0;
        const partners = [vals.p1, vals.p2].filter(p => p);
        partners.forEach(p => {
            const aowDateInfo = getAOWDateInfo(p.birthYear); const aowMoment = new Date(p.birthYear + aowDateInfo.years, (p.birthMonth || 1) - 1 + aowDateInfo.months);
            const isPensioner = new Date() > aowMoment; if(isPensioner) isPensionerHousehold = true;
            const currentAge = new Date().getFullYear() - (p.birthYear || new Date().getFullYear()); const lijfrenteDurationNum = p.lijfrenteDuration ? Number(p.lijfrenteDuration) : 999;
            const lijfrenteIsActive = currentAge < lijfrenteDurationNum; totalEUYears += Number(p.aowYears || 0) + Number(p.frWorkYears || 0);
            brutoInkomenVoorNLBelasting += isPensioner ? (p.pensionPublic || 0) : 0; totaalAOW += isPensioner ? (Number(p.aowYears || 0) / 50) * (vals.isCouple ? PARAMS.AOW_BRUTO_COUPLE : PARAMS.AOW_BRUTO_SINGLE) : 0;
            totaalParticulierPensioen += isPensioner ? (p.pensionPrivate || 0) : 0; totaalLijfrente += isPensioner && lijfrenteIsActive ? (p.lijfrente || 0) : 0;
            totaalLoon += p.salary || 0; totaalWinst += p.business || 0; totalBusinessForAbattement[p.businessType || 'services'] += (p.business || 0); 
        });
        const frPensionRate = totalEUYears >= PARAMS.FR_PENSION_YEARS_REQUIRED ? PARAMS.FR_PENSION_RATE : PARAMS.FR_PENSION_RATE * (totalEUYears / PARAMS.FR_PENSION_YEARS_REQUIRED);
        const totalFrWorkYears = (vals.p1?.frWorkYears || 0) + (vals.p2?.frWorkYears || 0); 
        const frStatePension = PARAMS.FR_PENSION_YEARS_REQUIRED > 0 ? (totalFrWorkYears / PARAMS.FR_PENSION_YEARS_REQUIRED) * PARAMS.FR_PENSION_AVG_SALARY * frPensionRate : 0;
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
        if (isPensionerHousehold) {
             const aantalPensioners = partners.filter(p => { const aowInfo = getAOWDateInfo(p.birthYear); const aowMoment = new Date(p.birthYear + aowInfo.years, (p.birthMonth || 1) - 1 + aowInfo.months); return new Date() > aowMoment; }).length;
             const incomeBaseForAbattement = totaalPensioenInFR; const drempel1 = PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.DREMPEL1; const drempel2 = PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.DREMPEL2;
             const aftrek1 = PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.AFTREK1; const aftrek2 = PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.AFTREK2;
             if (incomeBaseForAbattement <= drempel1 * aantalPensioners) { abattement65plus = aftrek1 * aantalPensioners; } else if (incomeBaseForAbattement <= drempel2 * aantalPensioners) { abattement65plus = aftrek2 * aantalPensioners; }
        } belastbaarInkomen -= abattement65plus;
        const parts = (vals.isCouple ? 2 : 1) + (vals.children > 2 ? (vals.children-2) * 1 + 1 : (vals.children || 0) * 0.5);
        const inkomenPerPart = parts > 0 ? Math.max(0, belastbaarInkomen) / parts : 0; 
        let belastingPerPart = 0, vorigeGrens = 0;
        PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN.forEach(schijf => { const currentGrens = schijf.grens === Infinity ? Infinity : Number(schijf.grens); belastingPerPart += Math.max(0, Math.min(inkomenPerPart, currentGrens) - vorigeGrens) * schijf.tarief; vorigeGrens = currentGrens; });
        let tax = belastingPerPart * parts;
        const baseParts = vals.isCouple ? 2 : 1; const childParts = parts - baseParts; let taxWithoutChildren = 0;
        if (childParts > 0 && baseParts > 0) { 
             const inkomenPerBasePart = Math.max(0, belastbaarInkomen) / baseParts; vorigeGrens = 0;
             PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN.forEach(schijf => { const currentGrens = schijf.grens === Infinity ? Infinity : Number(schijf.grens); taxWithoutChildren += Math.max(0, Math.min(inkomenPerBasePart, currentGrens) - vorigeGrens) * schijf.tarief; vorigeGrens = currentGrens; });
             taxWithoutChildren *= baseParts; const maxVoordeel = childParts * 2 * PARAMS.FR.INKOMSTENBELASTING.QUOTIENT_PLAFOND_PER_HALF_PART;
             const currentAdvantage = taxWithoutChildren - tax; if (currentAdvantage > maxVoordeel) { tax = taxWithoutChildren - maxVoordeel; }
        }
        const belastingKrediet = (vals.homeHelp || 0) * PARAMS.FR.HULP_AAN_HUIS_KREDIET_PERCENTAGE; tax = tax - belastingKrediet; 
        const brutoInFR = totaalPensioenInFR + totaalLoon + totaalWinst + totaalInkomenVermogen; const bruto = brutoInFR + brutoInkomenVoorNLBelasting;
        const taxInFr = totaleSocialeLasten + pfuSocialeLasten + pfuTax + Math.max(0, tax); 
        const netto = (brutoInFR - (totaleSocialeLasten + pfuSocialeLasten + pfuTax)) + nettoInkomenUitNL - Math.max(0, tax) + (tax < 0 ? Math.abs(tax) : 0);
        let wealthTax = 0; const wealthPropNum = vals.wealthProperty || 0;
        if (wealthPropNum > PARAMS.FR.IFI.DREMPEL_START) {
            let taxedAmount = wealthPropNum; wealthTax = 0; let prevLimit = 800000;
            for (const schijf of PARAMS.FR.IFI.SCHIJVEN) { const currentGrens = schijf.grens === Infinity ? Infinity : Number(schijf.grens); if (taxedAmount <= prevLimit) break;
                 const amountInSlice = Math.max(0, Math.min(taxedAmount, currentGrens) - prevLimit); wealthTax += amountInSlice * schijf.tarief; prevLimit = currentGrens; if (taxedAmount <= currentGrens) break; 
            }
        }
        return { bruto, tax: taxInFr, netto, wealthTax, breakdown: { socialeLasten: totaleSocialeLasten + pfuSocialeLasten, aftrekCak, belastingKrediet, tax: Math.max(0, tax) + pfuTax, calculatedTaxIB: tax, parts, nettoInkomenUitNL, brutoInFR, brutoInkomenVoorNLBelasting, frStatePension: frStatePensionActive } };
    }
     function calculateBelgium(vals) { /* ... (identiek) ... */ 
        if (!PARAMS.BE || !PARAMS.NL) { console.error("BE/NL Params missing"); return { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} }; }
        let totaalBruto = 0, totaalBelastbaarInkomen = 0, totaleSocialeLasten = 0;
        let totaalInkomenVermogen = 0, totaalRoerendeVoorheffing = 0;
        let nlPensioenVoorNLBelasting = 0, nlPensioenVoorBEBelasting = 0;
        const partners = [vals.p1, vals.p2].filter(p => p); const P_BE = PARAMS.BE; 
        partners.forEach(p => {
            const salary = p.salary || 0, business = p.business || 0; const pensionPublic = p.pensionPublic || 0, pensionPrivate = p.pensionPrivate || 0;
            const lijfrente = p.lijfrente || 0, incomeWealth = p.incomeWealth || 0; const aowYears = p.aowYears || 0;
            const rszWerknemer = salary * P_BE.SOCIALE_LASTEN.WERKNEMER_RSZ_PERCENTAGE; const belastbaarLoon = salary - rszWerknemer;
            totaleSocialeLasten += rszWerknemer; totaalBelastbaarInkomen += belastbaarLoon; totaalBruto += salary;
            let rszZelfstandige = 0;
            if (business > 0) { let inkomenRestant = business, vorigeGrens = 0; P_BE.SOCIALE_LASTEN.ZELFSTANDIGE_SCHIJVEN.forEach(schijf => { const currentGrens = Number(schijf.grens); let belastbaarInSchijf = Math.max(0, Math.min(inkomenRestant, currentGrens - vorigeGrens)); rszZelfstandige += belastbaarInSchijf * schijf.tarief; inkomenRestant -= belastbaarInSchijf; vorigeGrens = currentGrens; }); }
            const belastbareWinst = business - rszZelfstandige; totaleSocialeLasten += rszZelfstandige; totaalBelastbaarInkomen += belastbareWinst; totaalBruto += business;
            const aowDateInfo = getAOWDateInfo(p.birthYear); const aowMoment = new Date(p.birthYear + aowDateInfo.years, (p.birthMonth || 1) - 1 + aowDateInfo.months); 
            const isPensioner = new Date() > aowMoment; const currentAge = new Date().getFullYear() - (p.birthYear || new Date().getFullYear()); 
            const lijfrenteDurationNum = p.lijfrenteDuration ? Number(p.lijfrenteDuration) : 999; const lijfrenteIsActive = currentAge < lijfrenteDurationNum;
            const currentAOW = isPensioner ? (aowYears / 50) * (vals.isCouple ? PARAMS.AOW_BRUTO_COUPLE : PARAMS.AOW_BRUTO_SINGLE) : 0;
            const currentABP = isPensioner ? pensionPublic : 0; const currentParticulier = isPensioner ? pensionPrivate : 0; const currentLijfrente = (isPensioner && lijfrenteIsActive) ? lijfrente : 0;
            if (currentABP > 0) { nlPensioenVoorNLBelasting += currentABP; } const totaalOverigPensioen = currentAOW + currentParticulier + currentLijfrente;
            if (totaalOverigPensioen > P_BE.INKOMSTENBELASTING.PENSIOEN_NL_DREMPEL_VOOR_BELASTING_IN_NL) { nlPensioenVoorNLBelasting += totaalOverigPensioen; } else { nlPensioenVoorBEBelasting += totaalOverigPensioen; }
            totaalInkomenVermogen += incomeWealth;
        });
        const nlTaxRate = PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0] || 0.1907; const nettoInkomenUitNL = nlPensioenVoorNLBelasting * (1 - nlTaxRate);
        totaalBelastbaarInkomen += nlPensioenVoorBEBelasting; totaalBruto += nlPensioenVoorNLBelasting + nlPensioenVoorBEBelasting + totaalInkomenVermogen; 
        const dividendDeel = totaalInkomenVermogen / 2, renteDeel = totaalInkomenVermogen / 2; const vrijstellingDividend = P_BE.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_VRIJSTELLING_DIVIDEND;
        const vrijgesteldDividendTotaal = Math.min(dividendDeel, vrijstellingDividend * (vals.isCouple ? 2 : 1)); const belastbaarDividend = dividendDeel - vrijgesteldDividendTotaal;
        totaalRoerendeVoorheffing = Math.max(0, belastbaarDividend + renteDeel) * P_BE.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_TARIEF;
        let federaleBelasting = 0, inkomenRestantFederaal = totaalBelastbaarInkomen, vorigeGrensFederaal = 0;
        P_BE.INKOMSTENBELASTING.SCHIJVEN_2025.forEach(schijf => { const grens = schijf.grens; let belastbaarInSchijf = Math.max(0, Math.min(inkomenRestantFederaal, grens - vorigeGrensFederaal)); federaleBelasting += belastbaarInSchijf * schijf.tarief; inkomenRestantFederaal -= belastbaarInSchijf; vorigeGrensFederaal = grens; });
        let totaleVrijstelling = P_BE.INKOMSTENBELASTING.BASIS_VRIJSTELLING * (vals.isCouple ? 2 : 1); const numChildren = vals.children || 0; 
        if (numChildren > 0) {
            const kindAftrek = P_BE.INKOMSTENBELASTING.VRIJSTELLING_PER_KIND; 
            if (numChildren === 1) totaleVrijstelling += kindAftrek[0];
            else if (numChildren === 2) totaleVrijstelling += kindAftrek[1]; 
            else if (numChildren >= 3) { const extraPerKind = kindAftrek[2] - kindAftrek[1]; totaleVrijstelling += kindAftrek[1] + (numChildren - 2) * extraPerKind; }
        }
        const laagsteTarief = P_BE.INKOMSTENBELASTING.SCHIJVEN_2025[0].tarief; const belastingKorting = Math.min(totaalBelastbaarInkomen, totaleVrijstelling) * laagsteTarief;
        federaleBelasting = Math.max(0, federaleBelasting - belastingKorting);
        const gemeentebelasting = federaleBelasting * P_BE.INKOMSTENBELASTING.GEMEENTEBELASTING_GEMIDDELD; const totaleTax = totaleSocialeLasten + federaleBelasting + gemeentebelasting + totaalRoerendeVoorheffing;
        const netto = totaalBruto - totaleTax + nettoInkomenUitNL; const wealthTax = 0; 
        return { bruto: totaalBruto, tax: totaleTax, netto: netto, wealthTax: wealthTax, breakdown: { nettoInkomenUitNL, socialeLasten: totaleSocialeLasten, federaleBelasting, gemeentebelasting, roerendeVoorheffing: totaalRoerendeVoorheffing } };
    }
     function generateBreakdown(vals, compare, fr) { 
         if (!vals || !compare || !fr || !compare.breakdown || !fr.breakdown) { return "Fout: Kon analyse niet genereren."; }
         const wealthFinancial = vals.wealthFinancial || 0, wealthProperty = vals.wealthProperty || 0;
         const estate = wealthFinancial + wealthProperty;
         const getRetirementProjection = (p, partnerIndex) => { /* ... ongewijzigd ... */ 
            if (!p) return '';
            const aowDateInfo = getAOWDateInfo(p.birthYear); const aowMoment = new Date(p.birthYear + aowDateInfo.years, (p.birthMonth || 1) - 1 + aowDateInfo.months); 
            const partnerLabel = vals.isCouple ? ` (P${partnerIndex+1})` : ''; // Korter label
            if (new Date() < aowMoment) { const now = new Date(); let yearsDiff = aowMoment.getFullYear() - now.getFullYear(); let monthsDiff = aowMoment.getMonth() - now.getMonth(); if (monthsDiff < 0) { yearsDiff--; monthsDiff += 12; } return `\n    ↳ Pensioen${partnerLabel} over ${yearsDiff}j, ${monthsDiff}m`; } // Korter
            return `\n    ↳ Pensioen${partnerLabel} loopt`; // Korter
        };
        const projectionP1 = getRetirementProjection(vals.p1, 0); const projectionP2 = vals.p2 ? getRetirementProjection(vals.p2, 1) : '';
    
        let compareCountryTitle = "Vergelijkingsland", compareCountryContent = "";
        if (activeComparison === 'NL') {
            const vrijstellingSingle = PARAMS.NL?.BOX3?.VRIJSTELLING_SINGLE || 0; const vrijstellingCouple = PARAMS.NL?.BOX3?.VRIJSTELLING_COUPLE || 0;
            compareCountryTitle = "Nederland 🇳🇱"; // Korter
            compareCountryContent = `Bruto Inkomen: ${formatCurrency(compare.bruto)}
  ↳ Lasten (IB+Zvw): ${formatCurrency(compare.tax)} (Toelichting: Soc. lasten in IB schijf 1)
  ↳ Netto Inkomen: ${formatCurrency(compare.netto)}
Vermogen (Box 3):
- Fin. Vermogen: ${formatCurrency(wealthFinancial)} / Vrijst.: ${formatCurrency(vals.isCouple ? vrijstellingCouple : vrijstellingSingle)}
  ↳ Aanslag: ${formatCurrency(compare.wealthTax)}`; // Korter
        } else if (activeComparison === 'BE') {
            const nlTaxRate = PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0] || 0.1907; const divisor = (1 - nlTaxRate);
            const brutoNlPension = divisor !== 0 ? (compare.breakdown.nettoInkomenUitNL || 0) / divisor : 0;
            compareCountryTitle = "België 🇧🇪"; // Korter
            compareCountryContent = `Bruto Inkomen: ${formatCurrency(compare.bruto)} (NL pens.: ${formatCurrency(brutoNlPension)})
- Soc. lasten (RSZ): -${formatCurrency(compare.breakdown.socialeLasten || 0)}
- Roer. Voorh. (30%): -${formatCurrency(compare.breakdown.roerendeVoorheffing || 0)}
  ↳ Fed. Belasting: ${formatCurrency(compare.breakdown.federaleBelasting || 0)} + Gem. Bel. (~7.2%): ${formatCurrency(compare.breakdown.gemeentebelasting || 0)}
  ↳ Totale Lasten: ${formatCurrency(compare.tax)}
  ↳ Netto Inkomen: ${formatCurrency(compare.netto)}
Vermogen: Aanslag: ${formatCurrency(compare.wealthTax)} (Toelichting: Geen alg. vermogensbelasting)`; // Korter
        }
    
        // Correctie: formatCurrency gebruiken i.p.v. formatCSS
        return `
Analyse Scenario: ${activeComparison}-FR Kompas
------------------------------------------
Basis: ${vals.isCouple ? 'Partners' : 'Alleenst.'}, Kinderen: ${vals.children || 0}, Vermogen: ${formatCurrency(estate)} (${formatCurrency(wealthFinancial)} fin. / ${formatCurrency(wealthProperty)} vast.) ${projectionP1}${projectionP2}

${compareCountryTitle}
-----------------------------
${compareCountryContent}

Frankrijk 🇫🇷
-----------------------------
Bruto Inkomen: ${formatCurrency(fr.bruto)} (NL pens.: ${formatCurrency(fr.breakdown.brutoInkomenVoorNLBelasting || 0)}, FR pens.: ${formatCurrency(fr.breakdown.frStatePension || 0)})
- Soc. lasten: -${formatCurrency(fr.breakdown.socialeLasten || 0)} (Toelichting: ~9% pens, ~22% loon, ~21% winst, 17% verm.)
- Aftrek CAK: -${formatCurrency(fr.breakdown.aftrekCak || 0)}, Voordeel Parts: ${fr.breakdown.parts || 0}, Krediet Hulp: +${formatCurrency(fr.breakdown.belastingKrediet || 0)}
  ↳ IB FR (incl. PFU): ${formatCurrency(fr.breakdown.tax || 0)} (waarvan IB: ${formatCurrency(fr.breakdown.calculatedTaxIB || 0)}) 
  ↳ Netto Inkomen: ${formatCurrency(fr.netto)}
Vermogen (IFI): Vastgoed: ${formatCurrency(wealthProperty)}, Aanslag: ${formatCurrency(fr.wealthTax)} (Toel.: > €1.3M)
        `; // Kortere teksten
    }

    // --- Start de Applicatie ---
    initializeApp(); 

});

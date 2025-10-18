document.addEventListener('DOMContentLoaded', () => {
    // START NIEUWE ARCHITECTUUR: CONFIG LADEN
    let PARAMS; // Wordt gevuld vanuit config.json
    let isCouple = false;
    let initialLoad = true;
    let activeComparison = 'NL'; // Standaard
    const MAX_WORK_YEARS = 50;

    async function loadConfigAndInit() {
        try {
            const response = await fetch('config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            PARAMS = await response.json();
            
            // Fix Infinity-strings vanuit JSON
            PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN[4].grens = Infinity;
            PARAMS.FR.IFI.SCHIJVEN[5].grens = Infinity;
            PARAMS.BE.INKOMSTENBELASTING.SCHIJVEN_2025[3].grens = Infinity;

            console.log("Config loaded. Initializing script...");
            initializeApp(); // Start de app pas NA het laden van de config
        } catch (error) {
            console.error("Kon config.json niet laden:", error);
            document.body.innerHTML = "<p>Essentiële configuratie kon niet geladen worden. Applicatie kan niet starten.</p>";
        }
    }
    // EINDE NIEUWE ARCHITECTUUR

    // --- DOM Element Selectors (Robuuste Selectie) ---
    const getEl = (id) => document.getElementById(id);
    
    // NIEUW: Selectors voor de landkeuze
    const comparisonChoice = {
        nl: getEl('btn-nl'),
        be: getEl('btn-be')
    };
    const compareCountryResult = getEl('compare-country-result');
    const compareCountryLabel = getEl('compare-country-label');
    const compareCountryFlag = getEl('compare-country-flag');

    const householdType = { single: getEl('btn-single'), couple: getEl('btn-couple') };
    const partner2Section = getEl('partner2-section');
    const inputs = {
        children: getEl('slider-children'), cak: getEl('cak-contribution'),
        homeHelp: getEl('home-help'),
        wealthFinancial: getEl('slider-wealth-financial'), wealthProperty: getEl('slider-wealth-property'),
        p1: { birthYear: getEl('birth-year-1'), birthMonth: getEl('birth-month-1'), aowYears: getEl('aow-years-1'), frWorkYears: getEl('fr-work-years-1'), pensionPublic: getEl('slider-pension-public-1'), pensionPrivate: getEl('slider-pension-private-1'), lijfrente: getEl('slider-lijfrente-1'), lijfrenteDuration: getEl('lijfrente-duration-1'), incomeWealth: getEl('slider-income-wealth-1'), salary: getEl('slider-salary-1'), business: getEl('slider-business-1'), businessType: getEl('business-type-1') },
        p2: { birthYear: getEl('birth-year-2'), birthMonth: getEl('birth-month-2'), aowYears: getEl('aow-years-2'), frWorkYears: getEl('fr-work-years-2'), pensionPublic: getEl('slider-pension-public-2'), pensionPrivate: getEl('slider-pension-private-2'), lijfrente: getEl('slider-lijfrente-2'), lijfrenteDuration: getEl('lijfrente-duration-2'), incomeWealth: getEl('slider-income-wealth-2'), salary: getEl('slider-salary-2'), business: getEl('slider-business-2'), businessType: getEl('business-type-2') },
    };
    const outputs = {
        // NIEUW: Dynamische outputs voor het vergelijkingsland
        compareBruto: getEl('compare-bruto'), compareTax: getEl('compare-tax'), compareNetto: getEl('compare-netto'),
        wealthTaxCompare: getEl('wealth-tax-compare'),

        frBruto: getEl('fr-bruto'), frTax: getEl('fr-tax'), frNetto: getEl('fr-netto'),
        wealthTaxFr: getEl('wealth-tax-fr'),
        wealthTaxFrExpl: getEl('wealth-tax-fr-expl'),
        conclusionBar: getEl('conclusion-bar'), conclusionValue: getEl('conclusion-value'), conclusionExpl: getEl('conclusion-expl'),
        estateTotalDisplay: getEl('estate-total-display'),
        breakdown: getEl('calculation-breakdown'),
    };
    const valueOutputs = {
        p1: { aowYears: getEl('value-aow-years-1'), frWorkYears: getEl('value-fr-work-years-1'), pensionPublic: getEl('value-pension-public-1'), pensionPrivate: getEl('value-pension-private-1'), lijfrente: getEl('value-lijfrente-1'), incomeWealth: getEl('value-income-wealth-1'), salary: getEl('value-salary-1'), business: getEl('value-business-1') },
        p2: { aowYears: getEl('value-aow-years-2'), frWorkYears: getEl('value-fr-work-years-2'), pensionPublic: getEl('value-pension-public-2'), pensionPrivate: getEl('value-pension-private-2'), lijfrente: getEl('value-lijfrente-2'), incomeWealth: getEl('value-income-wealth-2'), salary: getEl('value-salary-2'), business: getEl('value-business-2') },
        children: getEl('value-children'), wealthFinancial: getEl('value-wealth-financial'), wealthProperty: getEl('value-wealth-property'),
    };
    // Einde DOM Selectors
    
    const formatCurrency = (amount, withSign = false) => {
        const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
        const roundedAmount = Math.round(Math.abs(amount));
        return `${withSign ? sign + ' ' : ''}€ ${roundedAmount.toLocaleString('nl-NL')}`;
    };

    function populateDateDropdowns() {
        console.log("Populating date dropdowns...");
        const currentYear = new Date().getFullYear();
        const months = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
        [inputs.p1, inputs.p2].forEach(p => {
            if (!p || !p.birthYear || !p.birthMonth) return;
            const yearSelect = p.birthYear;
            const monthSelect = p.birthMonth;
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

    function getAOWDateInfo(birthYear) {
        if (!birthYear || birthYear < 1940) return { years: 67, months: 0 };
        if (birthYear <= 1957) return { years: 66, months: 4 };
        if (birthYear === 1958) return { years: 66, months: 7 };
        if (birthYear === 1959) return { years: 66, months: 10 };
        return { years: 67, months: 0 };
    }

    // De setupListeners functie wordt nu *binnen* initializeApp aangeroepen
    function setupListeners() {
        console.log("Setting up listeners...");
        // NIEUW: Listeners voor landkeuze
        if (comparisonChoice.nl) comparisonChoice.nl.addEventListener('click', () => updateComparisonCountry('NL'));
        if (comparisonChoice.be) comparisonChoice.be.addEventListener('click', () => updateComparisonCountry('BE'));

        if (householdType.single) householdType.single.addEventListener('click', () => updateHouseholdType(false));
        if (householdType.couple) householdType.couple.addEventListener('click', () => updateHouseholdType(true));

        const resetButton = getEl('reset-btn');
        if (resetButton) {
             resetButton.addEventListener('click', () => {
                console.log("Reset button clicked.");
                document.querySelectorAll('input[type="range"]').forEach(input => { if(input) input.value = 0; });
                document.querySelectorAll('input[type="checkbox"]').forEach(input => { if(input) input.checked = false; });
                document.querySelectorAll('select').forEach(select => { if(select && !select.id.includes('birth')) select.selectedIndex = 0; });
                if (inputs.p1.birthYear) inputs.p1.birthYear.value = 1960;
                if (inputs.p2.birthYear) inputs.p2.birthYear.value = 1960;
                initialLoad = true;
                updateHouseholdType(false); // Resets to single and triggers updateScenario
                updateComparisonCountry('NL'); // Reset ook naar NL
            });
        }

        const copyButton = getEl('copy-btn');
         if (copyButton) {
             copyButton.addEventListener('click', () => {
                 const breakdownContent = outputs.breakdown.textContent || outputs.breakdown.innerText;
                 if (breakdownContent && breakdownContent.trim() !== '' && !breakdownContent.includes("Begin met het invullen")) {
                     navigator.clipboard.writeText(breakdownContent).then(() => {
                         copyButton.textContent = 'Gekopieerd!';
                         setTimeout(() => { copyButton.textContent = '📋 Kopieer Analyse'; }, 2000);
                     }).catch(err => {
                         console.error('Kopiëren mislukt:', err);
                         alert('Kopiëren mislukt. Probeer het handmatig.');
                     });
                 } else {
                     alert("Genereer eerst een analyse door de sliders aan te passen.");
                 }
             });
         }

        // --- DE REPARATIE (Event listener) ---
        const inputContainer = getEl('input-panel');
        if (inputContainer) {
            inputContainer.addEventListener('input', (e) => {
                if (e.target.matches('input, select')) {
                    console.log("Input detected on:", e.target.id || e.target.tagName);
                    if (e.target.id.includes('aow-years') || e.target.id.includes('fr-work-years')) {
                        adjustWorkYears(e.target.id);
                    }
                    updateScenario();
                }
            });
        } else {
             console.error("Input container #input-panel not found!");
        }

        console.log("Listeners setup complete.");
    }

    // NIEUW: Functie om landkeuze te wisselen
    function updateComparisonCountry(countryCode) {
        console.log("Updating comparison country to:", countryCode);
        activeComparison = countryCode;
        comparisonChoice.nl.classList.toggle('active', activeComparison === 'NL');
        comparisonChoice.be.classList.toggle('active', activeComparison === 'BE');

        if (activeComparison === 'NL') {
            compareCountryLabel.textContent = "Als u in Nederland woont";
            compareCountryFlag.textContent = "🇳🇱";
            compareCountryResult.style.borderColor = "var(--primary-color)"; // Gebruik CSS variabele
            
        } else if (activeComparison === 'BE') {
            compareCountryLabel.textContent = "Als u in België woont";
            compareCountryFlag.textContent = "🇧🇪";
            compareCountryResult.style.borderColor = "#FDDA25"; // Belgische goudkleur
        }
        updateScenario();
    }


    function updateHouseholdType(setToCouple) {
        console.log("Updating household type to:", setToCouple ? "Couple" : "Single");
        isCouple = setToCouple;
        if(householdType.single) householdType.single.classList.toggle('active', !isCouple);
        if(householdType.couple) householdType.couple.classList.toggle('active', isCouple);
        if(partner2Section) partner2Section.style.display = isCouple ? 'flex' : 'none';
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
        updateScenario();
    }
    
    function getPartnerInput(partnerId) {
        const p = inputs[partnerId];
        if (!p) return null;

        const getNum = (el) => el ? Number(el.value) : 0;
        const getStr = (el, defaultVal) => el ? el.value : defaultVal;

        return {
            birthYear: getNum(p.birthYear), birthMonth: getNum(p.birthMonth), aowYears: getNum(p.aowYears), frWorkYears: getNum(p.frWorkYears),
            pensionPublic: getNum(p.pensionPublic), pensionPrivate: getNum(p.pensionPrivate),
            lijfrente: getNum(p.lijfrente), lijfrenteDuration: getNum(p.lijfrenteDuration),
            incomeWealth: getNum(p.incomeWealth),
            salary: getNum(p.salary), business: getNum(p.business), businessType: getStr(p.businessType, 'services')
        };
    }

     function adjustWorkYears(changedSliderId) {
         const adjust = (aowSlider, frSlider) => {
             if (!aowSlider || !frSlider) return; 
             let aowVal = Number(aowSlider.value);
             let frVal = Number(frSlider.value);
             if (aowVal + frVal > MAX_WORK_YEARS) {
                if (changedSliderId === aowSlider.id) {
                    frVal = MAX_WORK_YEARS - aowVal;
                    frSlider.value = frVal;
                } else {
                    aowVal = MAX_WORK_YEARS - frVal;
                    aowSlider.value = aowVal;
                }
             }
         };

         if (changedSliderId.includes('-1')) {
             adjust(inputs.p1.aowYears, inputs.p1.frWorkYears);
         } else if (changedSliderId.includes('-2') && isCouple) {
             adjust(inputs.p2.aowYears, inputs.p2.frWorkYears);
         }
         updateValueOutputsForYears();
     }
    
    function updateValueOutputsForYears() {
        if (valueOutputs.p1.aowYears && inputs.p1.aowYears) valueOutputs.p1.aowYears.textContent = inputs.p1.aowYears.value;
        if (valueOutputs.p1.frWorkYears && inputs.p1.frWorkYears) valueOutputs.p1.frWorkYears.textContent = inputs.p1.frWorkYears.value;
        if (isCouple && valueOutputs.p2.aowYears && inputs.p2.aowYears) valueOutputs.p2.aowYears.textContent = inputs.p2.aowYears.value;
        if (isCouple && valueOutputs.p2.frWorkYears && inputs.p2.frWorkYears) valueOutputs.p2.frWorkYears.textContent = inputs.p2.frWorkYears.value;
    }


    function updateScenario() {
        console.log("--- updateScenario Start ---");
        try {
            if (!PARAMS) {
                console.warn("PARAMS not loaded yet, aborting updateScenario.");
                return;
            }

            const p1Input = getPartnerInput('p1');
            const p2Input = isCouple ? getPartnerInput('p2') : null;
            if (!p1Input) throw new Error("Partner 1 input object is null");

            const inputValues = {
                isCouple, 
                children: Number(inputs.children.value), 
                cak: inputs.cak.checked, 
                homeHelp: Number(inputs.homeHelp.value),
                wealthFinancial: Number(inputs.wealthFinancial.value), 
                wealthProperty: Number(inputs.wealthProperty.value),
                p1: p1Input, p2: p2Input
            };
            inputValues.estate = inputValues.wealthFinancial + inputValues.wealthProperty;
            console.log("Input Values Read:", inputValues);

            [
                { p: p1Input, el: inputs.p1 },
                { p: p2Input, el: inputs.p2 }
            ].forEach(item => {
                if (item.p && item.el && item.el.aowYears) {
                    const maxAOWYears = 50; 
                    item.el.aowYears.max = maxAOWYears;
                    const currentAOWValue = Number(item.el.aowYears.value);
                    if (currentAOWValue > maxAOWYears) {
                         item.el.aowYears.value = maxAOWYears;
                         item.p.aowYears = maxAOWYears;
                    } else {
                         item.p.aowYears = currentAOWValue;
                    }
                    const tooltipSpan = item.el.aowYears.previousElementSibling?.querySelector('.tooltip');
                    if(tooltipSpan) tooltipSpan.dataset.text = `Aantal jaren verzekerd voor AOW (max ${maxAOWYears}). Bepaalt de hoogte van uw Nederlandse AOW. Let op: totaal NL+FR jaren max 50.`;
                }
            });

            Object.keys(valueOutputs.p1).forEach(key => { if(valueOutputs.p1[key] && p1Input[key] !== undefined) valueOutputs.p1[key].textContent = ['aowYears', 'frWorkYears'].includes(key) ? p1Input[key] : formatCurrency(p1Input[key])});
            if(isCouple && p2Input) { Object.keys(valueOutputs.p2).forEach(key => { if(valueOutputs.p2[key] && p2Input[key] !== undefined) valueOutputs.p2[key].textContent = ['aowYears', 'frWorkYears'].includes(key) ? p2Input[key] : formatCurrency(p2Input[key])}); }
            valueOutputs.children.textContent = inputValues.children;
            valueOutputs.wealthFinancial.textContent = formatCurrency(inputValues.wealthFinancial);
            valueOutputs.wealthProperty.textContent = formatCurrency(inputValues.wealthProperty);
            if (outputs.estateTotalDisplay) outputs.estateTotalDisplay.textContent = formatCurrency(inputValues.estate);

            // --- NIEUWE LOGICA: Dynamische berekening ---
            let compareResults;
            if (activeComparison === 'NL') {
                console.log("Calculating NL...");
                compareResults = calculateNetherlands(inputValues);
            } else if (activeComparison === 'BE') {
                console.log("Calculating BE...");
                compareResults = calculateBelgium(inputValues);
            }
            
            console.log("Calculating FR...");
            const frResults = calculateFrance(inputValues);
            console.log("Calculations done. Updating UI...");
            
            outputs.compareBruto.textContent = formatCurrency(compareResults.bruto);
            outputs.compareTax.textContent = formatCurrency(compareResults.tax);
            outputs.compareNetto.textContent = formatCurrency(compareResults.netto);
            outputs.wealthTaxCompare.textContent = formatCurrency(compareResults.wealthTax);

            outputs.frBruto.textContent = formatCurrency(frResults.bruto);
            outputs.frTax.textContent = formatCurrency(frResults.tax);
            outputs.frNetto.textContent = formatCurrency(frResults.netto);
            outputs.wealthTaxFr.textContent = formatCurrency(frResults.wealthTax);
            outputs.wealthTaxFrExpl.textContent = (frResults.wealthTax === 0 && inputValues.estate > 50000) ? "(Vastgoed < €1.3M)" : "";
            
            const totalAdvantage = (frResults.netto - compareResults.netto) + (compareResults.wealthTax - frResults.wealthTax);
            outputs.conclusionValue.textContent = formatCurrency(totalAdvantage, true);
            outputs.conclusionBar.className = totalAdvantage >= 0 ? 'positive' : 'negative';
            outputs.conclusionExpl.textContent = totalAdvantage >= 0 ? "Een positief bedrag duidt op een financieel voordeel in het Franse scenario." : "Een negatief bedrag duidt op een financieel voordeel in het vergeleken scenario.";
            // --- EINDE NIEUWE LOGICA ---
            
            if (initialLoad) {
                 outputs.breakdown.innerHTML = `<p style="padding: 15px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Welkom bij het Kompas! 🧭<br>Begin met het invullen van uw <strong>geboortedatum</strong> en voeg daarna uw inkomstenbronnen toe om de vergelijking te zien.</p>`;
                initialLoad = false;
            } else {
                outputs.breakdown.textContent = generateBreakdown(inputValues, compareResults, frResults);
            }
             console.log("UI Update complete.");
        } catch (error) {
            console.error("Calculation Error in updateScenario:", error);
            outputs.breakdown.textContent = `Er is een fout opgetreden: ${error.message}. Controleer de invoer of probeer opnieuw.`;
        }
         console.log("--- updateScenario End ---");
    }

    // --- MODULAIRE BEREKENINGEN ---

    // --- NEDERLAND ---
    function calculateNetherlands(vals) {
        let currentBruto = 0, currentTax = 0, currentNetto = 0;
        const partners = [vals.p1, vals.p2].filter(p => p);
        
        partners.forEach(p => {
            const aowDateInfo = getAOWDateInfo(p.birthYear);
            const aowMoment = new Date(p.birthYear + aowDateInfo.years, p.birthMonth - 1 + aowDateInfo.months);
            const isPensioner = new Date() > aowMoment;
            const currentAge = new Date().getFullYear() - p.birthYear;
            const lijfrenteIsActive = currentAge < p.lijfrenteDuration;

            const currentPension = isPensioner ? p.pensionPublic + p.pensionPrivate + (lijfrenteIsActive ? p.lijfrente : 0) : 0;
            const currentAOW = isPensioner ? (Number(p.aowYears) / 50) * (vals.isCouple ? PARAMS.AOW_BRUTO_COUPLE : PARAMS.AOW_BRUTO_SINGLE) : 0;
            
            const res = calculateNLNetto(currentAOW + currentPension, p.salary, p.business, isPensioner); // Roep sub-functie aan
            currentBruto += res.bruto;
            currentTax += res.tax;
            currentNetto += res.netto;
        });

        const vrijstelling = vals.isCouple ? PARAMS.NL.BOX3.VRIJSTELLING_COUPLE : PARAMS.NL.BOX3.VRIJSTELLING_SINGLE;
        const wealthTax = Math.max(0, vals.wealthFinancial - vrijstelling) * PARAMS.NL.BOX3.FORFAITAIR_RENDEMENT * PARAMS.NL.BOX3.TARIEF;

        return { bruto: currentBruto, tax: currentTax, netto: currentNetto, wealthTax };
    }

    function calculateNLNetto(pensionIncome, salary, business, isAOW) {
        const winstNaVrijstelling = business * (1 - PARAMS.NL.BOX1.MKB_WINSTVRIJSTELLING);
        const zvwBasis = business > 0 ? winstNaVrijstelling : 0;
        const zvw = zvwBasis * PARAMS.NL.SOCIALE_LASTEN.ZVW_PERCENTAGE;

        const bruto = pensionIncome + salary + winstNaVrijstelling;
        if (bruto <= 0 && zvw <= 0) return { bruto: 0, tax: 0, netto: 0 };
        if (bruto <= 0 && zvw > 0) return { bruto: 0, tax: zvw, netto: -zvw };

        let tax = 0;
        const tarieven = isAOW ? PARAMS.NL.BOX1.TARIEVEN_BOVEN_AOW : PARAMS.NL.BOX1.TARIEVEN_ONDER_AOW;
        if (bruto <= PARAMS.NL.BOX1.GRENS_SCHIJF_1) {
            tax = bruto * tarieven[0];
        } else {
            tax = (PARAMS.NL.BOX1.GRENS_SCHIJF_1 * tarieven[0]) + ((bruto - PARAMS.NL.BOX1.GRENS_SCHIJF_1) * tarieven[1]);
        }
        
        let arbeidskorting = (salary > 0 || business > 0 ? PARAMS.NL.BOX1.ARBEIDSKORTING_MAX : 0); // Vereenvoudigd
        let algemeneKorting = PARAMS.NL.BOX1.ALGEMENE_HEFFINGSKORTING_MAX;
        
        if (bruto > PARAMS.NL.BOX1.HK_AFBOUW_START) {
            algemeneKorting = Math.max(0, PARAMS.NL.BOX1.ALGEMENE_HEFFINGSKORTING_MAX - ((bruto - PARAMS.NL.BOX1.HK_AFBOUW_START) * PARAMS.NL.BOX1.HK_AFBOUW_FACTOR));
        }
        if (bruto >= PARAMS.NL.BOX1.GRENS_SCHIJF_1) { 
             algemeneKorting = 0;
        }
        if (bruto > 39957) { 
            arbeidskorting = Math.max(0, PARAMS.NL.BOX1.ARBEIDSKORTING_MAX - ((bruto - 39957) * 0.0651));
        }
        
        tax = tax - algemeneKorting - arbeidskorting;
        tax = Math.max(0, tax); 
        const totalTax = tax + zvw; 
        return { bruto, tax: totalTax, netto: bruto - totalTax };
    }

    // --- FRANKRIJK ---
    function calculateFrance(vals) {
        let brutoInkomenVoorNLBelasting = 0, totaalAOW = 0, totaalParticulierPensioen = 0, totaalLijfrente = 0, totaalLoon = 0, totaalWinst = 0, isPensionerHousehold = false;
        let totalBusinessForAbattement = { services: 0, rental: 0 };
        let totalEUYears = 0;
        const partners = [vals.p1, vals.p2].filter(p => p);

        partners.forEach(p => {
            const aowDateInfo = getAOWDateInfo(p.birthYear);
            const aowMoment = new Date(p.birthYear + aowDateInfo.years, p.birthMonth - 1 + aowDateInfo.months);
            const isPensioner = new Date() > aowMoment;
            if(isPensioner) isPensionerHousehold = true;
            
            const currentAge = new Date().getFullYear() - p.birthYear;
            const lijfrenteIsActive = currentAge < p.lijfrenteDuration;
            totalEUYears += Number(p.aowYears) + Number(p.frWorkYears);

            brutoInkomenVoorNLBelasting += isPensioner ? p.pensionPublic : 0;
            totaalAOW += isPensioner ? (Number(p.aowYears) / 50) * (vals.isCouple ? PARAMS.AOW_BRUTO_COUPLE : PARAMS.AOW_BRUTO_SINGLE) : 0;
            totaalParticulierPensioen += isPensioner ? p.pensionPrivate : 0;
            totaalLijfrente += isPensioner && lijfrenteIsActive ? p.lijfrente : 0;
            totaalLoon += p.salary;
            totaalWinst += p.business;
            totalBusinessForAbattement[p.businessType] += p.business;
        });
        
        const frPensionRate = totalEUYears >= PARAMS.FR_PENSION_YEARS_REQUIRED ? PARAMS.FR_PENSION_RATE : PARAMS.FR_PENSION_RATE * (totalEUYears / PARAMS.FR_PENSION_YEARS_REQUIRED);
        const totalFrWorkYears = (vals.p1.frWorkYears || 0) + (vals.p2 ? (vals.p2.frWorkYears || 0) : 0);
        const frStatePension = PARAMS.FR_PENSION_YEARS_REQUIRED > 0 ? (totalFrWorkYears / PARAMS.FR_PENSION_YEARS_REQUIRED) * PARAMS.FR_PENSION_AVG_SALARY * frPensionRate : 0;
        const frStatePensionActive = isPensionerHousehold ? frStatePension : 0;

        const totaalInkomenVermogen = (vals.p1.incomeWealth || 0) + (vals.p2 ? (vals.p2.incomeWealth || 0) : 0);
        const pfuTax = totaalInkomenVermogen * PARAMS.FR.INKOMSTENBELASTING.PFU_TARIEF;
        const pfuSocialeLasten = totaalInkomenVermogen * PARAMS.FR.SOCIALE_LASTEN.PFU;

        const nettoInkomenUitNL = brutoInkomenVoorNLBelasting * (1 - PARAMS.NL.BOX1.TARIEVEN_BOVEN_AOW[0]);
        const totaalPensioenInFR = totaalAOW + totaalParticulierPensioen + totaalLijfrente + frStatePensionActive;
        
        const socialeLastenPensioen = totaalPensioenInFR * PARAMS.FR.SOCIALE_LASTEN.PENSIOEN;
        const socialeLastenSalaris = totaalLoon * PARAMS.FR.SOCIALE_LASTEN.SALARIS;
        const socialeLastenWinst = (totalBusinessForAbattement.services * PARAMS.FR.SOCIALE_LASTEN.WINST_DIENSTEN) + (totalBusinessForAbattement.rental * PARAMS.FR.SOCIALE_LASTEN.WINST_VERHUUR);
        const totaleSocialeLasten = socialeLastenPensioen + socialeLastenSalaris + socialeLastenWinst;
        
        const winstNaAbattement = (totalBusinessForAbattement.services * (1 - PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_WINST_DIENSTEN)) + (totalBusinessForAbattement.rental * (1 - PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_WINST_VERHUUR));

        let belastbaarInkomen = (totaalPensioenInFR + totaalLoon + winstNaAbattement) - socialeLastenPensioen - socialeLastenSalaris;
        const aftrekCak = vals.cak ? PARAMS.FR.CAK_BIJDRAGE_GEMIDDELD : 0;
        belastbaarInkomen -= aftrekCak;
        
        let abattement65plus = 0;
        if (isPensionerHousehold) {
             const aantalPensioners = partners.filter(p => new Date() > new Date(p.birthYear + getAOWDateInfo(p.birthYear).years, p.birthMonth - 1 + getAOWDateInfo(p.birthYear).months)).length;
             const incomeBaseForAbattement = totaalPensioenInFR; 
             if (incomeBaseForAbattement <= PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.DREMPEL1 * aantalPensioners) {
                 abattement65plus = PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.AFTREK1 * aantalPensioners;
             } else if (incomeBaseForAbattement <= PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.DREMPEL2 * aantalPensioners) {
                 abattement65plus = PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.AFTREK2 * aantalPensioners;
             }
        }
        belastbaarInkomen -= abattement65plus;
        
        const parts = (vals.isCouple ? 2 : 1) + (vals.children > 2 ? (vals.children-2) * 1 + 1 : vals.children * 0.5);
        const inkomenPerPart = Math.max(0, belastbaarInkomen) / parts;
        
        let belastingPerPart = 0, vorigeGrens = 0;
        PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN.forEach(schijf => {
            belastingPerPart += Math.max(0, Math.min(inkomenPerPart, schijf.grens) - vorigeGrens) * schijf.tarief;
            vorigeGrens = schijf.grens;
        });
        
        let tax = belastingPerPart * parts;
        
         const baseParts = vals.isCouple ? 2 : 1;
         const childParts = parts - baseParts;
         let taxWithoutChildren = 0;
         if (childParts > 0) {
             const inkomenPerBasePart = Math.max(0, belastbaarInkomen) / baseParts;
             vorigeGrens = 0;
             PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN.forEach(schijf => {
                 taxWithoutChildren += Math.max(0, Math.min(inkomenPerBasePart, schijf.grens) - vorigeGrens) * schijf.tarief;
                 vorigeGrens = schijf.grens;
             });
             taxWithoutChildren *= baseParts;

             const maxVoordeel = childParts * 2 * PARAMS.FR.INKOMSTENBELASTING.QUOTIENT_PLAFOND_PER_HALF_PART;
             const currentAdvantage = taxWithoutChildren - tax;
             if (currentAdvantage > maxVoordeel) {
                 tax = taxWithoutChildren - maxVoordeel;
             }
         }

        const belastingKrediet = vals.homeHelp * PARAMS.FR.HULP_AAN_HUIS_KREDIET_PERCENTAGE;
        tax = tax - belastingKrediet; 
        
        const brutoInFR = totaalPensioenInFR + totaalLoon + totaalWinst + totaalInkomenVermogen;
        const bruto = brutoInFR + brutoInkomenVoorNLBelasting;
        const taxInFr = totaleSocialeLasten + pfuSocialeLasten + pfuTax + Math.max(0, tax);
        const netto = (brutoInFR - taxInFr) + nettoInkomenUitNL + (tax < 0 ? Math.abs(tax) : 0); 
        
        let wealthTax = 0;
        if (vals.wealthProperty > PARAMS.FR.IFI.DREMPEL_START) {
            let taxedAmount = vals.wealthProperty;
            wealthTax = 0;
            let prevLimit = 800000;

            for (const schijf of PARAMS.FR.IFI.SCHIJVEN) {
                 if (taxedAmount <= prevLimit) break;
                 const amountInSlice = Math.min(taxedAmount, schijf.grens) - prevLimit;
                 if (amountInSlice <= 0) continue;
                 wealthTax += amountInSlice * schijf.tarief;
                 prevLimit = schijf.grens;
                 if (taxedAmount <= schijf.grens) break;
            }
        }

        return { bruto, tax: taxInFr, netto, wealthTax, breakdown: { socialeLasten: totaleSocialeLasten + pfuSocialeLasten, aftrekCak, belastingKrediet, tax: Math.max(0, tax) + pfuTax, parts, nettoInkomenUitNL, brutoInFR, brutoInkomenVoorNLBelasting, frStatePension: frStatePensionActive }};
    }

    // --- BELGIË ---
    function calculateBelgium(vals) {
        console.log("Calculating Belgium...");
        
        let totaalBruto = 0;
        let totaalBelastbaarInkomen = 0;
        let totaleSocialeLasten = 0;
        let totaalInkomenVermogen = 0;
        let totaalRoerendeVoorheffing = 0;
        let nlPensioenVoorNLBelasting = 0;
        let nlPensioenVoorBEBelasting = 0;

        const partners = [vals.p1, vals.p2].filter(p => p);
        const P_BE = PARAMS.BE; // Parameters uit config.json

        // Stap 1: Bereken sociale lasten en belastbaar inkomen per partner
        partners.forEach(p => {
            // A. Inkomen uit loondienst
            const rszWerknemer = p.salary * P_BE.SOCIALE_LASTEN.WERKNEMER_RSZ_PERCENTAGE;
            const belastbaarLoon = p.salary - rszWerknemer;
            totaleSocialeLasten += rszWerknemer;
            totaalBelastbaarInkomen += belastbaarLoon;
            totaalBruto += p.salary;

            // B. Inkomen uit onderneming (Zelfstandige)
            let rszZelfstandige = 0;
            if (p.business > 0) {
                let inkomenRestant = p.business;
                let vorigeGrens = 0;
                P_BE.SOCIALE_LASTEN.ZELFSTANDIGE_SCHIJVEN.forEach(schijf => {
                    let belastbaarInSchijf = Math.max(0, Math.min(inkomenRestant, schijf.grens - vorigeGrens));
                    rszZelfstandige += belastbaarInSchijf * schijf.tarief;
                    inkomenRestant -= belastbaarInSchijf;
                    vorigeGrens = schijf.grens;
                });
                // Geen tarief op deel boven hoogste grens
            }
            const belastbareWinst = p.business - rszZelfstandige;
            totaleSocialeLasten += rszZelfstandige;
            totaalBelastbaarInkomen += belastbareWinst;
            totaalBruto += p.business;

            // C. Pensioen & AOW (Verdrag NL-BE)
            // Dit is complex: Totaal NL pensioen > 25k? Dan heft NL. Anders heft BE.
            const aowDateInfo = getAOWDateInfo(p.birthYear);
            const aowMoment = new Date(p.birthYear + aowDateInfo.years, p.birthMonth - 1 + aowDateInfo.months);
            const isPensioner = new Date() > aowMoment;
            const currentAge = new Date().getFullYear() - p.birthYear;
            const lijfrenteIsActive = currentAge < p.lijfrenteDuration;

            const currentAOW = isPensioner ? (Number(p.aowYears) / 50) * (vals.isCouple ? PARAMS.AOW_BRUTO_COUPLE : PARAMS.AOW_BRUTO_SINGLE) : 0;
            const currentABP = isPensioner ? p.pensionPublic : 0;
            const currentParticulier = isPensioner ? p.pensionPrivate : 0;
            const currentLijfrente = (isPensioner && lijfrenteIsActive) ? p.lijfrente : 0;
            
            // Overheidspensioen (ABP) is bijna altijd belast in NL
            if (currentABP > 0) {
                 nlPensioenVoorNLBelasting += currentABP;
            }

            // AOW, Particulier, Lijfrente
            const totaalOverigPensioen = currentAOW + currentParticulier + currentLijfrente;
            if (totaalOverigPensioen > P_BE.INKOMSTENBELASTING.PENSIOEN_NL_DREMPEL_VOOR_BELASTING_IN_NL) {
                // Boven de drempel, NL heft
                nlPensioenVoorNLBelasting += totaalOverigPensioen;
            } else {
                // Onder de drempel, BE heft
                nlPensioenVoorBEBelasting += totaalOverigPensioen;
            }

            // D. Inkomen uit vermogen (voor Roerende Voorheffing)
            totaalInkomenVermogen += p.incomeWealth;
        });

        // Stap 2: Verwerk Pensioenen in de totalen
        // De in NL belaste pensioenen worden netto (na NL Box 1 tarief) opgeteld
        const nettoInkomenUitNL = nlPensioenVoorNLBelasting * (1 - PARAMS.NL.BOX1.TARIEVEN_BOVEN_AOW[0]);
        // De in BE belaste pensioenen tellen mee voor de Belgische belastbare basis
        totaalBelastbaarInkomen += nlPensioenVoorBEBelasting;
        totaalBruto += nlPensioenVoorNLBelasting + nlPensioenVoorBEBelasting;

        // Stap 3: Bereken Roerende Voorheffing (op vermogensinkomsten)
        // Aanname: inkomen uit vermogen is 50% dividend, 50% rente.
        // We passen de vrijstelling voor dividend toe.
        const dividendDeel = totaalInkomenVermogen / 2;
        const renteDeel = totaalInkomenVermogen / 2;
        const vrijgesteldDividend = Math.min(dividendDeel, P_BE.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_VRIJSTELLING_DIVIDEND * (vals.isCouple ? 2 : 1));
        const belastbaarDividend = dividendDeel - vrijgesteldDividend;
        
        totaalRoerendeVoorheffing = (belastbaarDividend + renteDeel) * P_BE.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_TARIEF;
        totaalBruto += totaalInkomenVermogen; // Inkomen uit vermogen telt mee in Bruto

        // Stap 4: Bereken de Personenbelasting (Federaal)
        let federaleBelasting = 0;
        let inkomenRestant = totaalBelastbaarInkomen;
        let vorigeGrens = 0;

        P_BE.INKOMSTENBELASTING.SCHIJVEN_2025.forEach(schijf => {
            const grens = schijf.grens; // Infinity is al gefixed bij het laden
            let belastbaarInSchijf = Math.max(0, Math.min(inkomenRestant, grens - vorigeGrens));
            federaleBelasting += belastbaarInSchijf * schijf.tarief;
            inkomenRestant -= belastbaarInSchijf;
            vorigeGrens = grens;
        });

        // Stap 5: Bereken de Belastingvrije Som (als korting)
        let totaleVrijstelling = P_BE.INKOMSTENBELASTING.BASIS_VRIJSTELLING * (vals.isCouple ? 2 : 1);
        if (vals.children > 0) {
            const kindAftrek = P_BE.INKOMSTENBELASTING.VRIJSTELLING_PER_KIND;
            if (vals.children === 1) totaleVrijstelling += kindAftrek[0];
            else if (vals.children === 2) totaleVrijstelling += kindAftrek[0] + kindAftrek[1];
            else if (vals.children === 3) totaleVrijstelling += kindAftrek[0] + kindAftrek[1] + kindAftrek[2];
            else if (vals.children > 3) {
                totaleVrijstelling += kindAftrek[0] + kindAftrek[1] + kindAftrek[2] + ((vals.children - 3) * kindAftrek[2]); // Elk extra kind = bedrag 3e kind
            }
        }
        
        // De vrijstelling wordt verrekend tegen de laagste schijf (25%)
        const belastingKorting = Math.min(totaalBelastbaarInkomen, totaleVrijstelling) * P_BE.INKOMSTENBELASTING.SCHIJVEN_2025[0].tarief;
        
        federaleBelasting = Math.max(0, federaleBelasting - belastingKorting);

        // Stap 6: Bereken de Gemeentebelasting
        // Dit is een percentage *over* de federale belasting
        const gemeentebelasting = federaleBelasting * P_BE.INKOMSTENBELASTING.GEMEENTEBELASTING_GEMIDDELD;

        // Stap 7: Totaal en Netto
        const totaleTax = totaleSocialeLasten + federaleBelasting + gemeentebelasting + totaalRoerendeVoorheffing;
        
        const nettoInkomenUitBE = (totaalBelastbaarInkomen + totaalInkomenVermogen) - (totaleSocialeLasten + federaleBelasting + gemeentebelasting + totaalRoerendeVoorheffing);
        const netto = nettoInkomenUitBE + nettoInkomenUitNL;

        // Aanname: België heeft geen directe vermogensbelasting zoals Box 3 (NL) of IFI (FR).
        const wealthTax = 0; 

        return { bruto: totaalBruto, tax: totaleTax, netto: netto, wealthTax: wealthTax, breakdown: { nettoInkomenUitNL: nettoInkomenUitNL, socialeLasten: totaleSocialeLasten, federaleBelasting: federaleBelasting, gemeentebelasting: gemeentebelasting, roerendeVoorheffing: totaalRoerendeVoorheffing }};
    }
    
    // --- BREAKDOWN ---
    function generateBreakdown(vals, compare, fr) {
        const getRetirementProjection = (p, partnerIndex) => {
            if (!p) return '';
            const aowDateInfo = getAOWDateInfo(p.birthYear);
            const aowMoment = new Date(p.birthYear + aowDateInfo.years, p.birthMonth - 1 + aowDateInfo.months);
            const partnerLabel = vals.isCouple ? ` (Partner ${partnerIndex+1})` : '';
            if (new Date() < aowMoment) {
                const now = new Date();
                let yearsDiff = aowMoment.getFullYear() - now.getFullYear();
                let monthsDiff = aowMoment.getMonth() - now.getMonth();
                if (monthsDiff < 0) { yearsDiff--; monthsDiff += 12; }
                const monthStr = monthsDiff === 1 ? 'maand' : 'maanden';
                const yearStr = yearsDiff === 1 ? 'jaar' : 'jaren';
                 return `\n    ↳ Pensioen${partnerLabel} start over ${yearsDiff} ${yearStr}, ${monthsDiff} ${monthStr}`;
            }
            return `\n    ↳ Pensioen${partnerLabel} is reeds ingegaan`;
        };

        const projectionP1 = getRetirementProjection(vals.p1, 0);
        const projectionP2 = vals.p2 ? getRetirementProjection(vals.p2, 1) : '';

        // Dynamische content voor het vergelijkingsland
        let compareCountryTitle = "Vergelijkingsland";
        let compareCountryContent = "";

        if (activeComparison === 'NL') {
            compareCountryTitle = "Als u in Nederland woont 🇳🇱";
            compareCountryContent = `
Huidig Bruto Inkomen: ${formatCurrency(compare.bruto)}
  ↳ Geschatte Lasten (IB + Zvw): ${formatCurrency(compare.tax)}
    (Toelichting: In NL zijn sociale lasten v. werknemers/gepensioneerden 
     grotendeels verwerkt in het belastingtarief van de eerste schijf. 
     Voor ondernemers komt de Zvw-bijdrage hier nog bovenop.)
  ↳ Huidig Netto Inkomen: ${formatCurrency(compare.netto)}
Vermogen (Box 3):
- Financieel Vermogen: ${formatCurrency(vals.wealthFinancial)}
- Vrijstelling: ${formatCurrency(vals.isCouple ? PARAMS.NL.BOX3.VRIJSTELLING_COUPLE : PARAMS.NL.BOX3.VRIJSTELLING_SINGLE)}
  ↳ Jaarlijkse Aanslag: ${formatCurrency(compare.wealthTax)}
            `;
        } else if (activeComparison === 'BE') {
            compareCountryTitle = "Als u in België woont 🇧🇪";
            compareCountryContent = `
Huidig Bruto Inkomen: ${formatCurrency(compare.bruto)}
  (waarvan NL belast pensioen: ${formatCurrency(compare.breakdown.nettoInkomenUitNL * (1/(1-PARAMS.NL.BOX1.TARIEVEN_BOVEN_AOW[0])))})
- Sociale lasten (RSZ/INASTI): -${formatCurrency(compare.breakdown.socialeLasten)}
- Roerende Voorheffing (30%): -${formatCurrency(compare.breakdown.roerendeVoorheffing)}
  ↳ Federale Belasting (PB): ${formatCurrency(compare.breakdown.federaleBelasting)}
  ↳ Gemeentebelasting (~7.2%): +${formatCurrency(compare.breakdown.gemeentebelasting)}
  ↳ Geschatte Totale Lasten: ${formatCurrency(compare.tax)}
  ↳ Huidig Netto Inkomen: ${formatCurrency(compare.netto)}
Vermogen:
- Jaarlijkse Aanslag: ${formatCurrency(compare.wealthTax)}
  (Toelichting: België kent geen algemene vermogensbelasting zoals 
   NL Box 3 of FR IFI. Inkomen uit vermogen wordt wel belast.)
            `;
        }

        return `
Analyse Scenario: ${activeComparison}-FR Financieel Kompas
------------------------------------------

Basisgegevens
-------------
Huishouden: ${vals.isCouple ? 'Echtpaar / Partners' : 'Alleenstaande'}
Minderjarige kinderen: ${vals.children}
Totaal Vermogen: ${formatCurrency(vals.estate)} (${formatCurrency(vals.wealthFinancial)} fin. / ${formatCurrency(vals.wealthProperty)} vastgoed)
${projectionP1}${projectionP2}

${compareCountryTitle}
-----------------------------
${compareCountryContent}

Als u in Frankrijk woont 🇫🇷
-----------------------------
Huidig Bruto Inkomen: ${formatCurrency(fr.bruto)}
  (waarvan NL belast pensioen: ${formatCurrency(fr.breakdown.brutoInkomenVoorNLBelasting)})
  (waarvan FR staatspensioen: ${formatCurrency(fr.breakdown.frStatePension)})
- Sociale lasten: -${formatCurrency(fr.breakdown.socialeLasten)}
    (Toelichting: Totale sociale lasten over uw Franse inkomen. 
     Percentages: ~9.1% (pensioen), ~22% (loon), ~21% (winst), 17.2% (vermogensinkomsten).)
- Aftrek CAK-bijdrage: -${formatCurrency(fr.breakdown.aftrekCak)}
- Belastingvoordeel (parts): ${fr.breakdown.parts}
- Belastingkrediet Hulp aan Huis: +${formatCurrency(fr.breakdown.belastingKrediet)}
  ↳ Berekende Inkomstenbelasting FR: ${formatCurrency(fr.breakdown.tax)}
  ↳ Huidig Netto Inkomen: ${formatCurrency(fr.netto)}
Vermogen (IFI):
- Vastgoed Vermogen: ${formatCurrency(vals.wealthProperty)}
- Jaarlijkse Aanslag: ${formatCurrency(fr.wealthTax)}
  (Toelichting: Alleen vastgoed > €1.3M wordt belast)
        `;
    }

    // --- Initialisatie ---
    // Verplaatst naar de nieuwe 'loadConfigAndInit' functie
    function initializeApp() {
        populateDateDropdowns();
        setupListeners();
        updateHouseholdType(false); // Start as single
        updateComparisonCountry('NL'); // Start met NL
        // updateScenario() wordt automatisch aangeroepen door de twee functies hierboven
    }

    // Start de applicatie
    loadConfigAndInit();

});
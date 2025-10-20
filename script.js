document.addEventListener('DOMContentLoaded', () => {
    // --- Globale variabelen ---
    let PARAMS; let isCouple = false; let initialLoad = true; let activeComparison = 'NL'; const MAX_WORK_YEARS = 50;
    let comparisonChoice, compareCountryResult, compareCountryLabel, compareCountryFlag;
    let householdType, partner2Section, inputs, outputs, valueOutputs;
    let pensionLabels;

    const getEl = (id) => document.getElementById(id);

    // --- Hulpfuncties ---
    function displayError(message) { console.error(message); const el=getEl('calculation-breakdown'); if(el) el.textContent=message; else document.body.innerHTML=`<p style="color:red;padding:20px;">${message}</p>`; }
    function checkSelectors() { if(!comparisonChoice||!householdType||!inputs||!outputs||!valueOutputs||!outputs.breakdown||!inputs.p1?.birthYear||!inputs.children||!outputs.compareBruto||!valueOutputs.p1?.aowYears||!inputs.simYear){ console.error("UI elements missing."); return false; } return true; }

    function getSimulationInfo(vals) {
        const simYear = inputs.simYear ? parseInt(inputs.simYear.value, 10) : null;
        const simMonth = inputs.simMonth ? parseInt(inputs.simMonth.value, 10) : null;
        let simulatieDatum = new Date();
        let scenarioIsPastOrPresent = true;

        if (simYear && simMonth) {
            simulatieDatum = new Date(simYear, simMonth - 1, 15);
            scenarioIsPastOrPresent = simulatieDatum <= new Date();
        }

        const calcAge = (p) => {
             if (!p?.birthYear || !p?.birthMonth) return null;
             let ageYears = simulatieDatum.getFullYear() - p.birthYear;
             let ageMonths = simulatieDatum.getMonth() - (p.birthMonth - 1);
             if (ageMonths < 0 || (ageMonths === 0 && simulatieDatum.getDate() < 15)) { ageYears--; }
             return ageYears;
         };
        const simulatieLeeftijdP1 = calcAge(vals.p1);
        const simulatieLeeftijdP2 = vals.p2 ? calcAge(vals.p2) : null;

        return { simulatieDatum, simulatieLeeftijdP1, simulatieLeeftijdP2, scenarioIsPastOrPresent };
    }


    // --- Initialisatie ---
    async function initializeApp() {
        console.log("Initializing...");
        try { // 1. Load Config
            const response = await fetch('./config.json'); if (!response.ok) throw new Error(`Config load failed: ${response.status}`);
            PARAMS = await response.json(); console.log("Config loaded.");
            const fixInf = (arr) => arr?.forEach(item => { if (item.grens === "Infinity") item.grens = Infinity; });
            fixInf(PARAMS?.FR?.INKOMSTENBELASTING?.SCHIJVEN); fixInf(PARAMS?.FR?.IFI?.SCHIJVEN); fixInf(PARAMS?.BE?.INKOMSTENBELASTING?.SCHIJVEN_2025); fixInf(PARAMS?.BE?.SOCIALE_LASTEN?.BIJZONDERE_BIJDRAGE_SCHIJVEN_GEZIN_2024);
            PARAMS.FR.INKOMSTENBELASTING.LIJFRENTE_FRACTIES = [ { age: 50, fraction: 0.7 }, { age: 60, fraction: 0.5 }, { age: 70, fraction: 0.4 }, { age: Infinity, fraction: 0.3 } ];
            PARAMS.FR.SOCIALE_LASTEN.LIJFRENTE_TARIEF = 0.091; // Aanname
        } catch (error) { displayError(`Fout laden config: ${error.message}.`); return; }

        // 2. Select DOM Elements
        console.log("Selecting elements...");
        comparisonChoice={nl:getEl('btn-nl'),be:getEl('btn-be')}; compareCountryResult=getEl('compare-country-result'); compareCountryLabel=getEl('compare-country-label'); compareCountryFlag=getEl('compare-country-flag');
        householdType={single:getEl('btn-single'),couple:getEl('btn-couple')}; partner2Section=getEl('partner2-section');
        inputs = {
            simYear: getEl('sim-year'), simMonth: getEl('sim-month'),
            children: getEl('slider-children'), cak: getEl('cak-contribution'), homeHelp: getEl('home-help'), wealthFinancial: getEl('slider-wealth-financial'), wealthProperty: getEl('slider-wealth-property'),
            p1: { birthYear: getEl('birth-year-1'), birthMonth: getEl('birth-month-1'), aowYears: getEl('aow-years-1'), beWorkYears: getEl('be-work-years-1'), frWorkYears: getEl('fr-work-years-1'), bePension: getEl('slider-be-pension-1'), pensionPublic: getEl('slider-pension-public-1'), pensionPrivate: getEl('slider-pension-private-1'), lijfrente: getEl('slider-lijfrente-1'), lijfrenteDuration: getEl('lijfrente-duration-1'), lijfrenteStartAge: getEl('lijfrente-start-1'), incomeWealth: getEl('slider-income-wealth-1'), salary: getEl('slider-salary-1'), business: getEl('slider-business-1'), businessType: getEl('business-type-1') },
            p2: { birthYear: getEl('birth-year-2'), birthMonth: getEl('birth-month-2'), aowYears: getEl('aow-years-2'), beWorkYears: getEl('be-work-years-2'), frWorkYears: getEl('fr-work-years-2'), bePension: getEl('slider-be-pension-2'), pensionPublic: getEl('slider-pension-public-2'), pensionPrivate: getEl('slider-pension-private-2'), lijfrente: getEl('slider-lijfrente-2'), lijfrenteDuration: getEl('lijfrente-duration-2'), lijfrenteStartAge: getEl('lijfrente-start-2'), incomeWealth: getEl('slider-income-wealth-2'), salary: getEl('slider-salary-2'), business: getEl('slider-business-2'), businessType: getEl('business-type-2') },};
        outputs = { compareBruto: getEl('compare-bruto'), compareTax: getEl('compare-tax'), compareNetto: getEl('compare-netto'), wealthTaxCompare: getEl('wealth-tax-compare'), frBruto: getEl('fr-bruto'), frTax: getEl('fr-tax'), frNetto: getEl('fr-netto'), wealthTaxFr: getEl('wealth-tax-fr'), wealthTaxFrExpl: getEl('wealth-tax-fr-expl'), conclusionBar: getEl('conclusion-bar'), conclusionValue: getEl('conclusion-value'), conclusionExpl: getEl('conclusion-expl'), estateTotalDisplay: getEl('estate-total-display'), breakdown: getEl('calculation-breakdown'),};
        valueOutputs = { p1: { aowYears: getEl('value-aow-years-1'), beWorkYears: getEl('value-be-work-years-1'), frWorkYears: getEl('value-fr-work-years-1'), bePension: getEl('value-be-pension-1'), pensionPublic: getEl('value-pension-public-1'), pensionPrivate: getEl('value-pension-private-1'), lijfrente: getEl('value-lijfrente-1'), incomeWealth: getEl('value-income-wealth-1'), salary: getEl('value-salary-1'), business: getEl('value-business-1') }, p2: { aowYears: getEl('value-aow-years-2'), beWorkYears: getEl('value-be-work-years-2'), frWorkYears: getEl('value-fr-work-years-2'), bePension: getEl('value-be-pension-2'), pensionPublic: getEl('value-pension-public-2'), pensionPrivate: getEl('value-pension-private-2'), lijfrente: getEl('value-lijfrente-2'), incomeWealth: getEl('value-income-wealth-2'), salary: getEl('value-salary-2'), business: getEl('value-business-2') }, children: getEl('value-children'), wealthFinancial: getEl('value-wealth-financial'), wealthProperty: getEl('value-wealth-property'),};
        pensionLabels = document.querySelectorAll('.country-origin');

        // 3. Check Selectors
        if (!checkSelectors()) { displayError("Init mislukt: Kon UI-elementen niet vinden."); return; }
        console.log("DOM elements selected.");

        // 4. Setup
        populateDateDropdowns(); populateSimDateDropdowns();
        setupListeners();
        updateHouseholdType(false); updateComparisonCountry('NL');
        console.log("Application initialized.");
    }

    // --- Core Functions ---
    const formatCurrency = (amount, withSign = false) => { const s=amount>0?'+':amount<0?'−':''; const r=Math.round(Math.abs(amount||0)); return `${withSign?s+' ':''}€ ${r.toLocaleString('nl-NL')}`; };
    function populateDateDropdowns() { if(!inputs?.p1?.birthYear||!inputs?.p2?.birthYear)return; const cY=new Date().getFullYear();const M=["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"]; [inputs.p1,inputs.p2].forEach(p=>{if(!p||!p.birthYear||!p.birthMonth)return; const yS=p.birthYear,mS=p.birthMonth;if(yS.options.length>0)return; yS.innerHTML='';mS.innerHTML=''; for(let y=cY-18;y>=1940;y--){const o=new Option(y,y);if(y===1960)o.selected=true; yS.add(o);} M.forEach((m,i)=>mS.add(new Option(m,i+1)));}); }
    function populateSimDateDropdowns() { if (!inputs.simYear || !inputs.simMonth) return; const cY=new Date().getFullYear(); const sY=inputs.simYear,sM=inputs.simMonth; sY.innerHTML='<option value="">-- Huidig Jaar --</option>'; sM.innerHTML='<option value="">-- Huidige Maand --</option>'; for (let y=cY+20;y>=cY-10;y--){sY.add(new Option(y,y));} const M=["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"]; M.forEach((m,i)=>sM.add(new Option(m,i+1))); }
    function getAOWDateInfo(birthYear) { const yr=Number(birthYear); if(!yr||yr<1940)return{years:67,months:0}; if(yr<=1957)return{years:66,months:4}; if(yr===1958)return{years:66,months:7}; if(yr===1959)return{years:66,months:10}; return{years:67,months:0}; }
    function setupListeners() { if(!comparisonChoice||!householdType)return; if(comparisonChoice.nl)comparisonChoice.nl.addEventListener('click',()=>updateComparisonCountry('NL')); if(comparisonChoice.be)comparisonChoice.be.addEventListener('click',()=>updateComparisonCountry('BE')); if(householdType.single)householdType.single.addEventListener('click',()=>updateHouseholdType(false)); if(householdType.couple)householdType.couple.addEventListener('click',()=>updateHouseholdType(true)); const rb=getEl('reset-btn'); if(rb){rb.addEventListener('click',()=>{if(!inputs?.p1?.birthYear)return; document.querySelectorAll('input[type=range]').forEach(i=>{if(i)i.value=0;}); document.querySelectorAll('input[type=checkbox]').forEach(i=>{if(i)i.checked=false;}); document.querySelectorAll('select:not([id*="birth"])').forEach(s=>{if(s)s.selectedIndex=0;}); if(inputs.p1.birthYear)inputs.p1.birthYear.value=1960; if(inputs.p2.birthYear)inputs.p2.birthYear.value=1960; if(inputs.simYear)inputs.simYear.value=""; if(inputs.simMonth)inputs.simMonth.value=""; initialLoad=true; updateHouseholdType(false);updateComparisonCountry('NL');});} const cb=getEl('copy-btn'); if(cb){cb.addEventListener('click',()=>{const txt=outputs?.breakdown?.textContent||''; if(txt&&!txt.includes("Welkom")){navigator.clipboard.writeText(txt).then(()=>{cb.textContent='Gekopieerd!';setTimeout(()=>{cb.textContent='📋 Kopieer Analyse';},2000);}).catch(err=>{console.error('Kopieerfout:',err);alert('Kopiëren mislukt.');});}else{alert("Genereer analyse.");}}); } const ic=getEl('input-panel'); if(ic){ic.addEventListener('input',(e)=>{if(e.target.matches('input, select')){if(e.target.id.includes('aow-years')||e.target.id.includes('fr-work-years')||e.target.id.includes('be-work-years')){adjustWorkYears(e.target.id);}updateScenario();}});}else{console.error("#input-panel missing!");} }
    function toggleCountrySpecificFields(countryCode) {
        document.querySelectorAll('.nl-specific').forEach(el=>el.style.display=(countryCode==='NL'?'block':'none'));
        document.querySelectorAll('.be-specific').forEach(el=>el.style.display=(countryCode==='BE'?'block':'none'));
        document.querySelectorAll('.hide-for-be').forEach(el=>el.style.display=(countryCode==='BE'?'none':'block'));
        const countryName = countryCode === 'NL' ? 'NL' : 'BE';
        pensionLabels.forEach(label => { if(label) label.textContent = `uit ${countryName}`; });
    }
    function updateComparisonCountry(countryCode) {
         if (!comparisonChoice?.nl || !comparisonChoice?.be || !compareCountryLabel || !compareCountryFlag || !compareCountryResult) return;
        activeComparison = countryCode; comparisonChoice.nl.classList.toggle('active', activeComparison === 'NL'); comparisonChoice.be.classList.toggle('active', activeComparison === 'BE');
        if (activeComparison === 'NL') { compareCountryLabel.textContent = "Nederland"; compareCountryFlag.textContent = "🇳🇱"; compareCountryResult.style.borderColor = "var(--primary-color)";}
        else if (activeComparison === 'BE') { compareCountryLabel.textContent = "België"; compareCountryFlag.textContent = "🇧🇪"; compareCountryResult.style.borderColor = "#FDDA25"; }
        toggleCountrySpecificFields(activeComparison);
        updateScenario();
    }
    function updateHouseholdType(setToCouple) {
         if (!householdType?.single || !householdType?.couple || !partner2Section || !inputs?.p2) return;
        isCouple = setToCouple; householdType.single.classList.toggle('active',!isCouple); householdType.couple.classList.toggle('active',isCouple);
        partner2Section.style.display = isCouple ? 'flex' : 'none';
        if (!isCouple) { Object.keys(inputs.p2).forEach(key=>{ const el=inputs.p2[key]; if(el&&(el.matches('input[type=range]')||el.matches('input[type=checkbox]')||el.matches('select:not([id*="birth"])'))){ if(el.type==='range')el.value=0; if(el.type==='checkbox')el.checked=false; if(el.tagName==='SELECT')el.selectedIndex=0;}}); }
        updateScenario();
    }
    function getPartnerInput(partnerId) {
        if (!inputs || !inputs[partnerId] || !inputs[partnerId].birthYear){ console.error(`P data missing ${partnerId}`); return null; }
        const p = inputs[partnerId]; const getN = (el) => el ? Number(el.value) : 0; const getS = (el, d) => el ? el.value : d;
        const lijfrenteStart = p.lijfrenteStartAge ? p.lijfrenteStartAge.value : 'aow';
        return { birthYear:getN(p.birthYear), birthMonth:getN(p.birthMonth), aowYears:getN(p.aowYears), beWorkYears:getN(p.beWorkYears), frWorkYears:getN(p.frWorkYears), bePension:getN(p.bePension), pensionPublic:getN(p.pensionPublic), pensionPrivate:getN(p.pensionPrivate), lijfrente:getN(p.lijfrente), lijfrenteDuration:getN(p.lijfrenteDuration), lijfrenteStartAge: lijfrenteStart, incomeWealth:getN(p.incomeWealth), salary:getN(p.salary), business:getN(p.business), businessType:getS(p.businessType,'services') };
    }
    function adjustWorkYears(changedId) { if(!inputs?.p1||!inputs?.p2)return; const pI=changedId.includes('-1')?inputs.p1:inputs.p2; if(!pI)return; let cS,fS; if(activeComparison==='NL'){cS=pI.aowYears;fS=pI.frWorkYears;}else{cS=pI.beWorkYears;fS=pI.frWorkYears;} if(!cS||!fS)return; let cV=Number(cS.value);let fV=Number(fS.value); if(cV+fV>MAX_WORK_YEARS){if(changedId===cS.id){fV=MAX_WORK_YEARS-cV;fS.value=fV;}else{cV=MAX_WORK_YEARS-fV;cS.value=cV;}} updateValueOutputsForYears(); }
    function updateValueOutputsForYears() { if(!valueOutputs?.p1||!valueOutputs?.p2||!inputs?.p1||!inputs?.p2)return; const uV=(oE,iE,iC=true,iY=false)=>{if(oE&&iE){const v=iE.value||'0';oE.textContent=iY?v:(iC?formatCurrency(Number(v)):v);}else if(oE){oE.textContent=iY?'0':formatCurrency(0);}}; uV(valueOutputs.p1.aowYears,inputs.p1.aowYears,false,true); uV(valueOutputs.p1.beWorkYears,inputs.p1.beWorkYears,false,true); uV(valueOutputs.p1.frWorkYears,inputs.p1.frWorkYears,false,true); uV(valueOutputs.p1.bePension,inputs.p1.bePension); uV(valueOutputs.p1.pensionPublic,inputs.p1.pensionPublic); uV(valueOutputs.p1.pensionPrivate,inputs.p1.pensionPrivate); uV(valueOutputs.p1.lijfrente,inputs.p1.lijfrente); uV(valueOutputs.p1.incomeWealth,inputs.p1.incomeWealth); uV(valueOutputs.p1.salary,inputs.p1.salary); uV(valueOutputs.p1.business,inputs.p1.business); if(isCouple){ uV(valueOutputs.p2.aowYears,inputs.p2.aowYears,false,true); uV(valueOutputs.p2.beWorkYears,inputs.p2.beWorkYears,false,true); uV(valueOutputs.p2.frWorkYears,inputs.p2.frWorkYears,false,true); uV(valueOutputs.p2.bePension,inputs.p2.bePension); uV(valueOutputs.p2.pensionPublic,inputs.p2.pensionPublic); uV(valueOutputs.p2.pensionPrivate,inputs.p2.pensionPrivate); uV(valueOutputs.p2.lijfrente,inputs.p2.lijfrente); uV(valueOutputs.p2.incomeWealth,inputs.p2.incomeWealth); uV(valueOutputs.p2.salary,inputs.p2.salary); uV(valueOutputs.p2.business,inputs.p2.business); } }
    function updateScenario() {
        if (!PARAMS || !inputs || !outputs || !valueOutputs || !checkSelectors()) { console.warn("UpdateScenario called too early."); if(outputs?.breakdown) outputs.breakdown.textContent="Laden..."; return; }
        try {
            const p1Input = getPartnerInput('p1'); if (!p1Input) throw new Error("P1 data invalid.");
            const p2Input = isCouple ? getPartnerInput('p2') : null; if (isCouple && !p2Input) throw new Error("P2 data invalid.");
            const inputValues = { isCouple, children: Number(inputs.children?.value||0), cak: !!inputs.cak?.checked, homeHelp: Number(inputs.homeHelp?.value||0), wealthFinancial: Number(inputs.wealthFinancial?.value||0), wealthProperty: Number(inputs.wealthProperty?.value||0), p1: p1Input, p2: p2Input };
            inputValues.estate = inputValues.wealthFinancial + inputValues.wealthProperty;

            [ { p: p1Input, elData: inputs.p1 }, { p: p2Input, elData: inputs.p2 } ].forEach(item => { const yS=activeComparison==='NL'?item.elData?.aowYears:item.elData?.beWorkYears; if(item.p&&yS){const m=50; yS.max=m; const c=Number(yS.value||0); const yP=activeComparison==='NL'?'aowYears':'beWorkYears'; item.p[yP]=Math.min(c,m); if(c>m)yS.value=m; const tt=yS.closest('.form-group')?.querySelector('.tooltip'); if(tt)tt.dataset.text=`Jaren ${activeComparison}(max ${m}). EU(${activeComparison}+FR) max 50.`;} if(item.p&&item.elData?.frWorkYears){const m=50; item.elData.frWorkYears.max=m; const c=Number(item.elData.frWorkYears.value||0); item.p.frWorkYears=Math.min(c,m); if(c>m)item.elData.frWorkYears.value=m; const tt=item.elData.frWorkYears.closest('.form-group')?.querySelector('.tooltip'); if(tt)tt.dataset.text=`Jaren FR(max ${m}). EU(${activeComparison}+FR) max 50.`;}});
            updateValueOutputsForYears();
            if(valueOutputs.children) valueOutputs.children.textContent=inputValues.children; if(valueOutputs.wealthFinancial) valueOutputs.wealthFinancial.textContent=formatCurrency(inputValues.wealthFinancial); if(valueOutputs.wealthProperty) valueOutputs.wealthProperty.textContent=formatCurrency(inputValues.wealthProperty); if(outputs.estateTotalDisplay) outputs.estateTotalDisplay.textContent=formatCurrency(inputValues.estate);

            let compareResults = { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} };
            if (activeComparison === 'NL') { compareResults = calculateNetherlands(inputValues); }
            else if (activeComparison === 'BE') { compareResults = calculateBelgium(inputValues); }
            const frResults = calculateFrance(inputValues, activeComparison);

            if(outputs.compareBruto)outputs.compareBruto.textContent=formatCurrency(compareResults.bruto); if(outputs.compareTax)outputs.compareTax.textContent=formatCurrency(compareResults.tax); if(outputs.compareNetto)outputs.compareNetto.textContent=formatCurrency(compareResults.netto); if(outputs.wealthTaxCompare)outputs.wealthTaxCompare.textContent=formatCurrency(compareResults.wealthTax);
            if(outputs.frBruto)outputs.frBruto.textContent=formatCurrency(frResults.bruto); if(outputs.frTax)outputs.frTax.textContent=formatCurrency(frResults.tax); if(outputs.frNetto)outputs.frNetto.textContent=formatCurrency(frResults.netto); if(outputs.wealthTaxFr)outputs.wealthTaxFr.textContent=formatCurrency(frResults.wealthTax); if(outputs.wealthTaxFrExpl)outputs.wealthTaxFrExpl.textContent=(frResults.wealthTax===0&&inputValues.estate>50000)?"(Vastgoed < €1.3M)":"";
            const frN=frResults.netto||0, compN=compareResults.netto||0, frW=frResults.wealthTax||0, compW=compareResults.wealthTax||0; const delta=(frN-compN)+(compW-frW);
            if(outputs.conclusionValue)outputs.conclusionValue.textContent=formatCurrency(delta,true); if(outputs.conclusionBar)outputs.conclusionBar.className=delta>=0?'positive':'negative'; if(outputs.conclusionExpl)outputs.conclusionExpl.textContent=delta>=0?"Positief: voordeel in Frankrijk.":"Negatief: voordeel in vergeleken land.";
            if(outputs.breakdown){if(initialLoad){outputs.breakdown.innerHTML=`<p style="text-align: center;">Welkom! 🧭 Vul data in.</p>`; initialLoad=false;}else{outputs.breakdown.textContent=generateBreakdown(inputValues,compareResults,frResults);}}

        } catch (error) { console.error("Fout in updateScenario:", error); displayError(`Fout berekening: ${error.message}.`); }
     }

    // ===========================================
    // ===== REKENFUNCTIES ======================
    // ===========================================

    // --- NEDERLAND ---
    function calculateNetherlands(vals) {
        if (!PARAMS.NL) return { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} }; let cB=0, cT=0, cN=0; const P=[vals.p1, vals.p2].filter(p=>p);
        const { simulatieDatum, simulatieLeeftijdP1, simulatieLeeftijdP2 } = getSimulationInfo(vals);

        P.forEach((p, index)=>{
            const simulatieLeeftijd = (index === 0) ? simulatieLeeftijdP1 : simulatieLeeftijdP2;
            const aDI=getAOWDateInfo(p.birthYear); const aM=new Date((p.birthYear||1900)+aDI.years,(p.birthMonth||1)-1+aDI.months);
            const isPensioner = simulatieLeeftijd !== null && simulatieDatum >= aM; // Check against sim date
            const lDN=p.lijfrenteDuration?Number(p.lijfrenteDuration):999;
            const lijfrenteStartAgeVal = p.lijfrenteStartAge === 'aow' ? (aDI.years + Math.floor(aDI.months / 12)) : parseInt(p.lijfrenteStartAge || '999', 10);
            const lijfrenteIsActive = simulatieLeeftijd !== null && simulatieLeeftijd >= lijfrenteStartAgeVal && simulatieLeeftijd < lDN;

            const cP=isPensioner?(p.pensionPublic||0)+(p.pensionPrivate||0):0;
            const cAOW=isPensioner?(Number(p.aowYears||0)/50)*(vals.isCouple?PARAMS.AOW_BRUTO_COUPLE:PARAMS.AOW_BRUTO_SINGLE):0;
            const cL = lijfrenteIsActive ? (p.lijfrente||0) : 0;
            const isWorking = simulatieLeeftijd !== null && simulatieDatum < aM; // Werkt tot AOW-leeftijd
            const r=calculateNLNetto(cAOW+cP+cL, isWorking ? p.salary||0 : 0, isWorking ? p.business||0 : 0, isPensioner);
            cB+=r.bruto;cT+=r.tax;cN+=r.netto;
        });
        const v=vals.isCouple?(PARAMS.NL.BOX3.VRIJSTELLING_COUPLE||0):(PARAMS.NL.BOX3.VRIJSTELLING_SINGLE||0); const wT=Math.max(0,(vals.wealthFinancial||0)-v)*(PARAMS.NL.BOX3.FORFAITAIR_RENDEMENT||0)*(PARAMS.NL.BOX3.TARIEF||0);
        return {bruto:cB, tax:cT, netto:cN, wealthTax:wT, breakdown: { simulatieDatum: simulatieDatum }};
    }
     function calculateNLNetto(pI, s, b, iA) { if(!PARAMS.NL)return{bruto:0,tax:0,netto:0}; const wNV=b*(1-(PARAMS.NL.BOX1.MKB_WINSTVRIJSTELLING||0)); const zB=b>0?wNV:0; const z=zB*(PARAMS.NL.SOCIALE_LASTEN.ZVW_PERCENTAGE||0); const br=pI+s+wNV; if(br<=0&&z<=0)return{bruto:0,tax:0,netto:0}; if(br<=0&&z>0)return{bruto:0,tax:z,netto:-z}; let t=0; const T=iA?PARAMS.NL.BOX1.TARIEVEN_BOVEN_AOW:PARAMS.NL.BOX1.TARIEVEN_ONDER_AOW; const gS1=PARAMS.NL.BOX1.GRENS_SCHIJF_1||Infinity; if(br<=gS1){t=br*T[0];}else{t=(gS1*T[0])+((br-gS1)*T[1]);} let aK=(s>0||b>0?(PARAMS.NL.BOX1.ARBEIDSKORTING_MAX||0):0); let alK=PARAMS.NL.BOX1.ALGEMENE_HEFFINGSKORTING_MAX||0; const hAS=PARAMS.NL.BOX1.HK_AFBOUW_START||0; if(br>hAS){alK=Math.max(0,alK-((br-hAS)*(PARAMS.NL.BOX1.HK_AFBOUW_FACTOR||0)));} if(br>=gS1){alK=0;} const akAS=39957; if(br>akAS){aK=Math.max(0,aK-((br-akAS)*0.0651));} t=t-alK-aK; t=Math.max(0,t); const tT=t+z; return {bruto:br, tax:tT, netto:br-tT}; }

    // --- FRANKRIJK ---
    function calculateFrance(vals, currentComparison) {
        if (!PARAMS.FR || !PARAMS.NL || !PARAMS.BE) return { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} };
        let bINLB=0, tA=0, tPP=0, tLo=0, tW=0, iPH=false;
        let tBFA={services:0, rental:0}; let tEY=0;
        let totalBePension = 0, totalBePensionContributions = 0;
        let totalLijfrenteBruto = 0, totalLijfrenteBelastbaar = 0, lijfrenteSocLasten = 0;
        const P=[vals.p1, vals.p2].filter(p=>p);
        const { simulatieDatum, simulatieLeeftijdP1, simulatieLeeftijdP2 } = getSimulationInfo(vals);

        P.forEach((p, index)=>{
            const simulatieLeeftijd = (index === 0) ? simulatieLeeftijdP1 : simulatieLeeftijdP2;
            const aDI=getAOWDateInfo(p.birthYear); const aM=new Date((p.birthYear||1900)+aDI.years,(p.birthMonth||1)-1+aDI.months);
            const isPensioner = simulatieLeeftijd !== null && simulatieDatum >= aM;
            const isWorking = simulatieLeeftijd !== null && simulatieDatum < aM;
            if(isPensioner) iPH = true;
            const lDN=p.lijfrenteDuration?Number(p.lijfrenteDuration):999;
            const lijfrenteStartAgeVal = p.lijfrenteStartAge === 'aow' ? (aDI.years + Math.floor(aDI.months / 12)) : parseInt(p.lijfrenteStartAge || '999', 10);
            const lijfrenteIsActive = simulatieLeeftijd !== null && simulatieLeeftijd >= lijfrenteStartAgeVal && simulatieLeeftijd < lDN;

            const countryYears = (currentComparison === 'NL') ? Number(p.aowYears||0) : Number(p.beWorkYears||0);
            tEY += countryYears + Number(p.frWorkYears||0);

            bINLB+=isPensioner?(p.pensionPublic||0):0;
            tA+=isPensioner?(Number(p.aowYears||0)/50)*(vals.isCouple?PARAMS.AOW_BRUTO_COUPLE:PARAMS.AOW_BRUTO_SINGLE):0;
            tPP+=isPensioner?(p.pensionPrivate||0):0;
            
            const currentLijfrente = lijfrenteIsActive ? (p.lijfrente||0) : 0;
            totalLijfrenteBruto += currentLijfrente;
            if (currentLijfrente > 0 && simulatieLeeftijd !== null) {
                let belastbareFractie = 1.0; // Default 100% (als < 50)
                for (const frac of (PARAMS.FR.INKOMSTENBELASTING.LIJFRENTE_FRACTIES||[])) {
                    if (simulatieLeeftijd < frac.age) { belastbareFractie = frac.fraction; break; }
                    belastbareFractie = frac.fraction; // Blijf updaten tot de laatste (>=70)
                }
                const lijfrenteBelastbaarDeel = currentLijfrente * belastbareFractie;
                totalLijfrenteBelastbaar += lijfrenteBelastbaarDeel;
                lijfrenteSocLasten += lijfrenteBelastbaarDeel * (PARAMS.FR.SOCIALE_LASTEN.LIJFRENTE_TARIEF || 0);
            }

            tLo+= isWorking ? (p.salary||0) : 0; tW+= isWorking ? (p.business||0) : 0;
            if(isWorking) tBFA[p.businessType||'services']+=(p.business||0);
            const bePensionBruto = p.bePension || 0;
            if (isPensioner && bePensionBruto > 0) {
                totalBePension += bePensionBruto;
                totalBePensionContributions += bePensionBruto * ((PARAMS.BE.SOCIALE_LASTEN.PENSIOEN_RIZIV_PERCENTAGE||0) + (PARAMS.BE.SOCIALE_LASTEN.PENSIOEN_SOLIDARITEIT_PERCENTAGE||0));
            }
        });

        const frReqYears = PARAMS.FR_PENSION_YEARS_REQUIRED || 1; const frRate = PARAMS.FR_PENSION_RATE || 0; const frAvgSal = PARAMS.FR_PENSION_AVG_SALARY || 0;
        const frPensionRate = tEY >= frReqYears ? frRate : frRate * (tEY / frReqYears);
        const tFWY=(vals.p1?.frWorkYears||0)+(vals.p2?.frWorkYears||0); const fSP=frReqYears>0?(tFWY/frReqYears)*frAvgSal*frPensionRate:0; const fSPA=iPH?fSP:0;
        const tIV=(vals.p1?.incomeWealth||0)+(vals.p2?.incomeWealth||0); const pT=tIV*(PARAMS.FR.INKOMSTENBELASTING.PFU_TARIEF||0); const pSL=tIV*(PARAMS.FR.SOCIALE_LASTEN.PFU||0);
        const nlTR=PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0]||0; const nINL=bINLB*(1-nlTR);
        const tPIF_NL_BE=tA+tPP+fSPA + totalBePension;
        const sLP=(tA+tPP+fSPA)*(PARAMS.FR.SOCIALE_LASTEN.PENSIOEN||0);
        const sLS=tLo*(PARAMS.FR.SOCIALE_LASTEN.SALARIS||0); const sLW=(tBFA.services*(PARAMS.FR.SOCIALE_LASTEN.WINST_DIENSTEN||0))+(tBFA.rental*(PARAMS.FR.SOCIALE_LASTEN.WINST_VERHUUR||0));
        const tSL_excl_lijfrente = sLP + sLS + sLW;
        const wNA=(tBFA.services*(1-(PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_WINST_DIENSTEN||0)))+(tBFA.rental*(1-(PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_WINST_VERHUUR||0)));
        let bI=(tPIF_NL_BE+tLo+wNA) - tSL_excl_lijfrente + totalLijfrenteBelastbaar;
        bI -= totalBePensionContributions; const aC=vals.cak?(PARAMS.FR.CAK_BIJDRAGE_GEMIDDELD||0):0; bI-=aC;
        let a65=0; if(iPH){const aP=P.filter(p=>{const aI=getAOWDateInfo(p.birthYear);const aMo=new Date((p.birthYear||1900)+aI.years,(p.birthMonth||1)-1+aI.months);return simulatieDatum>=aMo;}).length; const iBFA_65=tPIF_NL_BE + totalLijfrenteBruto; const d1=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.DREMPEL1||Infinity; const d2=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.DREMPEL2||Infinity; const af1=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.AFTREK1||0; const af2=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.AFTREK2||0; if(iBFA_65<=d1*aP){a65=af1*aP;}else if(iBFA_65<=d2*aP){a65=af2*aP;}} bI-=a65;
        const parts=(vals.isCouple?2:1)+(vals.children>2?(vals.children-2)*1+1:(vals.children||0)*0.5); const iPP=parts>0?Math.max(0,bI)/parts:0;
        let bPP=0,vG=0; (PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN||[]).forEach(s=>{const cG=s.grens===Infinity?Infinity:Number(s.grens); bPP+=Math.max(0,Math.min(iPP,cG)-vG)*s.tarief; vG=cG;});
        let tax = bPP * parts;
        const bP = vals.isCouple ? 2 : 1; const cP = parts - bP; let tWC = 0;
        if (cP > 0 && bP > 0) { const iPB = Math.max(0, bI) / bP; vG = 0; (PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN||[]).forEach(s=>{const cG=s.grens===Infinity?Infinity:Number(s.grens); tWC+=Math.max(0,Math.min(iPB,cG)-vG)*s.tarief; vG=cG;}); tWC*=bP; const mV=cP*2*(PARAMS.FR.INKOMSTENBELASTING.QUOTIENT_PLAFOND_PER_HALF_PART||0); const cA=tWC-tax; if (cA > mV) { tax = tWC - mV; } }
        const bK=(vals.homeHelp||0)*(PARAMS.FR.HULP_AAN_HUIS_KREDIET_PERCENTAGE||0); tax=tax-bK;
        const bIF = tPIF_NL_BE + totalLijfrenteBruto + tLo + tW + tIV;
        const br = bIF + bINLB;
        const totaleSocialeLastenFrankrijk = tSL_excl_lijfrente + pSL + lijfrenteSocLasten + totalBePensionContributions;
        const tIF = totaleSocialeLastenFrankrijk + pT + Math.max(0,tax);
        const nt = (bIF - totaleSocialeLastenFrankrijk - pT) + nINL - Math.max(0,tax) + (tax<0?Math.abs(tax):0);
        let wT=0; const wPN=vals.wealthProperty||0; const ifiStart = PARAMS.FR.IFI.DREMPEL_START || Infinity; if(wPN>ifiStart){let tA=wPN;wT=0;let pL=800000;for(const s of (PARAMS.FR.IFI.SCHIJVEN||[])){const cG=s.grens===Infinity?Infinity:Number(s.grens);if(tA<=pL)break; const aIS=Math.max(0,Math.min(tA,cG)-pL); wT+=aIS*s.tarief; pL=cG; if(tA<=cG)break;}}
        return {bruto:br,tax:tIF,netto:nt,wealthTax:wT, breakdown:{ simulatieDatum: simulatieDatum, socialeLasten:totaleSocialeLastenFrankrijk, aftrekCak:aC, beContribAftrek: totalBePensionContributions, belastingKrediet:bK,tax:Math.max(0,tax)+pT,calculatedTaxIB:tax,parts:parts,nettoInkomenUitNL:nINL,brutoInFR:bIF,brutoInkomenVoorNLBelasting:bINLB,frStatePension:fSPA, lijfrenteBruto: totalLijfrenteBruto, lijfrenteBelastbaar: totalLijfrenteBelastbaar, pfuTax: pT, pfuSocLasten: pSL, frSocLastenInkomen: tSL_excl_lijfrente, lijfrenteSocLasten: lijfrenteSocLasten }};
    }

    // --- BELGIË ---
    function calculateBelgium(vals) {
        if (!PARAMS.BE || !PARAMS.NL) return { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} };
        let tB=0, tBI_voor_kosten=0, tSL=0, tIV=0, tRV=0, nPNLB=0;
        let brutoBePension=0, bePensionContrib=0;
        let p1LoonVoorKosten = 0, p2LoonVoorKosten = 0;
        const P=[vals.p1, vals.p2].filter(p=>p); const PB=PARAMS.BE;
        const { simulatieDatum, simulatieLeeftijdP1, simulatieLeeftijdP2 } = getSimulationInfo(vals);

        P.forEach((p, index) => {
            const simulatieLeeftijd = (index === 0) ? simulatieLeeftijdP1 : simulatieLeeftijdP2;
            const s=p.salary||0, b=p.business||0; const pP=p.pensionPublic||0, pPr=p.pensionPrivate||0;
            const l=p.lijfrente||0, iW=p.incomeWealth||0; const aY=p.aowYears||0; const beP=p.bePension||0;

            const aDI=getAOWDateInfo(p.birthYear); const aM=new Date((p.birthYear||1900)+aDI.years,(p.birthMonth||1)-1+aDI.months);
            const isPensioner = simulatieLeeftijd !== null && simulatieDatum >= aM;
            const isWorking = simulatieLeeftijd !== null && simulatieDatum < aM;
            const lDN=p.lijfrenteDuration?Number(p.lijfrenteDuration):999;
            const lijfrenteStartAgeVal = p.lijfrenteStartAge === 'aow' ? (aDI.years + Math.floor(aDI.months / 12)) : parseInt(p.lijfrenteStartAge || '999', 10);
            const lijfrenteIsActive = simulatieLeeftijd !== null && simulatieLeeftijd >= lijfrenteStartAgeVal && simulatieLeeftijd < lDN;

            const loon = isWorking ? s : 0; const winst = isWorking ? b : 0;
            const rW=loon*(PB.SOCIALE_LASTEN.WERKNEMER_RSZ_PERCENTAGE||0); const nettoLoonVoorKosten=loon-rW; tSL+=rW; tBI_voor_kosten+=nettoLoonVoorKosten;
            if (index === 0) p1LoonVoorKosten = nettoLoonVoorKosten; else p2LoonVoorKosten = nettoLoonVoorKosten;
            let rZ=0; if(winst>0){let iR=winst,vG=0; (PB.SOCIALE_LASTEN.ZELFSTANDIGE_SCHIJVEN||[]).forEach(sch=>{const cG=Number(sch.grens);let bIS=Math.max(0,Math.min(iR,cG-vG));rZ+=bIS*sch.tarief;iR-=bIS;vG=cG;});} const nettoWinstVoorKosten=winst-rZ; tSL+=rZ; tBI_voor_kosten+=nettoWinstVoorKosten;
            tB+=loon+winst;

            const cAOW=isPensioner?(aY/50)*(vals.isCouple?PARAMS.AOW_BRUTO_COUPLE:PARAMS.AOW_BRUTO_SINGLE):0; const cABP=isPensioner?pP:0; const cP=isPensioner?pPr:0; const cL=lijfrenteIsActive?l:0;
            const cBEP = isPensioner ? beP : 0; brutoBePension += cBEP;
            if(cABP>0){nPNLB+=cABP;} const tOP=cAOW+cP+cL;
            // Alle NL particuliere pensioenen/lijfrentes (niet-overheid) tellen mee in BE belastbare basis
            tBI_voor_kosten+=tOP;
            tB+=cABP+tOP+cBEP; tIV+=iW;
        });

        const rizivP = PB.SOCIALE_LASTEN.PENSIOEN_RIZIV_PERCENTAGE||0; const solidP = PB.SOCIALE_LASTEN.PENSIOEN_SOLIDARITEIT_PERCENTAGE||0;
        const rizivBijdrage = brutoBePension * rizivP; const solidBijdrage = brutoBePension * solidP;
        bePensionContrib = rizivBijdrage + solidBijdrage; tSL += bePensionContrib;
        const nettoBePension = brutoBePension - bePensionContrib;

        const nlTR=PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0]||0; const nINL=nPNLB*(1-nlTR);
        tB+=nPNLB+tIV; // Final Total Gross

        const maxKostenPP = PB.INKOMSTENBELASTING.FORFAIT_BEROEPSKOSTEN_WERKNEMER_MAX||0;
        const kostenPercentage = PB.INKOMSTENBELASTING.FORFAIT_BEROEPSKOSTEN_WERKNEMER_PERCENTAGE||0;
        let forfaitKosten = 0;
        if (vals.p1) forfaitKosten += Math.min(p1LoonVoorKosten * kostenPercentage, maxKostenPP);
        if (vals.p2 && isCouple) forfaitKosten += Math.min(p2LoonVoorKosten * kostenPercentage, maxKostenPP);

        const tBI_na_kosten = Math.max(0, tBI_voor_kosten - forfaitKosten);
        const totaalBelastbaarInkomen = tBI_na_kosten + nettoBePension;

        // RV
        const spaarRenteDeel=tIV/2, overigRenteDividendDeel=tIV/2; const vrijstSpaarPP=PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_VRIJSTELLING_SPAAR_PP||0; const vrijstSpaarTotaal=vrijstSpaarPP*(vals.isCouple?2:1); const belasteSpaarRente=Math.max(0,spaarRenteDeel-vrijstSpaarTotaal); const rvSpaar=belasteSpaarRente*(PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_TARIEF_SPAAR||0);
        const dividendDeelOverig=overigRenteDividendDeel/2, renteDeelOverig=overigRenteDividendDeel/2; const vrijstDividendPP=PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_VRIJSTELLING_DIVIDEND_PP||0; const vrijstDividendTotaal=vrijstDividendPP*(vals.isCouple?2:1); const belastbaarDividend=Math.max(0,dividendDeelOverig-vrijstDividendTotaal); const rvOverig=(belastbaarDividend+renteDeelOverig)*(PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_TARIEF_ALGEMEEN||0); tRV=rvSpaar+rvOverig;

        // Fed. Belasting
        let fB=0, iRF=totaalBelastbaarInkomen, vGF=0; (PB.INKOMSTENBELASTING.SCHIJVEN_2025||[]).forEach(sch=>{const g=sch.grens;let bIS=Math.max(0,Math.min(iRF,g-vGF));fB+=bIS*sch.tarief;iRF-=bIS;vGF=g;});
        let tV=(PB.INKOMSTENBELASTING.BASIS_VRIJSTELLING||0)*(vals.isCouple?2:1); const nC=vals.children||0; if(nC>0){const kA=PB.INKOMSTENBELASTING.VRIJSTELLING_PER_KIND||[0,0,0]; const eK=PB.INKOMSTENBELASTING.EXTRA_VRIJSTELLING_KIND_MEER_DAN_3||0; if(nC===1)tV+=kA[0]; else if(nC===2)tV+=kA[1]; else if(nC===3)tV+=kA[2]; else if(nC>3){tV+=kA[2]+(nC-3)*eK;}}
        const lT=(PB.INKOMSTENBELASTING.SCHIJVEN_2025||[{tarief:0.25}])[0].tarief; const bK=Math.min(totaalBelastbaarInkomen,tV)*lT; fB=Math.max(0,fB-bK);
        const gB=fB*(PB.INKOMSTENBELASTING.GEMEENTEBELASTING_GEMIDDELD||0);

        // BSZB
        let bszb=0; const bszbSchijven = PB.SOCIALE_LASTEN.BIJZONDERE_BIJDRAGE_SCHIJVEN_GEZIN_2024||[];
        const gezinsInkomenVoorBSZB = tBI_voor_kosten + brutoBePension; // BSZB basis = netto inkomen voor kosten + bruto BE pensioen
        for (const schijf of bszbSchijven) { if (gezinsInkomenVoorBSZB < schijf.grens) { bszb = schijf.bijdrage; break; } bszb = schijf.bijdrage||0; }

        const totaleTax = tSL + fB + gB + tRV + bszb;
        const nt = tB - totaleTax + nINL; const wT = 0;
        return { bruto:tB, tax:totaleTax, netto:nt, wealthTax:wT, breakdown:{simulatieDatum: simulatieDatum, nettoInkomenUitNL:nINL, socialeLasten:tSL, bePensionContrib: bePensionContrib, bszb: bszb, forfaitKosten: forfaitKosten, federaleBelasting:fB, gemeentebelasting:gB, roerendeVoorheffing:tRV }};
    }

    // --- BREAKDOWN (FIXED) ---
    function generateBreakdown(vals, compare, fr) {
        try {
            if (!vals || !compare || !fr || !compare.breakdown || !fr.breakdown) { return "Fout: Analyse data incompleet."; }
            const wf=vals.wealthFinancial||0, wp=vals.wealthProperty||0; const est=wf+wp; const nlTR=PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0]||0;
            const tIV = (vals.p1?.incomeWealth || 0) + (vals.p2?.incomeWealth || 0);
            
            const { simulatieDatum } = compare.breakdown; // Haal sim datum uit breakdown
            const simDatumStr = (inputs.simYear.value && inputs.simMonth.value) ? `per ${simulatieDatum.toLocaleString('nl-NL', { month: 'long', year: 'numeric' })}` : '(huidige situatie)';

            const getRetirementProjection = (p, idx) => { if(!p||!p.birthYear)return''; const aDI=getAOWDateInfo(p.birthYear); const aM=new Date((p.birthYear||1900)+aDI.years,(p.birthMonth||1)-1+aDI.months); const pL=vals.isCouple?`(P${idx+1})`:''; if(!simulatieDatum) return ''; if(simulatieDatum<aM){const n=simulatieDatum; let yD=aM.getFullYear()-n.getFullYear();let mD=aM.getMonth()-n.getMonth();if(mD<0){yD--;mD+=12;}return `\n    ↳ Wett. Pensioen${pL} over ${yD}j,${mD}m`;} return `\n    ↳ Wett. Pensioen${pL} loopt`; };
            const projP1 = getRetirementProjection(vals.p1, 0); const projP2 = vals.p2 ? getRetirementProjection(vals.p2, 1) : '';
            let compTitle = "...", compContent = "...";

            if (activeComparison === 'NL') {
                const vS=PARAMS.NL?.BOX3?.VRIJSTELLING_SINGLE||0, vC=PARAMS.NL?.BOX3?.VRIJSTELLING_COUPLE||0;
                const zvwP1 = (vals.p1?.business||0) > 0 ? (vals.p1.business * (1-(PARAMS.NL.BOX1.MKB_WINSTVRIJSTELLING||0))) * (PARAMS.NL.SOCIALE_LASTEN.ZVW_PERCENTAGE||0) : 0;
                const zvwP2 = (vals.p2?.business||0) > 0 ? (vals.p2.business * (1-(PARAMS.NL.BOX1.MKB_WINSTVRIJSTELLING||0))) * (PARAMS.NL.SOCIALE_LASTEN.ZVW_PERCENTAGE||0) : 0;
                compTitle = `Nederland 🇳🇱 ${simDatumStr}`;
                compContent = `1. Bruto Inkomen Totaal: ${formatCurrency(compare.bruto)}
2. Geschatte Lasten: ${formatCurrency(compare.tax)}
   ↳ IB (Box 1): ${formatCurrency(compare.tax - zvwP1 - zvwP2)} (incl. AHK/AK, soc. lasten werkn./pens.)
   ↳ Zvw (ondernemers): ${formatCurrency(zvwP1 + zvwP2)}
3. Netto Inkomen: ${formatCurrency(compare.netto)}

4. Vermogen (Box 3):
   - Financieel: ${formatCurrency(wf)} (Vrijst.: ${formatCurrency(vals.isCouple ? vC : vS)})
   ↳ Aanslag: ${formatCurrency(compare.wealthTax)} (${((PARAMS.NL.BOX3.FORFAITAIR_RENDEMENT||0)*100).toFixed(2)}% fictief rend.)`;
            }
            else if (activeComparison === 'BE') {
                const div=(1-nlTR); const bNP=div!==0?(compare.breakdown.nettoInkomenUitNL||0)/div:0;
                compTitle = `België 🇧🇪 ${simDatumStr}`;
                compContent = `1. Bruto Inkomen Totaal: ${formatCurrency(compare.bruto)}
   (Incl. NL pensioen bruto*: ${formatCurrency(bNP)})
2. Sociale Lasten: ${formatCurrency(compare.breakdown.socialeLasten||0)}
   ↳ RSZ Werknemer (13,07%): -${formatCurrency((compare.breakdown.socialeLasten||0) - (compare.breakdown.bePensionContrib||0) - (compare.breakdown.bszb||0) )}
   ↳ RIZIV (3,55%) + Solid. (~1%) op BE pensioen: -${formatCurrency(compare.breakdown.bePensionContrib||0)}
   ↳ Bijz. Soc. Zekerheidsbijdrage (BSZB): -${formatCurrency(compare.breakdown.bszb||0)}
   = Subtotaal na SZ: ${formatCurrency(compare.bruto - (compare.breakdown.socialeLasten||0))}
3. Beroepskosten (Forfait werknemer): -${formatCurrency(compare.breakdown.forfaitKosten||0)}
   = Belastbaar Inkomen: ${formatCurrency(compare.bruto - (compare.breakdown.socialeLasten||0) - (compare.breakdown.forfaitKosten||0))}
4. Belastingen: ${formatCurrency((compare.breakdown.federaleBelasting||0)+(compare.breakdown.gemeentebelasting||0)+(compare.breakdown.roerendeVoorheffing||0))}
   ↳ Fed. PB (na vrije som korting): ${formatCurrency(compare.breakdown.federaleBelasting||0)}
   ↳ Gem. Belast. (~${((PARAMS.BE.INKOMSTENBELASTING.GEMEENTEBELASTING_GEMIDDELD||0)*100).toFixed(1)}% op Fed. PB): +${formatCurrency(compare.breakdown.gemeentebelasting||0)}
   ↳ Roerende Voorheffing: +${formatCurrency(compare.breakdown.roerendeVoorheffing||0)} (30% alg./15% spaar > vrijst.)
5. Totale Lasten (SZ + Belastingen): ${formatCurrency(compare.tax)}
6. Netto Inkomen: ${formatCurrency(compare.netto)}

7. Vermogen: Aanslag: ${formatCurrency(compare.wealthTax)} (Geen alg. vermogensbelasting)
* NL pensioen >€25k/jaar of overheidspensioen wordt in NL belast.`;
            }

            // --- FRANSE BREAKDOWN (FIXED) ---
            // Haal de benodigde waarden uit het 'fr.breakdown' object
            const pfuSocLasten_fr = fr.breakdown.pfuSocLasten || 0;
            const beContribAftrek_fr = fr.breakdown.beContribAftrek || 0;
            const lijfrenteSocLasten_fr = fr.breakdown.lijfrenteSocLasten || 0;
            const frSocLastenExclPFUBeLijfrente = fr.breakdown.frSocLastenInkomen || 0; // Dit was de fout
            const cakAftrek_fr = fr.breakdown.aftrekCak || 0;
            const pfuTax_fr = fr.breakdown.pfuTax || 0;
            const ibTax_fr = (fr.breakdown.tax || 0) - pfuTax_fr;
            const belastingKrediet_fr = fr.breakdown.belastingKrediet || 0;
            const belastbaarInkomen_fr = (fr.breakdown.brutoInFR || 0) - frSocLastenExclPFUBeLijfrente - beContribAftrek_fr - cakAftrek_fr - (fr.breakdown.lijfrenteBruto || 0) + (fr.breakdown.lijfrenteBelastbaar || 0);

            return `
Analyse ${activeComparison}-FR | ${vals.isCouple?'Partners':'Alleenst.'}, Kind:${vals.children||0} | Verm: ${formatCurrency(est)} (${formatCurrency(wf)} fin/${formatCurrency(wp)} vast) ${projP1}${projP2}
Simulatiedatum: ${simDatumStr}
----------------------------------------------------------------------------------------------------
${compTitle}
${compContent}
----------------------------------------------------------------------------------------------------
Frankrijk 🇫🇷 ${simDatumStr}
1. Bruto Inkomen Totaal: ${formatCurrency(fr.bruto)}
   ↳ Inkomen belast in FR: ${formatCurrency(fr.breakdown.brutoInFR||0)} (Incl. bruto lijfrente: ${formatCurrency(fr.breakdown.lijfrenteBruto||0)})
   ↳ Inkomen belast in Herkomstland*: ${formatCurrency(fr.breakdown.brutoInkomenVoorNLBelasting||0)} (Netto: ${formatCurrency(fr.breakdown.nettoInkomenUitNL||0)})
2. Sociale Lasten (Totaal): ${formatCurrency(fr.breakdown.socialeLasten||0)}
   ↳ FR Soc. Lasten (Inkomen): -${formatCurrency(frSocLastenExclPFUBeLijfrente)} (~9% pens, ~22% loon, ~21% winst)
   ↳ FR Soc. Lasten (Lijfrente belastb. deel): -${formatCurrency(lijfrenteSocLasten_fr)} (${((PARAMS.FR.SOCIALE_LASTEN.LIJFRENTE_TARIEF||0)*100).toFixed(1)}% op ${formatCurrency(fr.breakdown.lijfrenteBelastbaar||0)})
   ↳ FR Soc. Lasten (Vermogen PFU 17.2%): -${formatCurrency(pfuSocLasten_fr)}
   ↳ BE Soc. Lasten (Pensioen RIZIV/Solid.): -${formatCurrency(beContribAftrek_fr)} (Betaald in BE)
   = Subtotaal na SZ: ${formatCurrency(fr.bruto - (fr.breakdown.socialeLasten||0))}
3. Overige Aftrekposten FR:
   ↳ Aftrek CAK-bijdrage (NL): -${formatCurrency(cakAftrek_fr)}
   ↳ Aftrek BE pensioenbijdragen: -${formatCurrency(beContribAftrek_fr)}
   ↳ Abattement 65+ (indien van toepassing)
   = Belastbaar Inkomen FR (vóór IB): ${formatCurrency(belastbaarInkomen_fr - (/* a65plus */ 0))}
      (Lijfrente slechts deels belast: ${formatCurrency(fr.breakdown.lijfrenteBelastbaar||0)} van ${formatCurrency(fr.breakdown.lijfrenteBruto||0)})
4. Belastingen FR (Totaal): ${formatCurrency(fr.breakdown.tax||0)}
   ↳ Inkomstenbelasting (IB) na QF (${fr.breakdown.parts?.toFixed(1)||0} parts): ${formatCurrency(ibTax_fr)}
      (Resultaat na verrekening Krediet Hulp Huis: +${formatCurrency(belastingKrediet_fr)})
      (NB: QF-voordeel heeft geen effect bij laag inkomen of is geplafonneerd.)
   ↳ Belasting Verm. Inkomen (PFU 12.8%): +${formatCurrency(pfuTax_fr)}
5. Totale Lasten (SZ + Belastingen): ${formatCurrency(fr.tax)}
6. Netto Inkomen: ${formatCurrency(fr.netto)}

7. Vermogen (IFI):
   - Vastgoed: ${formatCurrency(wp)} (> €1.3M belast, excl. hoofd)
   ↳ Aanslag: ${formatCurrency(fr.wealthTax)}
* Ovh. pensioen/NL pensioen >€25k bij wonen in BE (regel uit NL-BE verdrag, kan afwijken voor FR).
        `;
        } catch (error) {
            console.error("Fout in generateBreakdown:", error);
            return `Fout bij genereren analyse: ${error.message}`;
        }
    }


    // --- Start Applicatie ---
    initializeApp();

}); // Einde DOMContentLoaded listener

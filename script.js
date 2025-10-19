document.addEventListener('DOMContentLoaded', () => {
    // --- Globale variabelen ---
    let PARAMS; let isCouple = false; let initialLoad = true; let activeComparison = 'NL'; const MAX_WORK_YEARS = 50;
    let comparisonChoice, compareCountryResult, compareCountryLabel, compareCountryFlag;
    let householdType, partner2Section, inputs, outputs, valueOutputs;

    const getEl = (id) => document.getElementById(id);

    // --- Hulpfuncties ---
    function displayError(message) { console.error(message); const el=getEl('calculation-breakdown'); if(el) el.textContent=message; else document.body.innerHTML=`<p style="color:red;padding:20px;">${message}</p>`; }
    function checkSelectors() { if(!comparisonChoice||!householdType||!inputs||!outputs||!valueOutputs||!outputs.breakdown||!inputs.p1?.birthYear||!inputs.children||!outputs.compareBruto||!valueOutputs.p1?.aowYears){ console.error("UI elements missing."); return false; } return true; }

    // --- Initialisatie ---
    async function initializeApp() {
        console.log("Initializing...");
        try { // 1. Load Config
            const response = await fetch('./config.json'); if (!response.ok) throw new Error(`Config load failed: ${response.status}`);
            PARAMS = await response.json(); console.log("Config loaded.");
            const fixInf = (arr) => arr?.forEach(item => { if (item.grens === "Infinity") item.grens = Infinity; });
            fixInf(PARAMS?.FR?.INKOMSTENBELASTING?.SCHIJVEN); fixInf(PARAMS?.FR?.IFI?.SCHIJVEN); fixInf(PARAMS?.BE?.INKOMSTENBELASTING?.SCHIJVEN_2025); fixInf(PARAMS?.BE?.SOCIALE_LASTEN?.BIJZONDERE_BIJDRAGE_SCHIJVEN_GEZIN_2024);
        } catch (error) { displayError(`Fout laden config: ${error.message}.`); return; }

        // 2. Select DOM Elements
        console.log("Selecting elements...");
        comparisonChoice={nl:getEl('btn-nl'),be:getEl('btn-be')}; compareCountryResult=getEl('compare-country-result'); compareCountryLabel=getEl('compare-country-label'); compareCountryFlag=getEl('compare-country-flag');
        householdType={single:getEl('btn-single'),couple:getEl('btn-couple')}; partner2Section=getEl('partner2-section');
        inputs={children:getEl('slider-children'),cak:getEl('cak-contribution'),homeHelp:getEl('home-help'),wealthFinancial:getEl('slider-wealth-financial'),wealthProperty:getEl('slider-wealth-property'),
            p1:{birthYear:getEl('birth-year-1'),birthMonth:getEl('birth-month-1'),aowYears:getEl('aow-years-1'),frWorkYears:getEl('fr-work-years-1'),bePension:getEl('slider-be-pension-1'),pensionPublic:getEl('slider-pension-public-1'),pensionPrivate:getEl('slider-pension-private-1'),lijfrente:getEl('slider-lijfrente-1'),lijfrenteDuration:getEl('lijfrente-duration-1'),incomeWealth:getEl('slider-income-wealth-1'),salary:getEl('slider-salary-1'),business:getEl('slider-business-1'),businessType:getEl('business-type-1')},
            p2:{birthYear:getEl('birth-year-2'),birthMonth:getEl('birth-month-2'),aowYears:getEl('aow-years-2'),frWorkYears:getEl('fr-work-years-2'),bePension:getEl('slider-be-pension-2'),pensionPublic:getEl('slider-pension-public-2'),pensionPrivate:getEl('slider-pension-private-2'),lijfrente:getEl('slider-lijfrente-2'),lijfrenteDuration:getEl('lijfrente-duration-2'),incomeWealth:getEl('slider-income-wealth-2'),salary:getEl('slider-salary-2'),business:getEl('slider-business-2'),businessType:getEl('business-type-2')},};
        outputs={compareBruto:getEl('compare-bruto'),compareTax:getEl('compare-tax'),compareNetto:getEl('compare-netto'),wealthTaxCompare:getEl('wealth-tax-compare'),frBruto:getEl('fr-bruto'),frTax:getEl('fr-tax'),frNetto:getEl('fr-netto'),wealthTaxFr:getEl('wealth-tax-fr'),wealthTaxFrExpl:getEl('wealth-tax-fr-expl'),conclusionBar:getEl('conclusion-bar'),conclusionValue:getEl('conclusion-value'),conclusionExpl:getEl('conclusion-expl'),estateTotalDisplay:getEl('estate-total-display'),breakdown:getEl('calculation-breakdown'),};
        valueOutputs={p1:{aowYears:getEl('value-aow-years-1'),frWorkYears:getEl('value-fr-work-years-1'),bePension:getEl('value-be-pension-1'),pensionPublic:getEl('value-pension-public-1'),pensionPrivate:getEl('value-pension-private-1'),lijfrente:getEl('value-lijfrente-1'),incomeWealth:getEl('value-income-wealth-1'),salary:getEl('value-salary-1'),business:getEl('value-business-1')},p2:{aowYears:getEl('value-aow-years-2'),frWorkYears:getEl('value-fr-work-years-2'),bePension:getEl('value-be-pension-2'),pensionPublic:getEl('value-pension-public-2'),pensionPrivate:getEl('value-pension-private-2'),lijfrente:getEl('value-lijfrente-2'),incomeWealth:getEl('value-income-wealth-2'),salary:getEl('value-salary-2'),business:getEl('value-business-2')},children:getEl('value-children'),wealthFinancial:getEl('value-wealth-financial'),wealthProperty:getEl('value-wealth-property'),};

        // 3. Check Selectors
        if (!checkSelectors()) { displayError("Init mislukt: Kon UI-elementen niet vinden."); return; }
        console.log("DOM elements selected.");

        // 4. Setup
        populateDateDropdowns(); setupListeners();
        updateHouseholdType(false); updateComparisonCountry('NL'); // Triggers first calculation
        console.log("Application initialized.");
    }

    // --- Core Functions ---
     const formatCurrency = (amount, withSign = false) => { /* ... (identiek) ... */ const s=amount>0?'+':amount<0?'−':''; const r=Math.round(Math.abs(amount)); return `${withSign?s+' ':''}€ ${r.toLocaleString('nl-NL')}`; };
     function populateDateDropdowns() { /* ... (identiek) ... */ if(!inputs?.p1?.birthYear||!inputs?.p2?.birthYear)return; const cY=new Date().getFullYear();const M=["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"]; [inputs.p1,inputs.p2].forEach(p=>{if(!p||!p.birthYear||!p.birthMonth)return; const yS=p.birthYear,mS=p.birthMonth;if(yS.options.length>0)return; yS.innerHTML='';mS.innerHTML=''; for(let y=cY-18;y>=1940;y--){const o=new Option(y,y);if(y===1960)o.selected=true; yS.add(o);} M.forEach((m,i)=>mS.add(new Option(m,i+1))); }); }
     function getAOWDateInfo(birthYear) { /* ... (identiek) ... */ if(!birthYear||birthYear<1940)return{years:67,months:0}; if(birthYear<=1957)return{years:66,months:4}; if(birthYear===1958)return{years:66,months:7}; if(birthYear===1959)return{years:66,months:10}; return{years:67,months:0}; }
     function setupListeners() { /* ... (identiek) ... */ if(!comparisonChoice||!householdType)return; if(comparisonChoice.nl)comparisonChoice.nl.addEventListener('click',()=>updateComparisonCountry('NL')); if(comparisonChoice.be)comparisonChoice.be.addEventListener('click',()=>updateComparisonCountry('BE')); if(householdType.single)householdType.single.addEventListener('click',()=>updateHouseholdType(false)); if(householdType.couple)householdType.couple.addEventListener('click',()=>updateHouseholdType(true)); const rb=getEl('reset-btn'); if(rb){rb.addEventListener('click',()=>{if(!inputs?.p1?.birthYear)return; document.querySelectorAll('input[type="range"]').forEach(i=>{if(i)i.value=0;}); document.querySelectorAll('input[type="checkbox"]').forEach(i=>{if(i)i.checked=false;}); document.querySelectorAll('select:not([id*="birth"])').forEach(s=>{if(s)s.selectedIndex=0;}); if(inputs.p1.birthYear)inputs.p1.birthYear.value=1960; if(inputs.p2.birthYear)inputs.p2.birthYear.value=1960; initialLoad=true; updateHouseholdType(false);updateComparisonCountry('NL');});} const cb=getEl('copy-btn'); if(cb){cb.addEventListener('click',()=>{const txt=outputs?.breakdown?.textContent||''; if(txt&&!txt.includes("Welkom")){navigator.clipboard.writeText(txt).then(()=>{cb.textContent='Gekopieerd!';setTimeout(()=>{cb.textContent='📋 Kopieer Analyse';},2000);}).catch(err=>{console.error('Kopieerfout:',err);alert('Kopiëren mislukt.');});}else{alert("Genereer analyse.");}}); } const ic=getEl('input-panel'); if(ic){ic.addEventListener('input',(e)=>{if(e.target.matches('input, select')){if(e.target.id.includes('aow-years')||e.target.id.includes('fr-work-years')){adjustWorkYears(e.target.id);}updateScenario();}});}else{console.error("#input-panel missing!");} }
     function toggleCountrySpecificFields(countryCode) { /* ... (identiek) ... */ document.querySelectorAll('.nl-specific').forEach(el=>el.style.display=(countryCode==='NL'?'':'none')); document.querySelectorAll('.be-specific').forEach(el=>el.style.display=(countryCode==='BE'?'':'none')); document.querySelectorAll('.hide-for-be').forEach(el=>el.style.display=(countryCode==='BE'?'none':'')); }
     function updateComparisonCountry(countryCode) { /* ... (identiek) ... */ if(!comparisonChoice?.nl||!comparisonChoice?.be||!compareCountryLabel||!compareCountryFlag||!compareCountryResult)return; activeComparison=countryCode; comparisonChoice.nl.classList.toggle('active',activeComparison==='NL'); comparisonChoice.be.classList.toggle('active',activeComparison==='BE'); if(activeComparison==='NL'){compareCountryLabel.textContent="Als u in Nederland woont"; compareCountryFlag.textContent="🇳🇱"; compareCountryResult.style.borderColor="var(--primary-color)";}else if(activeComparison==='BE'){compareCountryLabel.textContent="Als u in België woont"; compareCountryFlag.textContent="🇧🇪"; compareCountryResult.style.borderColor="#FDDA25";} toggleCountrySpecificFields(activeComparison); updateScenario(); }
     function updateHouseholdType(setToCouple) { /* ... (identiek) ... */ if(!householdType?.single||!householdType?.couple||!partner2Section||!inputs?.p2)return; isCouple=setToCouple; householdType.single.classList.toggle('active',!isCouple); householdType.couple.classList.toggle('active',isCouple); partner2Section.style.display=isCouple?'flex':'none'; if(!isCouple){Object.keys(inputs.p2).forEach(key=>{const el=inputs.p2[key]; if(el&&(el.matches('input[type="range"]')||el.matches('input[type="checkbox"]')||el.matches('select:not([id*="birth"])'))){if(el.type==='range')el.value=0; if(el.type==='checkbox')el.checked=false; if(el.tagName==='SELECT')el.selectedIndex=0;}}); } updateScenario(); }
     function getPartnerInput(partnerId) { // Added bePension
        if (!inputs || !inputs[partnerId] || !inputs[partnerId].birthYear) { console.error(`Partner data missing for ${partnerId}`); return null; }
        const p = inputs[partnerId]; const getNum = (el) => el ? Number(el.value) : 0; const getStr = (el, defaultVal) => el ? el.value : defaultVal;
        return { birthYear: getNum(p.birthYear), birthMonth: getNum(p.birthMonth), aowYears: getNum(p.aowYears), frWorkYears: getNum(p.frWorkYears), bePension: getNum(p.bePension), pensionPublic: getNum(p.pensionPublic), pensionPrivate: getNum(p.pensionPrivate), lijfrente: getNum(p.lijfrente), lijfrenteDuration: getNum(p.lijfrenteDuration), incomeWealth: getNum(p.incomeWealth), salary: getNum(p.salary), business: getNum(p.business), businessType: getStr(p.businessType, 'services') };
     }
     function adjustWorkYears(changedSliderId) { /* ... (identiek) ... */ if(!inputs?.p1?.aowYears||!inputs?.p2?.aowYears)return; const adj=(aS,fS)=>{if(!aS||!fS)return; let aV=Number(aS.value),fV=Number(fS.value); if(aV+fV>MAX_WORK_YEARS){if(changedSliderId===aS.id){fV=MAX_WORK_YEARS-aV;fS.value=fV;}else{aV=MAX_WORK_YEARS-fV;aS.value=aV;}}}; if(changedSliderId.includes('-1')){adj(inputs.p1.aowYears,inputs.p1.frWorkYears);}else if(changedSliderId.includes('-2')&&isCouple){adj(inputs.p2.aowYears,inputs.p2.frWorkYears);} updateValueOutputsForYears(); }
     function updateValueOutputsForYears() { /* ... (identiek) ... */ if(!valueOutputs?.p1||!valueOutputs?.p2||!inputs?.p1||!inputs?.p2)return; if(valueOutputs.p1.aowYears&&inputs.p1.aowYears)valueOutputs.p1.aowYears.textContent=inputs.p1.aowYears.value; if(valueOutputs.p1.frWorkYears&&inputs.p1.frWorkYears)valueOutputs.p1.frWorkYears.textContent=inputs.p1.frWorkYears.value; if(valueOutputs.p1.bePension&&inputs.p1.bePension)valueOutputs.p1.bePension.textContent=formatCurrency(inputs.p1.bePension.value); if(isCouple){ if(valueOutputs.p2.aowYears&&inputs.p2.aowYears)valueOutputs.p2.aowYears.textContent=inputs.p2.aowYears.value; if(valueOutputs.p2.frWorkYears&&inputs.p2.frWorkYears)valueOutputs.p2.frWorkYears.textContent=inputs.p2.frWorkYears.value; if(valueOutputs.p2.bePension&&inputs.p2.bePension)valueOutputs.p2.bePension.textContent=formatCurrency(inputs.p2.bePension.value); } } // Added bePension update
     function updateScenario() {
        if (!PARAMS || !inputs || !outputs || !valueOutputs || !checkSelectors()) { console.warn("UpdateScenario called too early."); if(outputs?.breakdown) outputs.breakdown.textContent="Laden..."; return; }
        try {
            const p1Input = getPartnerInput('p1'); if (!p1Input) throw new Error("P1 data invalid.");
            const p2Input = isCouple ? getPartnerInput('p2') : null; if (isCouple && !p2Input) throw new Error("P2 data invalid.");
            const inputValues = { isCouple, children: Number(inputs.children?.value||0), cak: !!inputs.cak?.checked, homeHelp: Number(inputs.homeHelp?.value||0), wealthFinancial: Number(inputs.wealthFinancial?.value||0), wealthProperty: Number(inputs.wealthProperty?.value||0), p1: p1Input, p2: p2Input };
            inputValues.estate = inputValues.wealthFinancial + inputValues.wealthProperty;

            // Update tooltips & values
            [ { p: p1Input, elData: inputs.p1 }, { p: p2Input, elData: inputs.p2 } ].forEach(item => { if (item.p && item.elData?.aowYears) { const max=50; item.elData.aowYears.max=max; const cur=Number(item.elData.aowYears.value||0); item.p.aowYears = Math.min(cur, max); if(cur>max) item.elData.aowYears.value=max; const tt=item.elData.aowYears.closest('.form-group')?.querySelector('.tooltip'); if(tt) tt.dataset.text=`Jaren AOW (max ${max}). EU-jaren max 50.`; } }); // Shorter tooltip
            Object.keys(valueOutputs.p1 || {}).forEach(k => { if(valueOutputs.p1[k] && p1Input && p1Input[k]!==undefined) valueOutputs.p1[k].textContent = ['aowYears','frWorkYears'].includes(k) ? p1Input[k] : formatCurrency(p1Input[k]); });
            if(isCouple && p2Input) { Object.keys(valueOutputs.p2 || {}).forEach(k => { if(valueOutputs.p2[k] && p2Input[k]!==undefined) valueOutputs.p2[k].textContent = ['aowYears','frWorkYears'].includes(k) ? p2Input[k] : formatCurrency(p2Input[k]); }); }
            if(valueOutputs.children) valueOutputs.children.textContent=inputValues.children; if(valueOutputs.wealthFinancial) valueOutputs.wealthFinancial.textContent=formatCurrency(inputValues.wealthFinancial); if(valueOutputs.wealthProperty) valueOutputs.wealthProperty.textContent=formatCurrency(inputValues.wealthProperty); if(outputs.estateTotalDisplay) outputs.estateTotalDisplay.textContent=formatCurrency(inputValues.estate);
            updateValueOutputsForYears(); // Update year/BE pension values

            // Calculations
            let compareResults = { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} };
            if (activeComparison === 'NL') { compareResults = calculateNetherlands(inputValues); }
            else if (activeComparison === 'BE') { compareResults = calculateBelgium(inputValues); }
            const frResults = calculateFrance(inputValues);

            // Update UI
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
        P.forEach(p=>{ const aDI=getAOWDateInfo(p.birthYear); const aM=new Date((p.birthYear||1900)+aDI.years,(p.birthMonth||1)-1+aDI.months); const iP=new Date()>aM; const cA=new Date().getFullYear()-(p.birthYear||1900); const lDN=p.lijfrenteDuration?Number(p.lijfrenteDuration):999; const lIA=cA<lDN; const cP=iP?(p.pensionPublic||0)+(p.pensionPrivate||0)+(lIA?(p.lijfrente||0):0):0; const cAOW=iP?(Number(p.aowYears||0)/50)*(vals.isCouple?PARAMS.AOW_BRUTO_COUPLE:PARAMS.AOW_BRUTO_SINGLE):0; const r=calculateNLNetto(cAOW+cP,p.salary||0,p.business||0,iP); cB+=r.bruto;cT+=r.tax;cN+=r.netto;});
        const v=vals.isCouple?PARAMS.NL.BOX3.VRIJSTELLING_COUPLE:PARAMS.NL.BOX3.VRIJSTELLING_SINGLE; const wT=Math.max(0,(vals.wealthFinancial||0)-v)*PARAMS.NL.BOX3.FORFAITAIR_RENDEMENT*PARAMS.NL.BOX3.TARIEF; return {bruto:cB, tax:cT, netto:cN, wealthTax:wT, breakdown: {}};
    }
     function calculateNLNetto(pI, s, b, iA) {
        if (!PARAMS.NL) return { bruto: 0, tax: 0, netto: 0 }; const wNV=b*(1-PARAMS.NL.BOX1.MKB_WINSTVRIJSTELLING); const zB=b>0?wNV:0; const z=zB*PARAMS.NL.SOCIALE_LASTEN.ZVW_PERCENTAGE; const br=pI+s+wNV; if(br<=0&&z<=0)return{bruto:0,tax:0,netto:0}; if(br<=0&&z>0)return{bruto:0,tax:z,netto:-z}; let t=0; const T=iA?PARAMS.NL.BOX1.TARIEVEN_BOVEN_AOW:PARAMS.NL.BOX1.TARIEVEN_ONDER_AOW; const gS1=PARAMS.NL.BOX1.GRENS_SCHIJF_1; if(br<=gS1){t=br*T[0];}else{t=(gS1*T[0])+((br-gS1)*T[1]);} let aK=(s>0||b>0?PARAMS.NL.BOX1.ARBEIDSKORTING_MAX:0); let alK=PARAMS.NL.BOX1.ALGEMENE_HEFFINGSKORTING_MAX; const hAS=PARAMS.NL.BOX1.HK_AFBOUW_START; if(br>hAS){alK=Math.max(0,PARAMS.NL.BOX1.ALGEMENE_HEFFINGSKORTING_MAX-((br-hAS)*PARAMS.NL.BOX1.HK_AFBOUW_FACTOR));} if(br>=gS1){alK=0;} const akAS=39957; if(br>akAS){aK=Math.max(0,PARAMS.NL.BOX1.ARBEIDSKORTING_MAX-((br-akAS)*0.0651));} t=t-alK-aK; t=Math.max(0,t); const tT=t+z; return {bruto:br, tax:tT, netto:br-tT};
    }

    // --- FRANKRIJK ---
    function calculateFrance(vals) {
        if (!PARAMS.FR || !PARAMS.NL || !PARAMS.BE) return { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} };
        let bINLB=0, tA=0, tPP=0, tL=0, tLo=0, tW=0, iPH=false;
        let tBFA={services:0, rental:0}; let tEY=0;
        let totalBePension = 0, totalBePensionContributions = 0; // For BE->FR deduction
        const P=[vals.p1, vals.p2].filter(p=>p);

        P.forEach(p=>{
            const aDI=getAOWDateInfo(p.birthYear); const aM=new Date((p.birthYear||1900)+aDI.years,(p.birthMonth||1)-1+aDI.months); const iP=new Date()>aM; if(iP)iPH=true;
            const cA=new Date().getFullYear()-(p.birthYear||1900); const lDN=p.lijfrenteDuration?Number(p.lijfrenteDuration):999; const lIA=cA<lDN;
            tEY+=Number(p.aowYears||0)+Number(p.frWorkYears||0);
            bINLB+=iP?(p.pensionPublic||0):0; tA+=iP?(Number(p.aowYears||0)/50)*(vals.isCouple?PARAMS.AOW_BRUTO_COUPLE:PARAMS.AOW_BRUTO_SINGLE):0;
            tPP+=iP?(p.pensionPrivate||0):0; tL+=iP&&lIA?(p.lijfrente||0):0;
            tLo+=p.salary||0; tW+=p.business||0; tBFA[p.businessType||'services']+=(p.business||0);
            // Collect BE pension data for FR calculation
            const bePensionBruto = p.bePension || 0;
            if (iP && bePensionBruto > 0) {
                totalBePension += bePensionBruto;
                totalBePensionContributions += bePensionBruto * (PARAMS.BE.SOCIALE_LASTEN.PENSIOEN_RIZIV_PERCENTAGE + PARAMS.BE.SOCIALE_LASTEN.PENSIOEN_SOLIDARITEIT_PERCENTAGE);
            }
        });

        const fPR=tEY>=PARAMS.FR_PENSION_YEARS_REQUIRED?PARAMS.FR_PENSION_RATE:PARAMS.FR_PENSION_RATE*(tEY/(PARAMS.FR_PENSION_YEARS_REQUIRED||1));
        const tFWY=(vals.p1?.frWorkYears||0)+(vals.p2?.frWorkYears||0); const fSP=(PARAMS.FR_PENSION_YEARS_REQUIRED||1)>0?(tFWY/(PARAMS.FR_PENSION_YEARS_REQUIRED||1))*PARAMS.FR_PENSION_AVG_SALARY*fPR:0; const fSPA=iPH?fSP:0;
        const tIV=(vals.p1?.incomeWealth||0)+(vals.p2?.incomeWealth||0); const pT=tIV*PARAMS.FR.INKOMSTENBELASTING.PFU_TARIEF; const pSL=tIV*PARAMS.FR.SOCIALE_LASTEN.PFU;
        const nlTR=PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0]||0.1907; const nINL=bINLB*(1-nlTR);
        // Add BE pension to FR income totals
        const tPIF=tA+tPP+tL+fSPA + totalBePension; // Include BE pension here
        const sLP=(tA+tPP+tL+fSPA)*PARAMS.FR.SOCIALE_LASTEN.PENSIOEN; // FR SocLast only on non-BE pensions
        const sLS=tLo*PARAMS.FR.SOCIALE_LASTEN.SALARIS; const sLW=(tBFA.services*PARAMS.FR.SOCIALE_LASTEN.WINST_DIENSTEN)+(tBFA.rental*PARAMS.FR.SOCIALE_LASTEN.WINST_VERHUUR);
        const tSL = sLP + sLS + sLW; // FR SocLast excluding BE pension contrib

        const wNA=(tBFA.services*(1-PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_WINST_DIENSTEN))+(tBFA.rental*(1-PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_WINST_VERHUUR));
        // Start belastbaar inkomen: include BE pension, subtract FR soc lasten
        let bI=(tPIF+tLo+wNA)-tSL;
        // --- NIEUW: Aftrek Belgische Bijdragen ---
        bI -= totalBePensionContributions;
        const aC=vals.cak?PARAMS.FR.CAK_BIJDRAGE_GEMIDDELD:0; bI-=aC;
        let a65=0; if(iPH){const aP=P.filter(p=>{const aI=getAOWDateInfo(p.birthYear);const aMo=new Date((p.birthYear||1900)+aI.years,(p.birthMonth||1)-1+aI.months);return new Date()>aMo;}).length; const iBFA=tPIF; const d1=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.DREMPEL1; const d2=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.DREMPEL2; const af1=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.AFTREK1; const af2=PARAMS.FR.INKOMSTENBELASTING.ABATTEMENT_65PLUS.AFTREK2; if(iBFA<=d1*aP){a65=af1*aP;}else if(iBFA<=d2*aP){a65=af2*aP;}} bI-=a65;
        const parts=(vals.isCouple?2:1)+(vals.children>2?(vals.children-2)*1+1:(vals.children||0)*0.5); const iPP=parts>0?Math.max(0,bI)/parts:0;
        let bPP=0,vG=0; PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN.forEach(s=>{const cG=s.grens===Infinity?Infinity:Number(s.grens); bPP+=Math.max(0,Math.min(iPP,cG)-vG)*s.tarief; vG=cG;});
        let tax = bPP * parts;
        const bP = vals.isCouple ? 2 : 1; const cP = parts - bP; let tWC = 0;
        if (cP > 0 && bP > 0) { const iPB = Math.max(0, bI) / bP; vG = 0; PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN.forEach(s=>{const cG=s.grens===Infinity?Infinity:Number(s.grens); tWC+=Math.max(0,Math.min(iPB,cG)-vG)*s.tarief; vG=cG;}); tWC*=bP; const mV=cP*2*PARAMS.FR.INKOMSTENBELASTING.QUOTIENT_PLAFOND_PER_HALF_PART; const cA=tWC-tax; if (cA > mV) { tax = tWC - mV; } }
        const bK=(vals.homeHelp||0)*PARAMS.FR.HULP_AAN_HUIS_KREDIET_PERCENTAGE; tax=tax-bK;
        const bIF=tPIF+tLo+tW+tIV; const br=bIF+bINLB; // Bruto = Alle FR + NL ovh pensioen
        const tIF = tSL + pSL + pT + totalBePensionContributions + Math.max(0,tax); // Totale lasten = FR soclast + PFU soclast + PFU tax + BE soclast + FR IB
        const nt = (bIF - (tSL + pSL + pT + totalBePensionContributions)) + nINL - Math.max(0,tax) + (tax<0?Math.abs(tax):0); // Netto = (Bruto IN FR - alle lasten behalve FR IB) + Netto NL ovh - FR IB (+ evt teruggave)
        let wT=0; const wPN=vals.wealthProperty||0; if(wPN>PARAMS.FR.IFI.DREMPEL_START){let tA=wPN;wT=0;let pL=800000;for(const s of PARAMS.FR.IFI.SCHIJVEN){const cG=s.grens===Infinity?Infinity:Number(s.grens);if(tA<=pL)break; const aIS=Math.max(0,Math.min(tA,cG)-pL); wT+=aIS*s.tarief; pL=cG; if(tA<=cG)break;}}
        return {bruto:br,tax:tIF,netto:nt,wealthTax:wT, breakdown:{socialeLasten:tSL+pSL+totalBePensionContributions, aftrekCak:aC, beContribAftrek: totalBePensionContributions, belastingKrediet:bK,tax:Math.max(0,tax)+pT,calculatedTaxIB:tax,parts:parts,nettoInkomenUitNL:nINL,brutoInFR:bIF,brutoInkomenVoorNLBelasting:bINLB,frStatePension:fSPA}};
    }

    // --- BELGIË ---
    function calculateBelgium(vals) {
        if (!PARAMS.BE || !PARAMS.NL) return { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} };
        let tB=0, tBI_voor_kosten=0, tSL=0, tIV=0, tRV=0, nPNLB=0;
        let brutoBePension=0, bePensionContrib=0, tLoonInkomenVoorKosten=0; // Added tLoonInkomen
        const P=[vals.p1, vals.p2].filter(p=>p); const PB=PARAMS.BE;

        P.forEach(p=>{
            const s=p.salary||0, b=p.business||0; const pP=p.pensionPublic||0, pPr=p.pensionPrivate||0;
            const l=p.lijfrente||0, iW=p.incomeWealth||0; const aY=p.aowYears||0; const beP=p.bePension||0;

            // Loon
            const rW=s*PB.SOCIALE_LASTEN.WERKNEMER_RSZ_PERCENTAGE; const nettoLoonVoorKosten=s-rW; tSL+=rW; tBI_voor_kosten+=nettoLoonVoorKosten; tLoonInkomenVoorKosten+=nettoLoonVoorKosten; tB+=s;
            // Zelfstandige
            let rZ=0; if(b>0){let iR=b,vG=0; PB.SOCIALE_LASTEN.ZELFSTANDIGE_SCHIJVEN.forEach(sch=>{const cG=Number(sch.grens);let bIS=Math.max(0,Math.min(iR,cG-vG));rZ+=bIS*sch.tarief;iR-=bIS;vG=cG;});} const nettoWinstVoorKosten=b-rZ; tSL+=rZ; tBI_voor_kosten+=nettoWinstVoorKosten; tB+=b;
            // Pensioenen
            const aDI=getAOWDateInfo(p.birthYear); const aM=new Date((p.birthYear||1900)+aDI.years,(p.birthMonth||1)-1+aDI.months); const iP=new Date()>aM; const cA=new Date().getFullYear()-(p.birthYear||1900); const lDN=p.lijfrenteDuration?Number(p.lijfrenteDuration):999; const lIA=cA<lDN;
            const cAOW=iP?(aY/50)*(vals.isCouple?PARAMS.AOW_BRUTO_COUPLE:PARAMS.AOW_BRUTO_SINGLE):0; const cABP=iP?pP:0; const cP=iP?pPr:0; const cL=(iP&&lIA)?l:0;
            const cBEP = iP ? beP : 0; // Belgisch pensioen alleen als gepensioneerd
            brutoBePension += cBEP; // Totaal bruto BE pensioen

            if(cABP>0){nPNLB+=cABP;} const tOP=cAOW+cP+cL; if(tOP>PB.INKOMSTENBELASTING.PENSIOEN_NL_DREMPEL_VOOR_BELASTING_IN_NL){nPNLB+=tOP;}else{tBI_voor_kosten+=tOP;} // NL Pensioen < 25k bij belastbaar voor kosten
            // Belgisch pensioen NIET bij tBI_voor_kosten, apart behandelen
            tB+=cABP+tOP+cBEP; // Bruto NL/BE pensioen
            tIV+=iW; // Vermogen inkomen
        });

        // Belgisch Pensioen Bijdragen
        const rizivBijdrage = brutoBePension * PB.SOCIALE_LASTEN.PENSIOEN_RIZIV_PERCENTAGE;
        const solidBijdrage = brutoBePension * PB.SOCIALE_LASTEN.PENSIOEN_SOLIDARITEIT_PERCENTAGE; // Vereenvoudigd 1%
        bePensionContrib = rizivBijdrage + solidBijdrage;
        tSL += bePensionContrib; // Totaal SZ lasten incl pensioenbijdragen
        const nettoBePension = brutoBePension - bePensionContrib; // Netto BE pensioen voor PB

        const nlTR=PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0]||0.1907; const nINL=nPNLB*(1-nlTR);
        tB+=nPNLB+tIV; // Totaal bruto = loon + winst + alle pensioenen + vermogen inkomen

        // Forfaitaire Beroepskosten (Alleen op netto looninkomen voor kosten)
        const maxKostenPP = PB.INKOMSTENBELASTING.FORFAIT_BEROEPSKOSTEN_WERKNEMER_MAX;
        const kostenPercentage = PB.INKOMSTENBELASTING.FORFAIT_BEROEPSKOSTEN_WERKNEMER_PERCENTAGE;
        // Bereken per partner indien koppel, anders 1x
        let forfaitKosten = 0;
        if (isCouple) {
            const kostenP1 = Math.min( (inputs.p1.salary ? (inputs.p1.salary * (1-PB.SOCIALE_LASTEN.WERKNEMER_RSZ_PERCENTAGE)) : 0) * kostenPercentage, maxKostenPP);
            const kostenP2 = Math.min( (inputs.p2.salary ? (inputs.p2.salary * (1-PB.SOCIALE_LASTEN.WERKNEMER_RSZ_PERCENTAGE)) : 0) * kostenPercentage, maxKostenPP);
            forfaitKosten = kostenP1 + kostenP2;
        } else {
             forfaitKosten = Math.min(tLoonInkomenVoorKosten * kostenPercentage, maxKostenPP);
        }

        const tBI_na_kosten = Math.max(0, tBI_voor_kosten - forfaitKosten); // Belastbaar inkomen excl BE pensioen
        const totaalBelastbaarInkomen = tBI_na_kosten + nettoBePension; // Totaal voor PB = inkomen na kosten + netto BE pensioen

        // RV
        const spaarRenteDeel=tIV/2, overigRenteDividendDeel=tIV/2; const vrijstSpaarPP=PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_VRIJSTELLING_SPAAR_PP; const vrijstSpaarTotaal=vrijstSpaarPP*(vals.isCouple?2:1); const belasteSpaarRente=Math.max(0,spaarRenteDeel-vrijstSpaarTotaal); const rvSpaar=belasteSpaarRente*PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_TARIEF_SPAAR;
        const dividendDeelOverig=overigRenteDividendDeel/2, renteDeelOverig=overigRenteDividendDeel/2; const vrijstDividendPP=PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_VRIJSTELLING_DIVIDEND_PP; const vrijstDividendTotaal=vrijstDividendPP*(vals.isCouple?2:1); const belastbaarDividend=Math.max(0,dividendDeelOverig-vrijstDividendTotaal); const rvOverig=(belastbaarDividend+renteDeelOverig)*PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_TARIEF_ALGEMEEN; tRV=rvSpaar+rvOverig;

        // Fed. Belasting
        let fB=0, iRF=totaalBelastbaarInkomen, vGF=0; PB.INKOMSTENBELASTING.SCHIJVEN_2025.forEach(sch=>{const g=sch.grens;let bIS=Math.max(0,Math.min(iRF,g-vGF));fB+=bIS*sch.tarief;iRF-=bIS;vGF=g;});
        let tV=PB.INKOMSTENBELASTING.BASIS_VRIJSTELLING*(vals.isCouple?2:1); const nC=vals.children||0; if(nC>0){const kA=PB.INKOMSTENBELASTING.VRIJSTELLING_PER_KIND; const eK=PB.INKOMSTENBELASTING.EXTRA_VRIJSTELLING_KIND_MEER_DAN_3; if(nC===1)tV+=kA[0]; else if(nC===2)tV+=kA[1]; else if(nC===3)tV+=kA[2]; else if(nC>3){tV+=kA[2]+(nC-3)*eK;}} // Aangepaste kind logica
        const lT=PB.INKOMSTENBELASTING.SCHIJVEN_2025[0].tarief; const bK=Math.min(totaalBelastbaarInkomen,tV)*lT; fB=Math.max(0,fB-bK);
        const gB=fB*PB.INKOMSTENBELASTING.GEMEENTEBELASTING_GEMIDDELD;

        // BSZB
        let bszb=0; const bszbSchijven = PB.SOCIALE_LASTEN.BIJZONDERE_BIJDRAGE_SCHIJVEN_GEZIN_2024;
        const gezinsInkomenVoorBSZB = totaalBelastbaarInkomen + forfaitKosten; // Baseer op inkomen vóór kosten voor BSZB schijven
        for (const schijf of bszbSchijven) { if (gezinsInkomenVoorBSZB < schijf.grens) { bszb = schijf.bijdrage; break; } bszb = schijf.bijdrage; } // Laatste bijdrage als max

        const totaleTax = tSL + fB + gB + tRV + bszb;
        const nt = tB - totaleTax + nINL; const wT = 0;
        return { bruto:tB, tax:totaleTax, netto:nt, wealthTax:wT, breakdown:{nettoInkomenUitNL:nINL, socialeLasten:tSL, bePensionContrib: bePensionContrib, bszb: bszb, forfaitKosten: forfaitKosten, federaleBelasting:fB, gemeentebelasting:gB, roerendeVoorheffing:tRV }};
    }

    // --- BREAKDOWN ---
    function generateBreakdown(vals, compare, fr) {
        if (!vals || !compare || !fr || !compare.breakdown || !fr.breakdown) { return "Fout: Analyse data incompleet."; }
        const wf=vals.wealthFinancial||0, wp=vals.wealthProperty||0; const est=wf+wp;
        const getRetirementProjection = (p, partnerIndex) => { if(!p)return'';const aDI=getAOWDateInfo(p.birthYear);const aM=new Date((p.birthYear||1900)+aDI.years,(p.birthMonth||1)-1+aDI.months);const pL=vals.isCouple?`(P${partnerIndex+1})`:'';if(new Date()<aM){const n=new Date();let yD=aM.getFullYear()-n.getFullYear();let mD=aM.getMonth()-n.getMonth();if(mD<0){yD--;mD+=12;}return `\n    ↳ Pensioen${pL} over ${yD}j,${mD}m`;}return `\n    ↳ Pensioen${pL} loopt`; };
        const projP1 = getRetirementProjection(vals.p1, 0); const projP2 = vals.p2 ? getRetirementProjection(vals.p2, 1) : '';
        let compTitle = "...", compContent = "...";

        if (activeComparison === 'NL') {
            const vS=PARAMS.NL?.BOX3?.VRIJSTELLING_SINGLE||0, vC=PARAMS.NL?.BOX3?.VRIJSTELLING_COUPLE||0;
            compTitle = "Nederland 🇳🇱";
            compContent = `1. Bruto Inkomen Totaal: ${formatCurrency(compare.bruto)}
2. Geschatte Lasten: ${formatCurrency(compare.tax)}
   ↳ Inkomstenbelasting (Box 1): Berekend na kortingen
   ↳ Zvw-bijdrage (ondernemers): ${formatCurrency((vals.p1?.business||0 > 0 ? (vals.p1.business * (1-PARAMS.NL.BOX1.MKB_WINSTVRIJSTELLING)) * PARAMS.NL.SOCIALE_LASTEN.ZVW_PERCENTAGE : 0) + (vals.p2?.business||0 > 0 ? (vals.p2.business * (1-PARAMS.NL.BOX1.MKB_WINSTVRIJSTELLING)) * PARAMS.NL.SOCIALE_LASTEN.ZVW_PERCENTAGE : 0))}
   (NB: Soc. lasten werknemers/pensioen grotendeels in IB schijf 1)
3. Netto Inkomen: ${formatCurrency(compare.netto)}

4. Vermogen (Box 3):
   - Financieel Vermogen: ${formatCurrency(wf)}
   - Vrijstelling: ${formatCurrency(vals.isCouple ? vC : vS)}
   ↳ Jaarlijkse Aanslag: ${formatCurrency(compare.wealthTax)} (o.b.v. ${PARAMS.NL.BOX3.FORFAITAIR_RENDEMENT*100}% fictief rendement)`;
        }
        else if (activeComparison === 'BE') {
            const nlTR=PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0]||0.1907; const div=(1-nlTR); const bNP=div!==0?(compare.breakdown.nettoInkomenUitNL||0)/div:0;
            compTitle = "België 🇧🇪";
            compContent = `1. Bruto Inkomen Totaal: ${formatCurrency(compare.bruto)}
   (Incl. NL pensioen bruto: ${formatCurrency(bNP)})
2. Sociale Lasten:
   ↳ RSZ Werknemer (13,07%): -${formatCurrency(compare.breakdown.socialeLasten - (compare.breakdown.bePensionContrib||0) - (compare.breakdown.bszb||0) )}
   ↳ Soc. Bijdr. Zelfstandige: Berekend per schijf
   ↳ RIZIV (3,55%) + Solid. (~1%) op BE pensioen: -${formatCurrency(compare.breakdown.bePensionContrib||0)}
   ↳ Bijzondere Soc. Zekerheidsbijdrage (BSZB): -${formatCurrency(compare.breakdown.bszb||0)}
   = Subtotaal na SZ: ${formatCurrency(compare.bruto - compare.breakdown.socialeLasten)}
3. Beroepskosten (Forfait werknemer 30%, max €5750 pp): -${formatCurrency(compare.breakdown.forfaitKosten||0)}
   = Belastbaar Inkomen: ${formatCurrency(compare.bruto - compare.breakdown.socialeLasten - (compare.breakdown.forfaitKosten||0))}
4. Belastingen:
   ↳ Fed. Personenbelasting (na vrijstelling): ${formatCurrency(compare.breakdown.federaleBelasting||0)}
   ↳ Gemeentebelasting (~${(PARAMS.BE.INKOMSTENBELASTING.GEMEENTEBELASTING_GEMIDDELD*100).toFixed(1)}% op Fed. PB): +${formatCurrency(compare.breakdown.gemeentebelasting||0)}
   ↳ Roerende Voorheffing: +${formatCurrency(compare.breakdown.roerendeVoorheffing||0)} (30% alg./15% spaar > vrijst.)
   = Totale Belastingen (excl. SZ): ${formatCurrency((compare.breakdown.federaleBelasting||0) + (compare.breakdown.gemeentebelasting||0) + (compare.breakdown.roerendeVoorheffing||0))}
5. Totale Lasten (SZ + Belastingen): ${formatCurrency(compare.tax)}
6. Netto Inkomen: ${formatCurrency(compare.netto)}

7. Vermogen:
   ↳ Jaarlijkse Aanslag: ${formatCurrency(compare.wealthTax)} (Geen alg. vermogensbelasting. Effectentaks >€1M niet in tool).`;
        }

        return `
Analyse ${activeComparison}-FR | ${vals.isCouple?'Partners':'Alleenst.'}, Kind:${vals.children||0} | Verm: ${formatCurrency(est)} (${formatCurrency(wf)} fin/${formatCurrency(wp)} vast) ${projP1}${projP2}
----------------------------------------------------------------------------------------------------
${compTitle}
${compContent}
----------------------------------------------------------------------------------------------------
Frankrijk 🇫🇷
1. Bruto Inkomen Totaal: ${formatCurrency(fr.bruto)}
   (Incl. NL ovh pensioen bruto: ${formatCurrency(fr.breakdown.brutoInkomenVoorNLBelasting||0)}, FR staatspensioen: ${formatCurrency(fr.breakdown.frStatePension||0)})
2. Sociale Lasten FR & BE:
   ↳ FR Soc. Lasten (~9% pens, ~22% loon, ~21% winst): -${formatCurrency((fr.breakdown.socialeLasten||0) - (fr.breakdown.beContribAftrek||0) - (PARAMS.FR.SOCIALE_LASTEN.PFU * ((vals.p1?.incomeWealth||0)+(vals.p2?.incomeWealth||0))))}
   ↳ BE Soc. Lasten op BE pensioen (RIZIV/Solid.): -${formatCurrency(fr.breakdown.beContribAftrek||0)} (Aftrekbaar in FR)
   ↳ FR Soc. Lasten op Vermogensinkomen (PFU 17.2%): -${formatCurrency(PARAMS.FR.SOCIALE_LASTEN.PFU * ((vals.p1?.incomeWealth||0)+(vals.p2?.incomeWealth||0)))}
   = Subtotaal na SZ: ${formatCurrency(fr.bruto - (fr.breakdown.socialeLasten||0))}
3. Overige Aftrekposten FR:
   ↳ Aftrek CAK-bijdrage (NL): -${formatCurrency(fr.breakdown.aftrekCak||0)}
   ↳ Abattement 65+ (indien van toepassing): Berekend
   = Belastbaar Inkomen FR (vóór IB): ${formatCurrency(fr.bruto - (fr.breakdown.socialeLasten||0) - (fr.breakdown.aftrekCak||0) - (/* a65plus value not directly in breakdown, calculated internally */ 0) )}
4. Belastingen FR:
   ↳ Inkomstenbelasting (IB) na Quotient Familial (${fr.breakdown.parts||0} parts): ${formatCurrency(fr.breakdown.calculatedTaxIB||0)}
   ↳ Belastingkrediet Hulp aan Huis: +${formatCurrency(fr.breakdown.belastingKrediet||0)} (Verrekend in IB)
   ↳ Belasting op Vermogensinkomen (PFU 12.8%): +${formatCurrency(PARAMS.FR.INKOMSTENBELASTING.PFU_TARIEF * ((vals.p1?.incomeWealth||0)+(vals.p2?.incomeWealth||0)))}
   = Totale IB + PFU Tax: ${formatCurrency(fr.breakdown.tax||0)}
5. Totale Lasten (SZ + Belastingen): ${formatCurrency(fr.tax)}
6. Netto Inkomen: ${formatCurrency(fr.netto)}

7. Vermogen (IFI):
   - Vastgoed Vermogen: ${formatCurrency(wp)}
   ↳ Jaarlijkse Aanslag: ${formatCurrency(fr.wealthTax)} (Alleen > €1.3M, excl. hoofdwoning)
        `;
    }

    // --- Start Applicatie ---
    initializeApp();

}); // Einde DOMContentLoaded listener

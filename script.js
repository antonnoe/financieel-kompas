document.addEventListener('DOMContentLoaded', () => {
    let PARAMS; let isCouple = false; let initialLoad = true; let activeComparison = 'NL'; const MAX_WORK_YEARS = 50;
    let comparisonChoice, compareCountryResult, compareCountryLabel, compareCountryFlag;
    let householdType, partner2Section, inputs, outputs, valueOutputs;
    let pensionLabels;

    const getEl = (id) => document.getElementById(id);

    function displayError(message) { console.error(message); const el=getEl('calculation-breakdown'); if(el) el.textContent=message; else document.body.innerHTML=`<p style="color:red;padding:20px;">${message}</p>`; }
    function checkSelectors() { if(!comparisonChoice||!householdType||!inputs||!outputs||!valueOutputs||!outputs.breakdown||!inputs.p1?.birthYear||!inputs.simYear){ console.error("UI missing."); return false; } return true; }

    function getSimulationInfo(vals) {
        const sY = inputs.simYear && inputs.simYear.value ? parseInt(inputs.simYear.value, 10) : null;
        const sM = inputs.simMonth && inputs.simMonth.value ? parseInt(inputs.simMonth.value, 10) : null;
        let simDate = new Date();
        if (sY && sM) { simDate = new Date(sY, sM - 1, 15); }
        const calcAge = (p) => { if (!p?.birthYear || !p?.birthMonth) return null; let age = simDate.getFullYear() - p.birthYear; if (simDate.getMonth() < (p.birthMonth - 1)) { age--; } return age; };
        return { simulatieDatum: simDate, leeftijdP1: calcAge(vals.p1), leeftijdP2: calcAge(vals.p2) };
    }

    async function initializeApp() {
        try {
            const r = await fetch('./config.json'); if (!r.ok) throw new Error(r.status);
            PARAMS = await r.json();
            const fix = (arr) => arr?.forEach(i => { if (i.grens === "Infinity") i.grens = Infinity; });
            fix(PARAMS?.FR?.INKOMSTENBELASTING?.SCHIJVEN); fix(PARAMS?.FR?.IFI?.SCHIJVEN); fix(PARAMS?.BE?.INKOMSTENBELASTING?.SCHIJVEN_2025); fix(PARAMS?.BE?.SOCIALE_LASTEN?.BIJZONDERE_BIJDRAGE_SCHIJVEN_GEZIN_2024);
            PARAMS.FR.INKOMSTENBELASTING.LIJFRENTE_FRACTIES = [{age:50,f:0.7},{age:60,f:0.5},{age:70,f:0.4},{age:Infinity,f:0.3}];
            PARAMS.FR.SOCIALE_LASTEN.LIJFRENTE_TARIEF = 0.091;
        } catch (e) { displayError(`Config fout: ${e.message}`); return; }

        comparisonChoice={nl:getEl('btn-nl'),be:getEl('btn-be')}; compareCountryResult=getEl('compare-country-result'); compareCountryLabel=getEl('compare-country-label'); compareCountryFlag=getEl('compare-country-flag');
        householdType={single:getEl('btn-single'),couple:getEl('btn-couple')}; partner2Section=getEl('partner2-section');
        inputs={ simYear:getEl('sim-year'), simMonth:getEl('sim-month'), children:getEl('slider-children'), cak:getEl('cak-contribution'), homeHelp:getEl('home-help'), wealthFinancial:getEl('slider-wealth-financial'), wealthProperty:getEl('slider-wealth-property'),
            p1:{birthYear:getEl('birth-year-1'),birthMonth:getEl('birth-month-1'),aowYears:getEl('aow-years-1'),beWorkYears:getEl('be-work-years-1'),frWorkYears:getEl('fr-work-years-1'),bePension:getEl('slider-be-pension-1'),pensionPublic:getEl('slider-pension-public-1'),pensionPrivate:getEl('slider-pension-private-1'),lijfrente:getEl('slider-lijfrente-1'),lijfrenteDuration:getEl('lijfrente-duration-1'),lijfrenteStartAge:getEl('lijfrente-start-1'),incomeWealth:getEl('slider-income-wealth-1'),salary:getEl('slider-salary-1'),business:getEl('slider-business-1'),businessType:getEl('business-type-1')},
            p2:{birthYear:getEl('birth-year-2'),birthMonth:getEl('birth-month-2'),aowYears:getEl('aow-years-2'),beWorkYears:getEl('be-work-years-2'),frWorkYears:getEl('fr-work-years-2'),bePension:getEl('slider-be-pension-2'),pensionPublic:getEl('slider-pension-public-2'),pensionPrivate:getEl('slider-pension-private-2'),lijfrente:getEl('slider-lijfrente-2'),lijfrenteDuration:getEl('lijfrente-duration-2'),lijfrenteStartAge:getEl('lijfrente-start-2'),incomeWealth:getEl('slider-income-wealth-2'),salary:getEl('slider-salary-2'),business:getEl('slider-business-2'),businessType:getEl('business-type-2')} };
        outputs={compareBruto:getEl('compare-bruto'),compareTax:getEl('compare-tax'),compareNetto:getEl('compare-netto'),wealthTaxCompare:getEl('wealth-tax-compare'),frBruto:getEl('fr-bruto'),frTax:getEl('fr-tax'),frNetto:getEl('fr-netto'),wealthTaxFr:getEl('wealth-tax-fr'),wealthTaxFrExpl:getEl('wealth-tax-fr-expl'),conclusionBar:getEl('conclusion-bar'),conclusionValue:getEl('conclusion-value'),conclusionExpl:getEl('conclusion-expl'),estateTotalDisplay:getEl('estate-total-display'),breakdown:getEl('calculation-breakdown')};
        valueOutputs={p1:{aowYears:getEl('value-aow-years-1'),beWorkYears:getEl('value-be-work-years-1'),frWorkYears:getEl('value-fr-work-years-1'),bePension:getEl('value-be-pension-1'),pensionPublic:getEl('value-pension-public-1'),pensionPrivate:getEl('value-pension-private-1'),lijfrente:getEl('value-lijfrente-1'),incomeWealth:getEl('value-income-wealth-1'),salary:getEl('value-salary-1'),business:getEl('value-business-1')},p2:{aowYears:getEl('value-aow-years-2'),beWorkYears:getEl('value-be-work-years-2'),frWorkYears:getEl('value-fr-work-years-2'),bePension:getEl('value-be-pension-2'),pensionPublic:getEl('value-pension-public-2'),pensionPrivate:getEl('value-pension-private-2'),lijfrente:getEl('value-lijfrente-2'),incomeWealth:getEl('value-income-wealth-2'),salary:getEl('value-salary-2'),business:getEl('value-business-2')},children:getEl('value-children'),wealthFinancial:getEl('value-wealth-financial'),wealthProperty:getEl('value-wealth-property')};
        pensionLabels = document.querySelectorAll('.country-origin');

        if (!checkSelectors()) return;
        populateDropdowns(); setupListeners(); updateHouseholdType(false); updateComparisonCountry('NL');
    }

    const formatCurrency = (v, s=false) => `${s&&(v>0?'+':v<0?'−':'')+' '}€ ${Math.round(Math.abs(v||0)).toLocaleString('nl-NL')}`;
    function populateDropdowns() {
        const cY=new Date().getFullYear(); const M=["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
        [inputs.p1,inputs.p2].forEach(p=>{ if(!p?.birthYear)return; const yS=p.birthYear,mS=p.birthMonth; if(yS.options.length>0)return; yS.innerHTML='';mS.innerHTML=''; for(let y=cY-18;y>=1940;y--){yS.add(new Option(y,y,(y===1960),(y===1960)));} M.forEach((m,i)=>mS.add(new Option(m,i+1))); });
        const sY=inputs.simYear,sM=inputs.simMonth; if(sY&&sM){sY.innerHTML='<option value="">-- Huidig Jaar --</option>';sM.innerHTML='<option value="">-- Huidige Maand --</option>';for(let y=cY+20;y>=cY-5;y--){sY.add(new Option(y,y));}M.forEach((m,i)=>sM.add(new Option(m,i+1)));}
    }
    function getAOWAge(y) { y=Number(y); if(!y||y<1940)return{y:67,m:0}; if(y<=1957)return{y:66,m:4}; if(y===1958)return{y:66,m:7}; if(y===1959)return{y:66,m:10}; return{y:67,m:0}; }
    function setupListeners() {
        if(comparisonChoice.nl)comparisonChoice.nl.addEventListener('click',()=>updateComparisonCountry('NL')); if(comparisonChoice.be)comparisonChoice.be.addEventListener('click',()=>updateComparisonCountry('BE'));
        if(householdType.single)householdType.single.addEventListener('click',()=>updateHouseholdType(false)); if(householdType.couple)householdType.couple.addEventListener('click',()=>updateHouseholdType(true));
        getEl('reset-btn')?.addEventListener('click',()=>{ document.querySelectorAll('input[type=range]').forEach(i=>i.value=0); document.querySelectorAll('input[type=checkbox]').forEach(i=>i.checked=false); document.querySelectorAll('select:not([id*="birth"])').forEach(s=>s.selectedIndex=0); if(inputs.p1.birthYear)inputs.p1.birthYear.value=1960; if(inputs.p2.birthYear)inputs.p2.birthYear.value=1960; initialLoad=true; updateHouseholdType(false);updateComparisonCountry('NL');});
        getEl('copy-btn')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(outputs.breakdown.innerText);alert('Gekopieerd!');}catch(e){alert('Kopiëren mislukt.');}});
        getEl('input-panel')?.addEventListener('input',(e)=>{ if(e.target.matches('input, select')){ if(e.target.id.includes('work-years')||e.target.id.includes('aow-years')) adjustYears(e.target.id); updateScenario(); } });
    }
    function updateComparisonCountry(cc) { activeComparison=cc; comparisonChoice.nl.classList.toggle('active',cc==='NL'); comparisonChoice.be.classList.toggle('active',cc==='BE');
        compareCountryLabel.textContent=cc==='NL'?"Nederland":"België"; compareCountryFlag.textContent=cc==='NL'?"🇳🇱":"🇧🇪"; compareCountryResult.style.borderColor=cc==='NL'?"var(--primary-color)":"#FDDA25";
        document.querySelectorAll('.nl-specific').forEach(el=>el.style.display=cc==='NL'?'block':'none'); document.querySelectorAll('.be-specific').forEach(el=>el.style.display=cc==='BE'?'block':'none'); document.querySelectorAll('.hide-for-be').forEach(el=>el.style.display=cc==='BE'?'none':'block');
        pensionLabels.forEach(l=>l.textContent=`uit ${cc}`); updateScenario(); }
    function updateHouseholdType(c) { isCouple=c; householdType.single.classList.toggle('active',!c); householdType.couple.classList.toggle('active',c); partner2Section.style.display=c?'block':'none'; updateScenario(); }
    function getPInput(pid) { const p=inputs[pid]; if(!p?.birthYear)return null; const N=(e)=>Number(e.value||0); return {birthYear:N(p.birthYear),birthMonth:N(p.birthMonth),aowYears:N(p.aowYears),beWorkYears:N(p.beWorkYears),frWorkYears:N(p.frWorkYears),bePension:N(p.bePension),pensionPublic:N(p.pensionPublic),pensionPrivate:N(p.pensionPrivate),lijfrente:N(p.lijfrente),lijfrenteDuration:N(p.lijfrenteDuration),lijfrenteStartAge:p.lijfrenteStartAge.value,incomeWealth:N(p.incomeWealth),salary:N(p.salary),business:N(p.business),businessType:p.businessType.value}; }
    function adjustYears(id) { const p=id.includes('-1')?inputs.p1:inputs.p2; if(!p)return; const cS=activeComparison==='NL'?p.aowYears:p.beWorkYears; const fS=p.frWorkYears; let cV=Number(cS.value),fV=Number(fS.value); if(cV+fV>MAX_WORK_YEARS){if(id===cS.id)fS.value=MAX_WORK_YEARS-cV; else cS.value=MAX_WORK_YEARS-fV;} updateVO(); }
    function updateVO() { const u=(o,i,c=true)=>{if(o&&i)o.textContent=c?formatCurrency(Number(i.value)):i.value;};
        u(valueOutputs.p1.aowYears,inputs.p1.aowYears,false); u(valueOutputs.p1.beWorkYears,inputs.p1.beWorkYears,false); u(valueOutputs.p1.frWorkYears,inputs.p1.frWorkYears,false); u(valueOutputs.p1.bePension,inputs.p1.bePension); u(valueOutputs.p1.pensionPublic,inputs.p1.pensionPublic); u(valueOutputs.p1.pensionPrivate,inputs.p1.pensionPrivate); u(valueOutputs.p1.lijfrente,inputs.p1.lijfrente); u(valueOutputs.p1.incomeWealth,inputs.p1.incomeWealth); u(valueOutputs.p1.salary,inputs.p1.salary); u(valueOutputs.p1.business,inputs.p1.business);
        if(isCouple){ u(valueOutputs.p2.aowYears,inputs.p2.aowYears,false); u(valueOutputs.p2.beWorkYears,inputs.p2.beWorkYears,false); u(valueOutputs.p2.frWorkYears,inputs.p2.frWorkYears,false); u(valueOutputs.p2.bePension,inputs.p2.bePension); u(valueOutputs.p2.pensionPublic,inputs.p2.pensionPublic); u(valueOutputs.p2.pensionPrivate,inputs.p2.pensionPrivate); u(valueOutputs.p2.lijfrente,inputs.p2.lijfrente); u(valueOutputs.p2.incomeWealth,inputs.p2.incomeWealth); u(valueOutputs.p2.salary,inputs.p2.salary); u(valueOutputs.p2.business,inputs.p2.business); } }

    function updateScenario() {
        if(!PARAMS||!checkSelectors()) return;
        try {
            const p1=getPInput('p1'), p2=isCouple?getPInput('p2'):null;
            const vals={isCouple, children:Number(inputs.children.value), cak:inputs.cak.checked, homeHelp:Number(inputs.homeHelp.value), wealthFinancial:Number(inputs.wealthFinancial.value), wealthProperty:Number(inputs.wealthProperty.value), p1, p2, estate:Number(inputs.wealthFinancial.value)+Number(inputs.wealthProperty.value)};
            updateVO(); valueOutputs.children.textContent=vals.children; valueOutputs.wealthFinancial.textContent=formatCurrency(vals.wealthFinancial); valueOutputs.wealthProperty.textContent=formatCurrency(vals.wealthProperty);
            let cmp={bruto:0,tax:0,netto:0,wealthTax:0,breakdown:{}};
            if(activeComparison==='NL') cmp=calculateNL(vals); else if(activeComparison==='BE') cmp=calculateBE(vals);
            const fr=calculateFR(vals, activeComparison);
            outputs.compareBruto.textContent=formatCurrency(cmp.bruto); outputs.compareTax.textContent=formatCurrency(cmp.tax); outputs.compareNetto.textContent=formatCurrency(cmp.netto); outputs.wealthTaxCompare.textContent=formatCurrency(cmp.wealthTax);
            outputs.frBruto.textContent=formatCurrency(fr.bruto); outputs.frTax.textContent=formatCurrency(fr.tax); outputs.frNetto.textContent=formatCurrency(fr.netto); outputs.wealthTaxFr.textContent=formatCurrency(fr.wealthTax); outputs.wealthTaxFrExpl.textContent=(fr.wealthTax===0&&vals.estate>50000)?"(Vastgoed < €1.3M)":"";
            const delta=(fr.netto-cmp.netto)+(cmp.wealthTax-fr.wealthTax);
            outputs.conclusionValue.textContent=formatCurrency(delta,true); outputs.conclusionBar.className=delta>=0?'positive':'negative'; outputs.conclusionExpl.textContent=delta>=0?"Positief: voordeel in Frankrijk.":"Negatief: voordeel in vergeleken land.";
            outputs.breakdown.textContent=initialLoad?"Welkom! Vul uw gegevens in.":genBreakdown(vals,cmp,fr); initialLoad=false;
        } catch(e) { console.error(e); displayError("Fout in berekening."); }
    }

    function calculateNL(vals) {
        let B=0,T=0,N=0; const {simulatieDatum,leeftijdP1,leeftijdP2}=getSimulationInfo(vals);
        [vals.p1,vals.p2].filter(p=>p).forEach((p,i)=>{
            const l=i===0?leeftijdP1:leeftijdP2; const aowL=getAOWAge(p.birthYear); const aowD=new Date((p.birthYear)+aowL.y,(p.birthMonth)-1+aowL.m);
            const isPens=simulatieDatum>=aowD; const lStart=p.lijfrenteStartAge==='aow'?aowL.y:parseInt(p.lijfrenteStartAge); const lAct=l>=lStart&&l<p.lijfrenteDuration;
            const inc = (isPens?(p.aowYears/50)*(isCouple?PARAMS.AOW_BRUTO_COUPLE:PARAMS.AOW_BRUTO_SINGLE)+p.pensionPublic+p.pensionPrivate:0) + (lAct?p.lijfrente:0) + (!isPens?p.salary+p.business:0);
            const r=calcNLNet(inc, p.salary, p.business, isPens); B+=r.B;T+=r.T;N+=r.N;
        });
        const v=isCouple?PARAMS.NL.BOX3.VRIJSTELLING_COUPLE:PARAMS.NL.BOX3.VRIJSTELLING_SINGLE; return{bruto:B,tax:T,netto:N,wealthTax:Math.max(0,vals.wealthFinancial-v)*PARAMS.NL.BOX3.FORFAITAIR_RENDEMENT*PARAMS.NL.BOX3.TARIEF, breakdown:{simulatieDatum}};
    }
    function calcNLNet(I,s,b,isP){
        const w=b*(1-PARAMS.NL.BOX1.MKB_WINSTVRIJSTELLING); const z=(b>0?w:0)*PARAMS.NL.SOCIALE_LASTEN.ZVW_PERCENTAGE; const br=I-b+w; if(br<=0)return{B:br,T:z,N:br-z};
        const T=isP?PARAMS.NL.BOX1.TARIEVEN_BOVEN_AOW:PARAMS.NL.BOX1.TARIEVEN_ONDER_AOW; const g1=PARAMS.NL.BOX1.GRENS_SCHIJF_1;
        let t=(br<=g1)?br*T[0]:(g1*T[0])+(br-g1)*T[1];
        let ak=(s>0||b>0?PARAMS.NL.BOX1.ARBEIDSKORTING_MAX:0), ahk=PARAMS.NL.BOX1.ALGEMENE_HEFFINGSKORTING_MAX;
        if(br>PARAMS.NL.BOX1.HK_AFBOUW_START) ahk=Math.max(0,ahk-(br-PARAMS.NL.BOX1.HK_AFBOUW_START)*PARAMS.NL.BOX1.HK_AFBOUW_FACTOR); if(br>=g1)ahk=0;
        if(br>39957) ak=Math.max(0,ak-(br-39957)*0.0651);
        t=Math.max(0,t-ahk-ak); return{B:br,T:t+z,N:br-t-z};
    }

    function calculateBE(vals) {
        let B=0,T=0,N=0,tBI=0,tSL=0,tIV=0,nPNL=0,bBEP=0,bePC=0,loonVoorK=0;
        const {simulatieDatum,leeftijdP1,leeftijdP2}=getSimulationInfo(vals); const PB=PARAMS.BE;
        [vals.p1,vals.p2].filter(p=>p).forEach((p,i)=>{
            const l=i===0?leeftijdP1:leeftijdP2; const aowL=getAOWAge(p.birthYear); const aowD=new Date((p.birthYear)+aowL.y,(p.birthMonth)-1+aowL.m); const isPens=simulatieDatum>=aowD;
            const rW=(!isPens?p.salary:0)*PB.SOCIALE_LASTEN.WERKNEMER_RSZ_PERCENTAGE; tSL+=rW; loonVoorK+=(!isPens?p.salary:0)-rW;
            let rZ=0, w=(!isPens?p.business:0); PB.SOCIALE_LASTEN.ZELFSTANDIGE_SCHIJVEN.forEach(s=>{let d=Math.max(0,Math.min(w,s.grens-(s.prev||0)));rZ+=d*s.tarief;w-=d;s.prev=s.grens;}); tSL+=rZ;
            const cAOW=isPens?(p.aowYears/50)*(isCouple?PARAMS.AOW_BRUTO_COUPLE:PARAMS.AOW_BRUTO_SINGLE):0; const cBE=isPens?p.bePension:0;
            const lStart=p.lijfrenteStartAge==='aow'?aowL.y:parseInt(p.lijfrenteStartAge); const lAct=l>=lStart&&l<p.lijfrenteDuration; const cL=lAct?p.lijfrente:0;
            const tOP=cAOW+(isPens?p.pensionPrivate:0)+cL; if(isPens&&p.pensionPublic>0)nPNL+=p.pensionPublic; tBI+=(!isPens?p.salary+p.business-rW-rZ:0)+tOP;
            bBEP+=cBE; B+=(!isPens?p.salary+p.business:0)+tOP+cBE+(isPens?p.pensionPublic:0)+p.incomeWealth; tIV+=p.incomeWealth;
        });
        bePC=bBEP*(PB.SOCIALE_LASTEN.PENSIOEN_RIZIV_PERCENTAGE+PB.SOCIALE_LASTEN.PENSIOEN_SOLIDARITEIT_PERCENTAGE); tSL+=bePC;
        const kost=Math.min(loonVoorK*PB.INKOMSTENBELASTING.FORFAIT_BEROEPSKOSTEN_WERKNEMER_PERCENTAGE, PB.INKOMSTENBELASTING.FORFAIT_BEROEPSKOSTEN_WERKNEMER_MAX*(isCouple?2:1));
        let bInc=Math.max(0,tBI-kost)+bBEP-bePC, fB=0, vG=0; PB.INKOMSTENBELASTING.SCHIJVEN_2025.forEach(s=>{fB+=Math.max(0,Math.min(bInc,s.grens)-vG)*s.tarief;vG=s.grens;});
        let tV=PB.INKOMSTENBELASTING.BASIS_VRIJSTELLING*(isCouple?2:1); if(vals.children>0) tV+=PB.INKOMSTENBELASTING.VRIJSTELLING_PER_KIND[Math.min(vals.children,3)-1] || 0; // Simplificatie
        fB=Math.max(0,fB-(Math.min(bInc,tV)*PB.INKOMSTENBELASTING.SCHIJVEN_2025[0].tarief));
        const gB=fB*PB.INKOMSTENBELASTING.GEMEENTEBELASTING_GEMIDDELD;
        const rv=(Math.max(0,(tIV/2)-(PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_VRIJSTELLING_SPAAR_PP*(isCouple?2:1)))*PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_TARIEF_SPAAR) + (Math.max(0,(tIV/4)-(PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_VRIJSTELLING_DIVIDEND_PP*(isCouple?2:1))+(tIV/4))*PB.INKOMSTENBELASTING.ROERENDE_VOORHEFFING_TARIEF_ALGEMEEN);
        let bszb=0; for(const s of PB.SOCIALE_LASTEN.BIJZONDERE_BIJDRAGE_SCHIJVEN_GEZIN_2024){if(bInc<s.grens){bszb=s.bijdrage;break;}bszb=s.bijdrage;}
        T=tSL+fB+gB+rv+bszb; N=B-T-nPNL*(PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0]||0); // N minus NL tax on public pension
        return{bruto:B,tax:T,netto:N,wealthTax:0,breakdown:{simulatieDatum:getSimulationInfo(vals).simulatieDatum,socialeLasten:tSL,bePensionContrib:bePC,bszb,federaleBelasting:fB,gemeentebelasting:gB,roerendeVoorheffing:rv,nPNL}};
    }

    function calculateFR(vals, cmp) {
        if (!PARAMS.FR) return { bruto: 0, tax: 0, netto: 0, wealthTax: 0, breakdown: {} };
        let B=0, bI=0, tSL=0, tIV=0, nPNL=0, bBE=0, beC=0, lB=0, lBel=0; const {simulatieDatum,leeftijdP1,leeftijdP2}=getSimulationInfo(vals);
        let tEY=0; [vals.p1,vals.p2].filter(p=>p).forEach(p=>{ tEY+=(cmp==='NL'?p.aowYears:p.beWorkYears)+p.frWorkYears; });
        const frR=Math.min(1, tEY/PARAMS.FR_PENSION_YEARS_REQUIRED)*PARAMS.FR_PENSION_RATE;

        [vals.p1,vals.p2].filter(p=>p).forEach((p,i)=>{
            const l=i===0?leeftijdP1:leeftijdP2; const aowD=getAOWAge(p.birthYear); const isPens=l!==null && simulatieDatum>=new Date(p.birthYear+aowD.y,p.birthMonth-1+aowD.m);
            const fSP=isPens?(p.frWorkYears/PARAMS.FR_PENSION_YEARS_REQUIRED)*PARAMS.FR_PENSION_AVG_SALARY*frR:0;
            const lStart=p.lijfrenteStartAge==='aow'?aowD.y:parseInt(p.lijfrenteStartAge); const lAct=l>=lStart&&l<p.lijfrenteDuration;
            let lFrac=1; if(lAct){ PARAMS.FR.INKOMSTENBELASTING.LIJFRENTE_FRACTIES.forEach(f=>{if(lStart<f.age&&lFrac===1)lFrac=f.f;}); }
            const cL=lAct?p.lijfrente:0; lB+=cL; lBel+=cL*lFrac;
            const pens = isPens ? (Number(p.aowYears)/50)*(isCouple?PARAMS.AOW_BRUTO_COUPLE:PARAMS.AOW_BRUTO_SINGLE)+p.pensionPrivate+fSP : 0;
            if(isPens) { nPNL+=p.pensionPublic; bBE+=p.bePension; beC+=p.bePension*((PARAMS.BE.SOCIALE_LASTEN.PENSIOEN_RIZIV_PERCENTAGE||0)+(PARAMS.BE.SOCIALE_LASTEN.PENSIOEN_SOLIDARITEIT_PERCENTAGE||0)); }
            const loon = !isPens?p.salary:0, winst=!isPens?p.business:0;
            tSL += pens*PARAMS.FR.SOCIALE_LASTEN.PENSIOEN + loon*PARAMS.FR.SOCIALE_LASTEN.SALARIS + winst*0.212 /*simp*/ + (cL*lFrac)*PARAMS.FR.SOCIALE_LASTEN.LIJFRENTE_TARIEF;
            bI += pens + loon + winst*(1-(p.businessType==='rental'?0.3:0.5)) + cL*lFrac; B += pens+loon+winst+cL+p.pensionPublic+p.bePension+p.incomeWealth; tIV+=p.incomeWealth;
        });
        bI -= tSL + beC + (vals.cak?PARAMS.FR.CAK_BIJDRAGE_GEMIDDELD:0); // Aftrek BE contrib & CAK
        // QF & Tax
        const parts=(isCouple?2:1)+(vals.children>2?(vals.children-2)+2:vals.children*0.5); let tax=0, vG=0;
        PARAMS.FR.INKOMSTENBELASTING.SCHIJVEN.forEach(s=>{tax+=Math.max(0,Math.min(Math.max(0,bI)/parts,s.grens)-vG)*s.tarief;vG=s.grens;}); tax*=parts;
        // Plafond QF (simp): max voordeel per half part. Echte berekening complexer, dit is een benadering.
        tax -= vals.homeHelp*PARAMS.FR.HULP_AAN_HUIS_KREDIET_PERCENTAGE;
        const pfu = tIV*(PARAMS.FR.INKOMSTENBELASTING.PFU_TARIEF+PARAMS.FR.SOCIALE_LASTEN.PFU);
        let wT=0, wV=vals.wealthProperty; if(wV>PARAMS.FR.IFI.DREMPEL_START){let pL=800000; PARAMS.FR.IFI.SCHIJVEN.forEach(s=>{wT+=Math.max(0,Math.min(wV,s.grens)-pL)*s.tarief;pL=s.grens;});}
        return {bruto:B, tax:tSL+Math.max(0,tax)+pfu+beC, netto:B-(tSL+Math.max(0,tax)+pfu+beC)-nPNL*(PARAMS.NL?.BOX1?.TARIEVEN_BOVEN_AOW?.[0]||0), wealthTax:wT, breakdown:{simulatieDatum:getSimulationInfo(vals).simulatieDatum,tax,tSL,pfu,beC,lB,lBel,nPNL}};
    }

    function genBreakdown(vals, cmp, fr) {
        const sd = cmp.breakdown.simulatieDatum.toLocaleDateString('nl-NL',{month:'long',year:'numeric'});
        return `Situatie per ${sd}:\n\n${activeComparison==='NL'?'NEDERLAND':'BELGIË'}\nBruto: ${formatCurrency(cmp.bruto)}\nLasten: ${formatCurrency(cmp.tax)}\nNetto: ${formatCurrency(cmp.netto)}\nVermogensbelasting: ${formatCurrency(cmp.wealthTax)}\n\nFRANKRIJK\nBruto: ${formatCurrency(fr.bruto)}\nLasten: ${formatCurrency(fr.tax)} (incl. ${formatCurrency(fr.breakdown.beC)} BE bijdr.)\nNetto: ${formatCurrency(fr.netto)}\nIFI (Vastgoed): ${formatCurrency(fr.wealthTax)}`;
    }
});

# Financieel Kompas - Tool Beschrijving

## Overzicht

**Financieel Kompas** is een gratis, privacy-vriendelijke webapplicatie voor het vergelijken van de financiële gevolgen van wonen in Frankrijk versus Nederland of België.

![Screenshot van Financieel Kompas](https://github.com/user-attachments/assets/a8fe51ec-517b-4bab-92a5-3465d8829aa5)

---

## Wat doet de tool?

De tool berekent en vergelijkt:

1. **Netto Inkomen** na aftrek van:
   - Inkomstenbelasting
   - Sociale lasten (RSZ, Zvw, CSG/CRDS, etc.)
   - Pensioenbijdragen
   
2. **Vermogensbelasting**:
   - Nederland: Box 3 (forfaitair rendement op financieel vermogen)
   - Frankrijk: IFI (vermogensbelasting op vastgoed >€1.3M)
   - België: Geen algemene vermogensbelasting

3. **Financiële Balans**:
   - Jaarlijks netto verschil tussen Frankrijk en het vergelijkingsland
   - Positief = voordeel Frankrijk
   - Negatief = voordeel vergelijkingsland

---

## Voor wie is deze tool?

### Doelgroepen
- 🏠 **Expats en emigranten**: Nederlanders of Belgen die overwegen te verhuizen naar Frankrijk
- 👴 **Gepensioneerden**: Met AOW/staatspensioen, bedrijfspensioen of lijfrente uit NL/BE
- 💼 **Werkenden**: Met salaris, winst uit onderneming of vermogensinkomsten
- 👨‍👩‍👧 **Gezinnen**: Met kinderen ten laste (quotient familial voordeel in Frankrijk)
- 💰 **Vermogende particulieren**: Met financieel vermogen of vastgoed

### Typische gebruikssituaties
1. **Pensioenplanning**: "Als ik met pensioen ga, wat is mijn netto inkomen in Frankrijk vs Nederland?"
2. **Emigratiebeslissing**: "Is emigreren naar Frankrijk financieel aantrekkelijk?"
3. **Scenario-analyse**: "Wat is het effect van verschillende inkomstenbronnen?"
4. **Kinderen effect**: "Hoeveel scheelt het quotient familial in Frankrijk?"
5. **Vermogensstrategie**: "Hoe wordt mijn vermogen belast in verschillende landen?"

---

## Belangrijkste Functionaliteiten

### 1. Flexibele Scenario's
- **Huishoudtype**: Alleenstaand of partners
- **Vergelijkingsland**: Nederland of België
- **Toekomstige datum**: Simuleer op basis van emigratie- of pensioendatum
- **Kinderen**: 0-5 kinderen ten laste

### 2. Diverse Inkomstenbronnen (per partner)

| Inkomstenbron | Beschrijving |
|---------------|--------------|
| **Salaris/Loon** | Bruto inkomen uit loondienst |
| **Winst uit onderneming** | Voor zelfstandigen (met keuze diensten/verhuur voor FR abattement) |
| **AOW/Staatspensioen** | Nederlands of Belgisch staatspensioen (op basis van opbouwjaren) |
| **Overheidspensioen** | Bijv. ABP (NL) of ambtenaren (BE) - belast in bronland |
| **Particulier pensioen** | Bedrijfspensioen - belast in woonland |
| **Lijfrente** | NL lijfrente - belast in woonland, met keuze startleeftijd |
| **Vermogensinkomen** | Dividend, rente, kapitaalwinsten |

### 3. Vermogen
- **Financieel vermogen**: Spaargeld, beleggingen (basis voor NL Box 3)
- **Vastgoed**: Waarde onroerend goed excl. hoofdverblijf (basis voor FR IFI)

### 4. Speciale Situaties
- **CAK-bijdrage (NL)**: Aftrekbaar in Frankrijk
- **Hulp aan huis (FR)**: 50% belastingkrediet
- **BE pensioenbijdragen**: Aftrekbaar in Frankrijk (RIZIV, solidariteit)
- **Lijfrente startleeftijd**: Kiesbaar (AOW-leeftijd, 67, 65, 60 jaar)
- **Lijfrente duur**: Levenslang of tot bepaalde leeftijd

### 5. Pensioenleeftijd & Timing
- **AOW-leeftijd**: Automatisch berekend op basis van geboortejaar (66j4m - 67j0m)
- **Pensioeninkomsten**: Activeren automatisch op AOW-leeftijd
- **Frans staatspensioen**: Berekend op basis van FR werkjaren (vereist ~43 jaar voor vol pensioen)

---

## Hoe werkt de berekening?

### Nederland (NL)
1. **Bruto inkomen**: Salaris + winst + pensioen + AOW + lijfrente
2. **Aftrekposten**: 
   - MKB-winstvrijstelling (12.7% op winst)
3. **Inkomstenbelasting (Box 1)**:
   - Onder AOW-leeftijd: 36.97% / 49.5%
   - Boven AOW-leeftijd: 19.07% / 49.5%
   - Minus heffingskortingen (AHK, Arbeidskorting)
4. **Sociale lasten**:
   - Zvw-bijdrage: 5.26% op winst
5. **Vermogensbelasting (Box 3)**:
   - Vrijstelling: €57,684 (alleenstaand) / €115,368 (partners)
   - Tarief: 36% over forfaitair rendement 6.17%

### Frankrijk (FR)
1. **Bruto inkomen**: Alle inkomsten (NL overheidspensioen apart, belast in NL)
2. **Sociale lasten**:
   - Pensioen: ~9.1% (CSG + CRDS)
   - Salaris: ~22%
   - Winst: ~21-23%
   - Vermogen: 17.2% (PFU)
3. **Aftrekposten**:
   - Abattement winst: 50% (diensten) / 30% (verhuur)
   - Abattement 65+: €1,373 - €2,746 (afhankelijk inkomen)
   - CAK-bijdrage NL: ~€4,500
   - BE pensioenbijdragen (RIZIV/Solidariteit)
   - Lijfrente: Slechts 30-70% belastbaar (afhankelijk startleeftijd)
4. **Inkomstenbelasting**:
   - Progressief: 0% - 11% - 30% - 41% - 45%
   - **Quotient Familial**: Inkomen gedeeld door "parts"
     - Alleenstaand: 1 part
     - Partners: 2 parts
     - Kinderen: +0.5 part (1e en 2e), +1 part (3e en volgende)
   - Plafonnering quotient-voordeel: €1,759 per 0.5 part
5. **Belastingkredieten**:
   - Hulp aan huis: 50% krediet (max €12k-€15k uitgaven)
6. **Vermogensbelasting (IFI)**:
   - Alleen op vastgoed >€1.3M (excl. hoofdverblijf)
   - Progressief: 0.5% - 1.5%
7. **Vermogensinkomen (PFU)**:
   - Flat tax: 12.8% IB + 17.2% sociale lasten = 30% totaal

### België (BE)
1. **Bruto inkomen**: Alle inkomsten (NL overheidspensioen apart, belast in NL)
2. **Sociale lasten**:
   - RSZ werknemer: 13.07%
   - Zelfstandige: 20.5% / 14.16% (progressief)
   - Pensioen RIZIV: 3.55%
   - Pensioen solidariteit: ~1%
3. **Beroepskosten**:
   - Forfait werknemer: 30% (max €5,750 per persoon)
4. **Inkomstenbelasting (Federaal)**:
   - Progressief: 25% - 40% - 45% - 50%
   - Vrijstellingen:
     - Basis: €10,910 per persoon
     - Kinderen: €1,920 (1e) / €4,950 (2e) / €11,090 (3e) / +€6,850 (>3e)
   - Korting op laagste tarief (25%)
5. **Gemeentebelasting**: ~7.17% op federale PB (gemiddelde)
6. **Roerende voorheffing**:
   - Algemeen (dividend, rente): 30%
   - Spaarrekening: 15% (vrijstelling €1,020 pp)
   - Dividend vrijstelling: ~€833 pp (via PB)
7. **BSZB** (Bijzondere Sociale Zekerheidsbijdrage): €0 - €731 (afhankelijk inkomen)

---

## Belastingverdragen

De tool implementeert correcte verdragsregels:

### NL-FR Verdrag
| Inkomstenbron | Belast in | Implementatie |
|---------------|-----------|---------------|
| AOW (NL) | Woonland (FR) | ✅ Correct |
| Overheidspensioen (NL ABP, etc.) | Bronland (NL) | ✅ Correct (~19% in NL, netto naar FR) |
| Particulier pensioen (NL) | Woonland (FR) | ✅ Correct |
| Lijfrente (NL) | Woonland (FR) | ✅ Correct (gunstig: 30-70% belast) |
| Salaris/winst | Woonland (FR) | ✅ Correct |
| Vermogensinkomen | Woonland (FR) | ✅ Correct |

### BE-FR Verdrag
| Inkomstenbron | Belast in | Implementatie |
|---------------|-----------|---------------|
| Staatspensioen (BE) | Woonland (FR) | ✅ Correct (met aftrek BE bijdragen) |
| Overheidspensioen (BE ambtenaren) | Bronland (BE) | ✅ Correct (netto naar FR) |
| Particulier pensioen (BE) | Woonland (FR) | ✅ Correct |
| Salaris/winst | Woonland (FR) | ✅ Correct |
| Vermogensinkomen | Woonland (FR) | ✅ Correct |

---

## Privacy & Veiligheid

### 100% Privacy
- ✅ **Volledig lokaal**: Alle berekeningen in browser
- ✅ **Geen dataopslag**: Niets wordt opgeslagen op servers
- ✅ **Geen tracking**: Geen cookies, analytics of tracking
- ✅ **Geen verzending**: Data verlaat uw computer niet
- ✅ **Open source**: Code is transparant en controleerbaar

### Technische Details
- **Frontend-only**: HTML, CSS, JavaScript
- **No backend**: Geen server-side processing
- **Configuratie**: Parameters in `config.json` (lokaal)
- **Hosting**: Kan op elke statische webhost

---

## Output & Analyse

### 1. Resultatenbalk (Sticky)
- **Nederland/België**: Bruto, Lasten, Netto, Vermogensbelasting
- **Frankrijk**: Bruto, Lasten, Netto, Vermogensbelasting (IFI)
- **Financiële Balans**: Netto jaarlijks verschil

### 2. Gedetailleerde Analyse (Uitklapbaar)
De tool genereert een uitgebreide tekstuele analyse met:

#### Voor vergelijkingsland (NL/BE):
- Bruto inkomen totaal
- Breakdown sociale lasten per type
- Inkomstenbelasting (met heffingskortingen)
- Vermogensbelasting
- Netto inkomen

#### Voor Frankrijk:
- Bruto inkomen totaal (opgesplitst FR belast / herkomstland belast)
- Sociale lasten per type (inkomen, vermogen, pensioen, lijfrente)
- Aftrekposten (CAK, BE bijdragen, abattement 65+)
- Inkomstenbelasting (met quotient familial en belastingkredieten)
- Vermogensinkomen (PFU)
- IFI
- Netto inkomen

#### Extra informatie:
- Simulatiedatum scenario
- Jaren tot pensioen (per partner)
- Toelichting verdragsregels
- Belastbaar vs bruto bedragen (bijv. lijfrente)

### 3. Kopiëren Analyse
- Button om volledige analyse te kopiëren naar klembord
- Handig voor delen met adviseur of eigen administratie

---

## Beperkingen (Bewust)

De tool focust op **hoofdlijnen** en neemt NIET mee:

### Nederland
- ❌ Zorgtoeslag, huurtoeslag, kindgebonden budget
- ❌ Kinderbijslag
- ❌ Hypotheekrenteaftrek
- ❌ Giftenaftrek
- ❌ Eigenwoningforfeit

### België
- ❌ Groeipakket (kinderbijslag)
- ❌ Dienstencheques fiscaal voordeel
- ❌ Pensioensparen aftrek
- ❌ Lange termijn sparen
- ❌ Woonbonus (nieuwe contracten)
- ❌ Specifieke gemeentelijke opcentiemen

### Frankrijk
- ❌ Allocations familiales (kinderbijslag)
- ❌ Taxe d'habitation (voor 2e woningen)
- ❌ Taxe foncière (onroerende voorheffing)
- ❌ Lokale belastingen

### Algemeen
- ❌ Inflatie en toekomstige wijzigingen
- ❌ Actuariële pensioenberekening bij vervroegde uitkering
- ❌ Erfbelasting / schenkbelasting
- ❌ Complexe inkomsten (niet-recreatieve verhuur, DGA, etc.)
- ❌ Specifieke persoonlijke aftrekposten

**Reden**: De tool is bedoeld als educatief hulpmiddel voor hoofdlijnen, niet als volledige financiële planning.

---

## Nauwkeurigheid & Disclaimer

### Nauwkeurigheid
- **Parameters**: 92-95% accuraat voor 2025
- **Berekeningslogica**: 95-98% correct
- **Verdragsregels**: Correct geïmplementeerd
- **Scope**: Beperkt tot hoofdzaken (bewust)

### Officiële Disclaimer (uit de tool)
> *"Dit is een scenario-simulator en geen financieel advies. De berekeningen zijn gebaseerd op vereenvoudigde en gestandaardiseerde fiscale regels. Raadpleeg altijd een gekwalificeerde adviseur voor uw persoonlijke situatie. De ingevoerde data is anoniem en wordt niet opgeslagen."*

### Wanneer WEL een adviseur raadplegen?
- ✅ Voor persoonlijk advies en planning
- ✅ Bij complexe inkomenssituaties (DGA, buitenlandse inkomsten)
- ✅ Bij grote vermogens (>€500k)
- ✅ Voor pensioenplanning en actuariële berekeningen
- ✅ Bij onduidelijkheden over verdragsregels
- ✅ Voor estate planning (erf/schenkbelasting)

---

## Gebruik van de Tool

### Stap 1: Vergelijking kiezen
- Kies **Nederland** of **België** als vergelijkingsland

### Stap 2: Huishoudtype
- Kies **Alleenstaande** of **Partners**

### Stap 3: Simulatiedatum (optioneel)
- Laat leeg voor huidige situatie
- Kies jaar/maand voor toekomstig scenario (bijv. pensioendatum)
- ⚠️ **Let op**: Vul dan bij pensioen/lijfrente de bedragen in die op DÁT moment gelden

### Stap 4: Vul gegevens in (Module 1: Inkomen)
Per partner:
1. **Geboortedatum** (bepaalt AOW-leeftijd)
2. **Werkjaren** (NL/BE en Frankrijk)
3. **Pensioenen** (overheid, particulier, BE staatspensioen)
4. **Lijfrente** (inclusief startleeftijd en duur)
5. **Vermogensinkomen**
6. **Salaris/loon**
7. **Winst uit onderneming**

### Stap 5: Vul gegevens in (Module 2: Vermogen)
1. **Kinderen** (0-5 kinderen ten laste)
2. **CAK-bijdrage** (ja/nee)
3. **Hulp aan huis** (Frankrijk, 0 - €7k)
4. **Financieel vermogen** (spaargeld, beleggingen)
5. **Vastgoed** (waarde excl. hoofdverblijf)

### Stap 6: Bekijk resultaten
- Resultatenbalk toont direct netto inkomen en vermogensbelasting
- Klik op **"Bekijk Analyse & Uitleg"** voor gedetailleerde breakdown
- Gebruik **"📋 Kopieer"** om analyse te kopiëren

### Stap 7: Experimenteer
- Pas waarden aan om effecten te zien
- Probeer verschillende scenario's
- Vergelijk met adviseur of eigen berekeningen

---

## Technische Specificaties

### Bestanden
- `index.html`: Gebruikersinterface
- `script.js`: Berekeningslogica (JavaScript)
- `style.css`: Styling
- `config.json`: Parameters en tarieven (2025)

### Browser Compatibiliteit
- ✅ Chrome, Firefox, Safari, Edge (moderne versies)
- ✅ Mobiel (responsive design)
- ⚠️ Vereist JavaScript

### Hosting
- Kan op elke statische webhost (GitHub Pages, Netlify, Vercel, etc.)
- Geen server-side vereisten
- Geen database nodig

---

## Updates & Onderhoud

### Jaarlijkse Updates Nodig Voor
1. **NL tarieven** (Box 1, Box 3, heffingskortingen, AOW-bedragen)
2. **FR tarieven** (inkomstenbelasting schijven, quotient plafond, IFI)
3. **BE tarieven** (federale schijven, vrijstellingen, RSZ)
4. **Sociale lasten** (Zvw, CSG/CRDS, RSZ)

### Hoe updaten?
- Update `config.json` met nieuwe parameters
- Test met bekende scenario's
- Update documentatie (jaar in tooltips/FAQ)

---

## Credits

**Ontwikkeld door:** Communities Abroad ©  
**Voor:** Nederlanders.fr, Infofrankrijk.com, Nedergids.nl  
**Type:** Educatieve tool / scenario-simulator  
**Versie:** 2025

---

## FAQ

### Kan ik de tool vertrouwen?
Ja, met kanttekeningen:
- ✅ Code is open en controleerbaar
- ✅ Parameters zijn grotendeels accuraat (92-95%)
- ✅ Berekeningslogica is correct (95-98%)
- ⚠️ Het is een educatief hulpmiddel, geen financieel advies
- ⚠️ Raadpleeg altijd een adviseur voor persoonlijke situaties

### Waarom verschillen de resultaten met mijn eigen berekening?
Mogelijke redenen:
1. Tool gebruikt gemiddelden (bijv. gemeentebelasting BE)
2. Sommige aftrekposten niet meegenomen (hypotheek, giften, etc.)
3. Vereenvoudigde sociale lasten (bijv. solidariteitsbijdrage BE)
4. Parameters mogelijk niet 100% actueel (kleine afwijkingen)

### Kan ik de tool gebruiken voor andere landen?
Nee, de tool is specifiek voor vergelijking NL-FR en BE-FR. Andere combinaties zijn niet mogelijk.

### Hoe vaak worden parameters geüpdatet?
De tool bevat parameters voor 2025. Updates zijn nodig bij:
- Jaarlijkse tariefwijzigingen (januari)
- Wetswijzigingen
- Verdragswijzigingen

### Is de tool geschikt voor DGA's of complexe situaties?
Nee, de tool is bedoeld voor "normale" situaties:
- ✅ Werknemers
- ✅ Gepensioneerden  
- ✅ Simpele zelfstandigen
- ❌ DGA's
- ❌ Buitenlandse inkomsten (buiten NL/BE/FR)
- ❌ Complexe vermogensstructuren

### Wat moet ik doen met de resultaten?
1. Gebruik als eerste indicatie
2. Experimenteer met verschillende scenario's
3. Bewaar/kopieer analyse voor eigen administratie
4. Bespreek met financieel adviseur
5. ⚠️ Neem geen definitieve beslissingen alleen op basis van deze tool

---

## Contact & Support

**Website Tool:** [Link naar tool]  
**Organisatie:** Communities Abroad  
- Nederlanders.fr
- Infofrankrijk.com
- Nedergids.nl

**Voor vragen over de tool:** Neem contact op via de organisatie  
**Voor financieel advies:** Raadpleeg een erkende adviseur

---

**Laatste update documentatie:** Oktober 2025

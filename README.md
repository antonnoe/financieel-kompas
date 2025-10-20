# Financieel Kompas

Een educatieve webapplicatie voor het vergelijken van de financiële gevolgen van wonen in Frankrijk versus Nederland of België.

![Financieel Kompas Screenshot](https://github.com/user-attachments/assets/a8fe51ec-517b-4bab-92a5-3465d8829aa5)

## 📋 Overzicht

Financieel Kompas helpt gebruikers om de financiële impact te vergelijken van emigreren naar Frankrijk vanuit Nederland of België. De tool berekent:

- ✅ Netto inkomen na belastingen en sociale lasten
- ✅ Vermogensbelasting (NL Box 3, FR IFI)
- ✅ Financiële balans tussen landen
- ✅ Effect van verschillende scenario's (pensioen, kinderen, vermogen)

## 🎯 Voor Wie?

- 🏠 **Expats en emigranten** die overwegen te verhuizen naar Frankrijk
- 👴 **Gepensioneerden** met AOW, bedrijfspensioen of lijfrente
- 💼 **Werkenden** met salaris, winst uit onderneming of vermogensinkomsten
- 👨‍👩‍👧 **Gezinnen** die het effect van kinderen willen vergelijken (quotient familial)
- 💰 **Vermogende particulieren** met financieel vermogen of vastgoed

## 🚀 Gebruik

### Online Versie
Open gewoon `index.html` in een moderne browser. Geen installatie nodig!

### Lokaal Draaien
```bash
# Clone de repository
git clone https://github.com/antonnoe/financieel-kompas.git

# Open de tool
cd financieel-kompas
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

Of gebruik een lokale webserver:
```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

## 🔒 Privacy

- ✅ **100% lokaal**: Alle berekeningen in uw browser
- ✅ **Geen opslag**: Niets wordt opgeslagen op servers
- ✅ **Geen tracking**: Geen cookies, analytics of tracking
- ✅ **Anoniem**: Data verlaat uw computer niet

## 📊 Functionaliteiten

### Inkomstenbronnen (per partner)
- Salaris/loon uit loondienst
- Winst uit onderneming (zelfstandigen)
- AOW/staatspensioen (NL/BE)
- Overheidspensioen (ABP, ambtenaren)
- Particulier pensioen (bedrijfspensioen)
- Lijfrente (met keuze startleeftijd)
- Vermogensinkomen (dividend, rente)

### Vermogen
- Financieel vermogen (spaargeld, beleggingen)
- Vastgoed (excl. hoofdverblijf)

### Scenario's
- Alleenstaand of partners
- 0-5 kinderen ten laste
- Huidige of toekomstige datum (emigratie/pensioen)
- Verschillende landen (NL of BE vergelijken met FR)

## 📈 Wat wordt berekend?

### Nederland (NL)
- Inkomstenbelasting (Box 1) met heffingskortingen
- Zvw-bijdrage voor ondernemers
- Box 3 vermogensbelasting (forfaitair rendement)

### Frankrijk (FR)
- Inkomstenbelasting met Quotient Familial
- Sociale lasten (CSG, CRDS, etc.)
- PFU (Flat Tax) op vermogensinkomen
- IFI vermogensbelasting (vastgoed >€1.3M)
- Belastingkredieten (hulp aan huis)

### België (BE)
- Federale personenbelasting met vrijstellingen
- RSZ sociale lasten
- Gemeentebelasting (gemiddelde)
- Roerende voorheffing
- BSZB (Bijzondere Sociale Zekerheidsbijdrage)

## ⚙️ Configuratie

Alle parameters staan in `config.json`:
- Belastingtarieven en -schijven
- Sociale lastpercentages
- Heffingskortingen en vrijstellingen
- AOW-bedragen en pensioencijfers

**Versie:** 2025 (geüpdatet voor belastingjaar 2025)

## 📚 Documentatie

- **[VERIFICATION_REPORT.md](VERIFICATION_REPORT.md)**: Uitgebreide verificatie van alle berekeningsgrondslagen
- **[TOOL_DESCRIPTION.md](TOOL_DESCRIPTION.md)**: Gedetailleerde beschrijving van functionaliteiten en gebruik

## ⚠️ Disclaimer

**Dit is een educatieve tool en geen financieel advies.**

De berekeningen zijn gebaseerd op vereenvoudigde en gestandaardiseerde fiscale regels. Raadpleeg altijd een gekwalificeerde financieel adviseur voor uw persoonlijke situatie.

### Wat zit er NIET in?

De tool focust op hoofdlijnen en neemt **niet** mee:
- Toeslagen (zorg, huur, kinderen)
- Kinderbijslag / Groeipakket / Allocations Familiales
- Hypotheekrenteaftrek
- Lokale belastingen (taxe d'habitation, taxe foncière)
- Erfbelasting / schenkbelasting
- Inflatie en toekomstige wijzigingen
- Complexe inkomsten (DGA, niet-recreatieve verhuur)

## 🔧 Technische Details

### Bestanden
- `index.html`: Gebruikersinterface
- `script.js`: Berekeningslogica (JavaScript)
- `style.css`: Styling
- `config.json`: Parameters en tarieven

### Browser Vereisten
- Moderne browser (Chrome, Firefox, Safari, Edge)
- JavaScript ingeschakeld
- Geen internet vereist na laden

### Hosting
Kan gehost worden op:
- GitHub Pages
- Netlify
- Vercel
- Elke statische webhost

## 📝 Updates & Onderhoud

### Jaarlijkse Updates (januari)
De volgende parameters moeten jaarlijks geüpdatet worden:
- NL: Box 1 tarieven, Box 3 vrijstellingen, AOW-bedragen, heffingskortingen
- FR: Inkomstenbelasting schijven, quotient plafond, IFI drempels
- BE: Federale schijven, vrijstellingen, RSZ percentages
- Sociale lasten: Zvw, CSG/CRDS, RSZ

### Recent Geüpdatet (Oktober 2025)
- ✅ AOW-bedragen 2025: €19,527 (alleenstaand), €13,423 (partners)
- ✅ Box 1 schijfgrens: €75,624
- ✅ Arbeidskorting afbouw start: €42,032
- ✅ Toegevoegd: Versie-informatie in config.json

## 🐛 Bekende Issues

Geen kritieke bugs bekend. Zie [VERIFICATION_REPORT.md](VERIFICATION_REPORT.md) voor kleine verbeterpunten.

## 🤝 Bijdragen

Dit is een educatief project. Voor vragen of suggesties, neem contact op via Communities Abroad.

## 📄 Licentie

© Communities Abroad  
Ontwikkeld voor Nederlanders.fr, Infofrankrijk.com en Nedergids.nl

## 🔗 Links

- **Communities Abroad**: Service-organisatie voor Nederlanders in het buitenland
- **Nederlanders.fr**: Community voor Nederlanders in Frankrijk
- **Infofrankrijk.com**: Informatie over Frankrijk
- **Nedergids.nl**: Nederlandse gids

## 📞 Contact

Voor vragen over:
- **De tool**: Via Communities Abroad
- **Financieel advies**: Raadpleeg een erkende adviseur
- **Bug reports**: Open een issue op GitHub

---

**Versie:** 2025  
**Laatste update:** Oktober 2025  
**Status:** Actief onderhouden

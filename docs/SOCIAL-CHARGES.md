# Social charges module (voorstel)

Doel
- Centraliseer berekeningen voor sociale lasten (werknemer + werkgever + zelfstandige) per land.
- Maak percentages configureerbaar per jaar.
- Zorg voor duidelijke breakdowns in UI (employee, employer, total).

Bestanden
- assets/modules/social-charges.js — core berekeningen (stateless).
- assets/config/social-params-2025.json — configuratie / aannames voor 2025.
- assets/tests/test-social-charges.js — eenvoudige smoke tests.

Hoe lokaal testen
1. Checkout branch:
   git fetch origin
   git checkout -b feat/social-charges finish-extract-engine

2. Voeg bestanden toe (als je nog niet gepusht):
   git add assets/modules/social-charges.js assets/config/social-params-2025.json assets/tests/test-social-charges.js docs/SOCIAL-CHARGES.md
   git commit -m "feat(landing): add social-charges module + config + tests"
   git push -u origin feat/social-charges

3. Run smoke tests (node):
   node assets/tests/test-social-charges.js

Integratie (kort)
- In script.js of de hoofdcalculator: importeer de module en vervang verspreide berekeningen met:
   const Social = SocialCharges(SOCIAL_CONFIG);
   const social = Social.calcEmployeeSocial(country, amounts, SOCIAL_CONFIG);

Notities
- Percentages in config zijn placeholders/aannames. Moet worden gevalideerd met officiële bronnen (URSSAF, Belastingdienst, RSZ/ONSS).
- Voor zelfstandigen en werkgevers is aanvullende logic nodig (schijven, max-grenzen). Dit voorstel is een eerste, testbare stap.

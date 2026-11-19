# Projektregler: Skrivcoach

Bygg en fristående skrivcoach för argumenterande text i svenska årskurs 9. Eleven äger sin text och utför alla ändringar själv. Återanvänd inte filer eller instruktioner från andra projekt utan uttryckligt godkännande.

## Icke förhandlingsbara principer

- AI:n får aldrig skriva eller ersätta elevens text.
- Följ samma formspråk som matematikvyn (se `docs/design.md`): lila rubriker på whiteboarden, Edda som figur med pratbubbla och blå huvudknappar. Whiteboarden behåller sin mörka ram med markerade hörn och vita yta; varken den eller skrivytan har rutnät. Introducera inte en ny designidentitet.
- Använd det lokalt bundlade typsnittet Patrick Hand på whiteboarden; ändra inte skrivytans typsnitt.
- På breda skärmar ska whiteboarden ta cirka 40 procent och skrivytan 60 procent; stapla panelerna på smalare skärmar.
- Alla moment ska följa modellering, träning, återkallning, självkontroll och slutbedömning.
- Lektionen är guidad: eleven går framåt ett steg i taget och Edda bestämmer om skrivytan visar exempeltexten eller elevens egen text. Fri navigering (`?fri`) är bara till för visning och granskning.
- Whiteboarden ska stämma av elevens förståelse med ett valbart alternativ eller ett eget svar i varje lektionssteg.
- Hitta inte på kursplans- eller betygskriterier. En AI-analys är inte ett officiellt betyg.
- OpenAI-anrop får bara ske via servern efter elevens uttryckliga handling. Gränssnittet visar ingen särskild upplysning om OpenAI.
- API-nycklar får aldrig läsas in i klienten, loggas eller läggas till i versionshantering. Använd aldrig verkliga elevtexter i tester.
- Återkoppling är vägledande, inte betyg. AI:n får aldrig skriva eller ersätta elevens text.

## Dokumentationskarta

Produkt, pedagogik, design, AI-beteende, bedömning, arkitektur och roadmap beskrivs i [`docs/`](./docs/). Testplanen finns i [`docs/test-plan.md`](./docs/test-plan.md). Håll denna fil kort och ändra dokumentet med ämnesdetaljen i stället för att duplicera innehåll här.

## Teknisk arbetsgång

- Frontend: React, TypeScript och Vite.
- AI-anrop ska gå via server/API-lagret; hemligheter får aldrig finnas i klienten.
- Validera användarinnehåll och modellresultat; bind textmarkeringar till rätt textversion.
- Den lokala OpenAI-servern är inte redo att exponeras publikt utan autentisering, dataskyddsgranskning och starkare missbruksskydd.
- Skriv tester för nytt beteende och kör `npm test`, `npm run test:e2e` och `npm run build` när relevant.
- Håll ändringar små, följ befintliga mönster och uppdatera relaterad dokumentation.

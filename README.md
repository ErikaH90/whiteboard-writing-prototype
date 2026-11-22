# Skrivcoach

En fristående prototyp för en AI-driven skrivcoach som hjälper elever i årskurs 9 att skriva argumenterande text. Eleven skriver och bearbetar texten själv; coachen ska undervisa och ge stegvis återkoppling, inte skriva åt eleven.

## Kom igång

Kräver Node.js 20 eller senare.

```sh
npm install
npm run dev
```

Bygg produktionsversionen med `npm run build`.
Starta den lokala servern med `npm start` efter bygget.

Visningsversionen på Netlify beskrivs i `docs/architecture.md`; nycklarna läggs in som miljövariabler i Netlify.

Kör automatiserade tester med `npm test`. Kör webbläsartestet med `npm run test:e2e`.

## Prototypens omfattning

- Sex undervisningsmoment med stegen modellering, träna själv, återkallning, självkontroll och slutbedömning.
- Whiteboarden stämmer av elevens förståelse i varje steg. Eleven väljer alternativ eller skriver fritt beroende på uppgiften; gränssnittet visar inte båda samtidigt.
- Responsiv tvåkolumnslayout inspirerad av den angivna referensbilden.
- Elevtext sparas lokalt i webbläsaren på den aktuella enheten.
- OpenAI ger vägledande återkoppling vid textgranskning och lektionsavstämningar. AI:n skriver inte om texten och sätter inget betyg.
- Utkastet är alltid redigerbart; eleven kan be om tips kopplade till det aktuella lektionsmomentet och hoppa från ett tips till det citerade textstället.
- Text skickas till OpenAI först när eleven väljer **Granska** eller **Svara**. Den lokala servern använder `OPENAI_API_KEY` från rotens `.env.local`.
- Lägg aldrig till nyckeln i en klientvariabel med `VITE_`-prefix. `.env.local` är ignorerad av Git; använd `.env.example` som mall.
- Eleven bör inte skriva personuppgifter. Kontrollera skolans och vårdnadshavares dataskyddskrav innan verklig elevanvändning.
- API-servern är avsedd för lokal utveckling. Exponera den inte publikt utan autentisering och en genomförd dataskyddsgranskning.

## Dokumentation

- [Projektregler](./CLAUDE.md)
- [Produktbeskrivning](./docs/product.md)
- [Pedagogisk modell](./docs/pedagogy.md)
- [Designprinciper](./docs/design.md)
- [AI-beteende](./docs/ai-behavior.md)
- [Bedömning och styrdokument](./docs/assessment.md)
- [Teknisk arkitektur](./docs/architecture.md)
- [Roadmap](./docs/roadmap.md)
- [Testplan](./docs/test-plan.md)

Läs [CLAUDE.md](./CLAUDE.md) innan du fortsätter utveckla projektet.

# Teknisk arkitektur

## Nuvarande arkitektur

- React och TypeScript renderas av Vite.
- `src/App.tsx` samordnar arbetsytan och dess gränssnitt.
- `src/data/lessons.ts` innehåller lektionsdata och gemensamma lektionssteg.
- `src/lib/coachApi.ts` validerar svar från serverns coach-API innan de visas.
- `src/components/LessonCheckIn.tsx` skickar avstämningssvar och visar coachens återkoppling.
- `server/api.mjs` validerar förfrågningar, anropar OpenAI och kontrollerar modellens citerade textspann.
- I utveckling monterar Vite API:t på samma origin. `server/index.mjs` serverar den byggda appen och API:t lokalt.
- Elevtext sparas i webbläsarens `localStorage` på aktuell enhet.
- API-nyckeln hämtas server-side från `OPENAI_API_KEY` i `.env.local` eller driftmiljön.

## Lokal utveckling och gränser

- `npm run dev` startar Vite med lokala API-mellanprogram.
- `npm run build && npm start` bygger och startar lokal server på `127.0.0.1:3000`.
- Serverns grundläggande origin- och IP-begränsningar är inte tillräckligt skydd för offentlig drift. Lägg inte servern på ett publikt nät utan autentisering, missbruksskydd och dataskyddsgranskning.
- Modellnamn kan ändras server-side med `OPENAI_MODEL`; standard är `gpt-4o-mini`.
- ElevenLabs är inte anslutet.

## Testlager

- Vitest för enhets- och komponenttester.
- React Testing Library för användarbeteende i gränssnittet.
- Playwright för ett begränsat end-to-end-flöde i webbläsare.
- Syntetiska testtexter; använd aldrig verkliga elevtexter i fixtures.

## Dataflöde

1. Eleven väljer **Få återkoppling** eller **Svara**.
2. Klienten skickar endast aktuell text, lektionsmål och nödvändigt svarsinnehåll till samma-origin-servern.
3. Servern validerar storlek och fält, skickar underlaget till OpenAI och kräver strukturerat JSON.
4. Servern verifierar att framgångscitat och markerade citat kan bindas till säkra spann i elevtexten och skickar endast godkänt resultat tillbaka.
5. Inga elevtexter skrivs till serverloggar eller serverdatabas av denna MVP. Leverantörens hantering omfattas av OpenAI:s villkor.

Före pilot måste skolan besluta om personuppgiftsbehandling, information/samtycke, lagring/gallring, åtkomstkontroll och publicering av servern.

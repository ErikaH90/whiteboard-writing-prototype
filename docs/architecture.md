# Teknisk arkitektur

## Nuvarande arkitektur

- React och TypeScript renderas av Vite.
- `src/App.tsx` samordnar arbetsytan och dess gränssnitt.
- `src/data/lessons.ts` innehåller lektionsdata och gemensamma lektionssteg.
- `src/lib/coachApi.ts` validerar svar från serverns coach-API innan de visas.
- `src/components/LessonCheckIn.tsx` skickar avstämningssvar och visar coachens återkoppling.
- `src/components/LessonEntryCheck.tsx` samlar en explicit förkunskaps-/återkallningssignal före varje kapitel.
- `src/components/FinalRecall.tsx` visar fem stödfria återkallningsfrågor före diagnosen; svaren hålls endast i React-minne.
- `src/lib/learnerProfile.ts` håller en lokal, versionshanterad demo-profil med summerade lärsignaler och ett frivilligt ämnesintresse. Råa svar lagras inte i profilen.
- `src/lib/demoSubmissions.ts` sparar diagnoser först efter elevens uttryckliga inlämning till den lokala demo-lärarvyn.
- `server/api.mjs` validerar förfrågningar, anropar OpenAI och kontrollerar modellens citerade textspann.
- `/api/example` kan skapa korta fiktiva exempel men anropas inte längre av klienten, eftersom ämnesanpassade exempel är borttagna ur gränssnittet.
- `/api/exemplar-audio` läser upp kursens fasta exempeltext via ElevenLabs efter elevens val. Endast exempeltextens id tas emot; nyckeln hämtas server-side från `ELEVENLABS_API_KEY`.
- I utveckling monterar Vite API:t på samma origin. `server/index.mjs` serverar den byggda appen och API:t lokalt.
- Elevtext sparas i webbläsarens `localStorage` på aktuell enhet.
- Tränade utkast autosparas lokalt. Lärprofilen sparas i `localStorage` i demoläget och innehåller endast summerade antal/senaste signaler, inte råa svar. Diagnosutkast sparas först lokalt efter uttrycklig inlämning till demo-lärarvyn.
- Demo-lärarvyn och lokala profil-/diagnosdata saknar autentisering och är endast avsedda för syntetiska texter i samma webbläsare. Detta är inte en verklig läraröverföring eller en godkänd lagringslösning.
- API-nyckeln hämtas server-side från `OPENAI_API_KEY` i `.env.local` eller driftmiljön.

## Lokal utveckling och gränser

- `npm run dev` startar Vite med lokala API-mellanprogram.
- `npm run build && npm start` bygger och startar lokal server på `127.0.0.1:3000`.
- Serverns grundläggande origin- och IP-begränsningar är inte tillräckligt skydd för offentlig drift. Lägg inte servern på ett publikt nät utan autentisering, missbruksskydd och dataskyddsgranskning.
- Modellnamn kan ändras server-side med `OPENAI_MODEL`; standard är `gpt-4o-mini`.
- ElevenLabs används server-side för uppläsning (`ELEVENLABS_API_KEY`).

## Visningsversion på Netlify

- `netlify.toml` bygger `dist` och kör samma Express-app som en Netlify-funktion (`netlify/functions/api.mjs`); `/api/*` skrivs om till funktionen.
- Nycklarna läggs in som miljövariabler i Netlify (`OPENAI_API_KEY`, `ELEVENLABS_API_KEY`), aldrig i versionshanteringen.
- Visningsversionen saknar inloggning. Alla som har länken kan använda AI och röst på kontonas bekostnad, och anropsgränsen gäller bara per funktionsinstans. Den är bara till för visning med påhittade texter, inte för elever. Sätt en utgiftsgräns hos OpenAI och ElevenLabs och ta ner sajten när den inte behövs.

## Testlager

- Vitest för enhets- och komponenttester.
- React Testing Library för användarbeteende i gränssnittet.
- Playwright för ett begränsat end-to-end-flöde i webbläsare.
- Syntetiska testtexter; använd aldrig verkliga elevtexter i fixtures.

## Dataflöde

1. Eleven väljer **Få återkoppling**, **Svara** eller **Skapa exempel med valt ämne**.
2. Klienten skickar efter ett uttryckligt val aktuell text/svar eller ett exempelunderlag. Exempelunderlaget innehåller inte elevtext; det innehåller lektionsmål, valt intresse och summerade lärsignaler. Råa tidigare svar skickas inte.
3. Servern validerar storlek och fält, skickar underlaget till OpenAI och kräver strukturerat JSON.
4. Servern verifierar att framgångscitat och markerade citat kan bindas till säkra spann i elevtexten och skickar endast godkänt resultat tillbaka.
5. Inga elevtexter skrivs till serverloggar eller serverdatabas av denna MVP. Leverantörens hantering omfattas av OpenAI:s villkor.

Slutdiagnosens återkallningssvar gör inget API-anrop. Efter diagnosen kan eleven separat begära granskning; servern kontrollerar att fyndens kategorier och textspann är giltiga. Klienten använder en giltig kategori för att länka till ett befintligt undervisningsmoment. Först efter en separat inlämningshandling sparas texten och eventuell AI-återkoppling i den lokala demo-lärarvyn; detta simulerar inte säker leverans till en lärare.

Före pilot måste skolan besluta om autentisering och elev-/lärarkoppling, personuppgiftsbehandling, information/samtycke, lagring/gallring, åtkomstkontroll och publicering av servern. Ersätt demo-lärarvyn med en autentiserad serverbaserad inlämning till elevens tilldelade lärare; exponera inte lokal demo-lagring publikt.

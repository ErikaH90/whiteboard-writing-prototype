# Roadmap

Roadmapen beskriver ordningen för produktbeslut, inte ett löfte om leveransdatum.

## MVP – grund och kvalitet

- Dokumentera produkt, pedagogik, design, bedömning och tekniska gränser.
- Behåll sexmomentflödet, egen skrivyta och responsiv referensdesign.
- Bevara summerade, lokala demoprofil-signaler per färdighet och anpassa frågenivå, exempelkomplexitet och stöd; endast syntetiska elevtexter.
- Låt eleven frivilligt välja exempelämne och begära korta fiktiva AI-exempel utan att skicka elevens text.
- Demonstrera explicit inlämning av slutdiagnos till en lokal lärarvy; märk den tydligt som osäker demo och använd endast syntetiskt innehåll.
- Lägg in stödfria återkallningsfrågor för alla delförmågor före en ny ämneskontext i slutdiagnosen.
- Håll diagnosutkast och lärsignaler separata från det autosparade träningsutkastet; efter frivillig diagnosåterkoppling länkas ett fynd till ett befintligt övningsmoment.
- Testa lektionsstruktur, oförändrad elevtext, markeringar och huvudflöde.
- Anslut OpenAI via ett lokalt server/API-lager med strukturerade svar och exakta textspann.
- Granska lektionsinnehåll med ämneslärare.

## Före pilot

- Besluta om personuppgiftsbehandling, information/samtycke, leverantörsvillkor och skolans lokala krav.
- Granska AI-svaren på syntetiska, lärargranskade exempel.
- Besluta om skolans autentisering och lärar-/elevkoppling; implementera serverbaserad, åtkomstkontrollerad inlämning och gallring innan verklig lärarleverans eller publik drift.
- Definiera tillgänglighets- och användbarhetskontroller för surfplatta.

## Senare, efter godkända beslut

- Anpassa API-servern för säker, autentiserad drift.
- Utöka regressionstester med godkända syntetiska fall.
- Utvärdera återkopplingens relevans, falska markeringar och pedagogiska nytta.
- Utred eventuellt tidsstyrd repetition mellan sessioner först efter beslut om elevkonton, samtycke, lagring och gallring.
- Ersätt lokal demo-lärarvy med säker skolalärarvy och lägg till elevkonton först efter godkända beslut.

## Öppna beslut

- Leverantörsvillkor, godkänd modell och säker produktionsdrift.
- Hur elevtexter ska lämnas till rätt lärare och hur länge profil, diagnos och AI-återkoppling får sparas.
- Vilka lärare som granskar lektionsinnehåll och testfall.
- Vilka produktmått som ska användas vid en eventuell pilot.
- Hur den lokala demoprofilen ska kopplas till en autentiserad elevidentitet, synkas säkert och gallras i en framtida skolpilot.

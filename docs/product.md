# Produktbeskrivning

## Syfte

Skrivcoach hjälper elever i årskurs 9 att lära sig skriva och bearbeta argumenterande texter. Eleven äger texten och genomför själv alla ändringar. AI:n ska fungera som en pedagogisk coach, inte som textförfattare.

## Målgrupp och användningssituation

- Primär målgrupp: elever i årskurs 9 som arbetar med argumenterande text i svenska.
- Sekundär målgrupp: lärare som behöver förstå mål, stöd och återkoppling.
- Huvudflöde: eleven går igenom sex undervisningsmoment, skriver i en egen skrivyta och granskar sin text med stöd av whiteboarden.

## MVP

- Sex sammanhängande skrivmoment med gemensam femstegsmodell och en kort förkunskaps-/återkallningsfråga före modelleringen.
- Begränsad anpassning av återkallningsfrågor och stödnivåer utifrån elevens svar och en lokal, summerad demoprofil.
- En lokal demoprofil som bevarar sammanfattade färdighetssignaler mellan besök. Endast syntetiska texter får användas i denna prototyp.
- Elevstyrd generering av korta fiktiva exempel, där AI-anropet får färdighet, lektionsmål, valt ämne och summerade signaler men inte elevens utkast.
- Kort avstämningsfråga i varje lektionssteg, med valbara alternativ eller eget textsvar.
- Tvåkolumnsvy med undervisningswhiteboard till vänster och elevens skrivyta till höger.
- Ett pågående elevutkast med en frivillig, lektionsanpassad formativ loop: producera, få återkoppling och revidera själv.
- En femdelad, kapitelanpassad exit ticket i de första fem kapitlen. Före slutdiagnosen genomför eleven en återkallningsrunda utan stöd över fem delförmågor; svaren skickas inte till AI.
- En självständig slutdiagnos i enbart skrivytan, med en ny skrivkontext och ett tomt separat utkast. Valfri AI-återkoppling efteråt kan rekommendera ett befintligt moment för fortsatt övning.
- En explicit lokal demo-inlämning av sluttext och eventuell AI-återkoppling till en lärarvy i samma webbläsare.
- Lokal autosparning endast för det tränade utkastet. Kunskapssignaler och diagnosutkast sparas inte beständigt.
- Serverbaserad OpenAI-återkoppling vid textgranskning och avstämningar, med elevens uttryckliga handling.
- Formativ återkoppling som pekar på textställen och bjuder in eleven att tänka vidare.
- Responsiv layout för dator och surfplatta.

## Inte ingår ännu

- Produktionsgodkänd AI-tjänst, elevkonton, autentiserad läraröverföring eller molnlagring. Demo-lärarvyn är inte en verklig säker lärarkanal. Den lokala AI-integrationen är inte godkänd för verklig elevanvändning innan dataskydd och åtkomstskydd har granskats.
- Officiell betygsättning eller automatisk betygsrekommendation.
- Säker mätning av elevens kunskapsnivå, schemaläggning av repetition över flera dagar eller en säker, elevbunden profil.
- Samarbete mellan elever eller säker, autentiserad lärargranskning av elevtexter.

## Framgång för MVP

Eleven förstår uppgiften, kan skriva utan att AI:n tar över, får begripliga och relevanta frågor om sin text och kan själv välja vad hen vill bearbeta. Mätning och utvärdering ska beslutas med lärare innan en pilot.

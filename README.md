# LF Interactive file map — web

Verejná statická aplikácia pre interaktívnu mapu súborov. Tento repo obsahuje iba frontend, prázdny inventár a syntetické demo. Interné dokumenty, ich názvy/odkazy, originálne exporty, backend, udalosti ani credentials tu nie sú.

## Použitie

1. Otvor nasadenú stránku.
2. **Importovať graf** načíta vlastný JSON a uloží ho v IndexedDB tohto prehliadača; nikam ho neposiela. Pri ďalšom otvorení sa obnoví aj dátum importu.
3. Použi search, filtre, archív a detail uzla/väzby. **Demo aktivity** ukazuje iba syntetické read/write udalosti.
4. **Pripojiť službu** je pripravené rozhranie pre samostatný autentifikovaný HTTPS backend. Vercel read-only služba používa krátkodobý bearer token iba v pamäti a kontrolu inventára každých 60 sekúnd; starší SSE adaptér zostáva podporovaný. Provider refresh má vlastný interval a čas snapshotu. Žiadny backend nie je týmto repo nasadený; globálne Codex/connector operácie sa nesledujú.

Graf je dostupný iba v rovnakom profile prehliadača a na rovnakom zariadení. Vymazanie údajov webu alebo anonymné okno môže vyžadovať nový import. **Vymazať uložený graf** odstráni lokálnu kópiu. Home / Reset ju zachová. Dátum importu nie je čas aktualizácie zdrojových dát; automatická synchronizácia zatiaľ nie je napojená.

## Build a hosting

Node.js 22+, bez npm dependencies. `npm run check` a `npm run build`. Build vytvorí dist iba z pevného allowlistu frontendu a vždy prepíše verejný inventár na prázdny graf.

GitHub Pages: Settings → Pages → Source: **GitHub Actions**. Workflow po pushi na main overí model/build, nahrá dist a nasadí Pages. Pre verejný repo sa používa bezplatná dostupnosť Pages; interný projekt zostáva oddelene súkromný.

Nevkladaj interný inventár do tohto verejného repo ani do jeho histórie. Na prácu s vlastnými dátami použi lokálny browser import alebo zabezpečený backend. Do web/config.json patrí iba verejná adresa služby, nikdy token ani heslo.

## Skutočné udalosti

Ak služba pri prihlásení oznámi nakonfigurovaný event journal, stránka načíta trvalú históriu a kontroluje nové udalosti každých päť sekúnd. Iba zapojené read/write/transfer adaptéry vytvárajú tieto záznamy; nejde o automatické sledovanie všetkých AI chatov. Aktívna operácia má smerovú animáciu, čerstvé dokončenie samostatný výsledkový ťah a historický replay nepredstiera aktuálne vykonávanie. Pri výpadku histórie sa animácia pozastaví. Detaily zobrazujú hash/readback dôkazy reportované adaptérom. Reduced motion zachováva stavy/históriu bez animácie. Prihlasovacie údaje zostávajú mimo verejného repo.

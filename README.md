# LF Interactive file map — web

Verejná statická aplikácia pre interaktívnu mapu súborov. Tento repo obsahuje iba frontend, prázdny inventár a syntetické demo. Interné dokumenty, ich názvy/odkazy, originálne exporty, backend, udalosti ani credentials tu nie sú.

## Použitie

1. Otvor nasadenú stránku.
2. **Importovať graf** načíta vlastný JSON iba do pamäte prehliadača; nikam ho neposiela.
3. Použi search, filtre, archív a detail uzla/väzby. **Demo aktivity** ukazuje iba syntetické read/write udalosti.
4. **Pripojiť službu** je pripravené rozhranie pre samostatný autentifikovaný HTTPS backend. Žiadny backend nie je týmto repo nasadený; globálne Codex/connector operácie sa nesledujú.

## Build a hosting

Node.js 22+, bez npm dependencies. `npm run check` a `npm run build`. Build vytvorí dist iba z pevného allowlistu frontendu a vždy prepíše verejný inventár na prázdny graf.

GitHub Pages: Settings → Pages → Source: **GitHub Actions**. Workflow po pushi na main overí model/build, nahrá dist a nasadí Pages. Pre verejný repo sa používa bezplatná dostupnosť Pages; interný projekt zostáva oddelene súkromný.

Nevkladaj interný inventár do tohto verejného repo ani do jeho histórie. Na prácu s vlastnými dátami použi lokálny browser import alebo zabezpečený backend. Do web/config.json patrí iba verejná adresa služby, nikdy token ani heslo.

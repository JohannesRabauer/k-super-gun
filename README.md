# Super Gun

Ein actionreiches 3D-Einzelspieler-Kampfspiel im Browser, gebaut mit [Three.js](https://threejs.org/), Vite und TypeScript.

Wähle einen von 5 Charakteren (Panda, Puma, Koala, Biber, Schwein), kämpfe gegen KI-Gegner, sammle Erfahrung, steige im Level auf und schalte neue Bereiche frei.

## Entwicklung

```bash
npm install
npm run dev
```

## Produktions-Build

```bash
npm run build
npm run preview
```

## Deployment

Bei jedem Push auf `main` baut die GitHub Action unter `.github/workflows/deploy.yml`
das Spiel automatisch und veröffentlicht es auf GitHub Pages.

Damit das funktioniert, muss in den Repository-Einstellungen unter
**Settings → Pages → Source** die Option **GitHub Actions** ausgewählt sein.

Die App wird unter `https://<owner>.github.io/k-super-gun/` erreichbar sein
(der Pfad `base` in `vite.config.ts` ist entsprechend gesetzt).

## Steuerung

- **Desktop:** WASD zum Bewegen, Maus zum Zielen, Maustaste halten zum Angreifen.
- **Mobil:** Blauer Joystick zum Bewegen, roter Joystick zum Zielen/Angreifen (mit Auto-Aim-Unterstützung).

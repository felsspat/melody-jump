# Melody Jump – Hinweise für Claude

Browser-Jump-&-Run, bei dem man den Läufer nicht direkt steuert, sondern **Musik macht**. Maus-X ist die
Tonhöhe, Maus-Y die Lautstärke; alternativ eine Klavierbelegung auf der Tastatur. Wie harmonisch und
taktgenau gespielt wird („Resonanz“ 0–100), bestimmt Sprunghöhe, Leben, Schild usw.
TypeScript + Canvas 2D + Web Audio, Vite, **kein Backend**.

## Befehle (Node läuft in WSL, nicht unter Windows!)

```bash
wsl -e bash -lc "source ~/.nvm/nvm.sh && cd /mnt/c/Users/devri/git/melody-jump && npx tsc --noEmit"
wsl -e bash -lc "source ~/.nvm/nvm.sh && cd /mnt/c/Users/devri/git/melody-jump && npx vitest run"
wsl -e bash -lc "source ~/.nvm/nvm.sh && cd /mnt/c/Users/devri/git/melody-jump && npm run build"
wsl -e bash -lc "source ~/.nvm/nvm.sh && cd /mnt/c/Users/devri/git/melody-jump && npm run dev"   # http://localhost:5173
```

- `node_modules` enthält Linux-Binaries (esbuild/rollup). `npm` also nie aus Windows starten.
- Der Dev-Server nutzt File-Polling (`vite.config.ts`), weil das Projekt auf `/mnt/c` liegt.
- Ich habe keinen Browser. Optik, Klang und Spielgefühl muss der Mensch prüfen; das im Ergebnis ehrlich so sagen.

## Samples („Echte Instrumente“)

- **Standard ist der Synthesizer.** Auf dem Startbildschirm kann man „Klang: 🎸 Echte Instrumente“
  wählen; die Wahl wird gespeichert.
- **Dateien:** `public/samples/` (ca. 5 MB, ca. 165 MP3s + `manifest.json`), erzeugt von `scripts/fetch-samples.mjs`.
  Klavier und Saxophon haben zusätzlich leise/laute Aufnahmen (`soft-60.mp3`, `loud-60.mp3`, im Manifest unter `layers`);
  `layerFor(velocity)` wählt sie aus. Die Bassdrum ist „drum_bass_hard“ von freesound.org (CC0, über Sonic Pi).
  Neu erzeugen mit `wsl -e bash -lc "source ~/.nvm/nvm.sh && cd /mnt/c/Users/devri/git/melody-jump && node scripts/fetch-samples.mjs"`.
  Das braucht Internet und `ffmpeg` in WSL.
- **Quellen:** VCSL (CC0) und FluidR3_GM über midi-js-soundfonts (CC BY 3.0). Die Namensnennung steht in
  `CREDITS.md` und unten auf dem Startbildschirm (`title.credits`) – nicht entfernen.
- **VCSL-Benennung liegt eine Oktave tiefer:** Die Datei „C4“ klingt als C5. Das ist per Spektrum belegt; das Skript
  korrigiert es um +12. Die Tonhöhenmessung (YIN) im Skript dient nur der Plausibilitätsprüfung (Tonklasse),
  weil sie bei Saxophon, Orgel und Verzerrung oft eine Oktave danebenliegt.
- **Code:**
  - `src/audio/SampleBank.ts`: Laden, nächstgelegenes Sample per `playbackRate`, `PLAYER_INSTRUMENTS` je Stil
    (`undefined` = Synthesizer, z.B. bei House & Techno). Hip-Hop und House nutzen immer Drumcomputer-Klänge aus `Backing.ts`.
  - `Backing.ts`: jede Instrument-Methode prüft zuerst `this.sampled`.
  - `Synth.ts`: spielt bei `instrument()` ein Sample.
- **Fehlerfall:** Wenn etwas nicht lädt, bleibt alles automatisch beim Synthesizer (`state: 'failed'`).

## Konventionen (vom Nutzer gewünscht)

- **Code, Kommentare und Bezeichner auf Englisch.** Die README und `docs/` sind auf Deutsch.
- **Alle sichtbaren Texte stehen in `src/i18n/texts.json`**, jeder Eintrag als `{ "de": …, "en": … }`.
  - Im Code nur über `t(key, params)` bzw. `tl(key)` (Listen) aus `src/i18n/i18n.ts`.
  - Platzhalter schreibt man als `{name}`.
  - Links stehen als `"Label|URL"`.
  - Notennamen sind lokalisiert (deutsch: H statt B) über `pcName()` und `noteName()`. Akkordnamen sind Getter, damit sie dem Sprachwechsel folgen.
  - Der Test `has every text in every language` findet fehlende Übersetzungen.
- **Wikipedia-Links vor dem Einbauen per `curl` prüfen** (Status 200, richtiger Artikel), jeweils de und en.
- **Melodien nur gemeinfrei** (EU: 70 Jahre nach dem Tod) oder selbst komponiert. Siehe `docs/kampagnen-plan.md`.
- Der Nutzer will beim Lernen an die Hand genommen werden. Neue Spielmechaniken brauchen deshalb immer:
  - eine Erklärung im Coach (`src/music/explain.ts`),
  - wo sinnvoll ein Kapitel in „Musik verstehen“ (`theory.sections` + `THEORY_SECTIONS`),
  - Fachbegriffe wie „Zwischendominante“ immer erklären.

## Architektur

| Bereich | Dateien |
|---|---|
| Audio | `src/audio/AudioEngine.ts` (Mixer, Latenz), `Clock.ts` (Lookahead-Scheduler, Achtel-Schritte, Tempowechsel), `Synth.ts` (Spielerstimme), `Sfx.ts` (Spielgeräusche aus Akkordtönen), `Backing.ts` (Band, ein Muster pro Stil) |
| Musik | `theory.ts` (Skalen, Dreiklänge, Septakkorde, `chordFromSpec("VI7")`), `Song.ts` (Abschnitte; endlos mit Generator oder endlich ohne → `endBeat`; ein Takt der Akkordfolge kann eine Liste sein, z.B. `['I', 'V7']` = halber Takt je Akkord), `melodies.ts` (Melodien als `[Halbtöne ab Grundton | null, Beats]`, optional mit Auftakt `pickup`)\| null, Beats]`), `styles.ts` (Stilregeln: Swing, Blue Notes, Timing-Gewichte, Betonungen), `HarmonyJudge.ts` (Bewertung pro Ton → Resonanz), `explain.ts` (Coach-Texte, Diagnose, Zwischendominanten) |
| Spiel | `src/game/Game.ts` (Zustände `title`/`map`/`styles`/`playing`/`paused`/`gameover`/`levelComplete`; Modi `run`/`tutorial`/`campaign`), `Tutorial.ts` (11 Schritte mit Lesepause), `Guide.ts` (Hilfe-Ringe: bekannte Melodie oder Akkordtöne) |
| Kampagne | `src/campaign/chapters.ts` (11 Kapitel × 3–4 Level; `styleLevels()` mit optionaler zweiter Melodie `<stil>-tune2`), `progress.ts` (Sterne, `localStorage` mit `try/catch`) |
| Welt | `src/world/physics.ts` (Sprünge in Beat-Zeit), `Level.ts` (Hindernis-Generator inkl. Pixelmonster, Notenmünzen und Notenblöcke, Endlos-Stile `RECIPES`, `INTRO_SECTIONS`, `melodySection()`), `Player.ts`, `Enemies.ts` |
| Darstellung | `src/render/Renderer.ts` (Klaviertasten-Spuren, Welt, Pixel-Mädchen aus `sprites.ts`), `Hud.ts` (HUD, Titel, Karte, Level-Ende, Flaggen), `NoteParticles.ts` |
| UI | `src/ui/TheoryPanel.ts` (HTML-Overlay „Musik verstehen“, Taste I), `CreditsPanel.ts` (Lizenzen & Quellen der Samples) |

## Fallstricke

- **Endliche Songs:** `Song.nextSection(last)` gibt denselben Abschnitt zurück. Schleifen über Abschnitte
  müssen bei `next === section` abbrechen, sonst friert alles ein (das war schon einmal ein Bug in `Guide.ts`).
- **Timing ist latenzkorrigiert:** `engine.audibleTime`, plus Nutzer-Offset über die Tasten `[`/`]`.
  Die Tasten sind physisch gemeint (`event.code`): auf einer deutschen Tastatur liegen dort `Ü` und `+`.
- **Akkord bei vorgezogenen Tönen:** Die Bewertung nutzt den Akkord bei `beat + 0.12`.
- **Notentasten:** Tasten, die Noten spielen (A–L, W–P, Z/Y), dürfen nur in Menüs andere Bedeutungen haben.
  Freie Befehlstasten: C (Coach), V (Ringe), I (Theorie), M (Band stumm), K (Kampagne im Titel),
  T (Tutorial), Q, R, L (Sprache im Titel), F3, `[`, `]`.
- **Neuer Stil:** Er braucht an folgenden Stellen etwas:
  - `StyleId` + `STYLES` in `styles.ts`
  - einen Fall in `Backing.onStep`
  - ein Spieler-Instrument in `PLAYER_INSTRUMENTS` (`SampleBank.ts`)
  - ein Kapitel in `chapters.ts`
  - ein Rezept in `RECIPES` und einen Eintrag in `ENDLESS_STYLES` (`src/world/Level.ts`) für den Endlos-Modus
  - Endlos-Auswahl: Das Raster hat `STYLE_GRID_COLS` Spalten (`Hud.ts`), Zahlentasten gibt es nur für die ersten zehn Karten
  - Texte unter `campaign.chapters.<id>`, `endless.styles.<id>` und `sections.<name>`
  - Coach-Text für das Timing (`timingText` in `explain.ts`) und einen Absatz in „Musik verstehen“ → Grooves
  - Tests: `tests/styles.test.ts` spielt *jeden* Melodie-Level perfekt mit und prüft die Band mit Fake-Audio
- **Neue Melodie:** Die Summe der Dauern muss Takte × Schläge ergeben (Test). Fremde Töne sind nur
  als Durchgangston erlaubt, also direkt danach ein Akkordton im Halb- oder Ganztonabstand.
  - Noten dürfen über den Taktstrich gehen (Haltebögen), nur die Summe zählt.
  - Mit Auftakt (`pickup`) muss die Melodie mit Pausen enden, die mindestens so lang sind wie der Auftakt (Test).
  - Melodien nicht aus dem Gedächtnis schreiben, sondern aus einer Notenquelle (ABC, Noten) übertragen und die Quelle im Kommentar nennen.
  - Abgelehnt, weil die EU-Gemeinfreiheit nicht belegt ist: „Frankie and Johnny“ (Fassung der Leightons 1908/12, Todesjahre unbekannt).

## Stand und Planung

Plan, Status, nächste Schritte und offene Fragen (u.a. Instrumenten-Samples) stehen in
**`docs/kampagnen-plan.md`**.

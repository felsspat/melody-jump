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
  Was noch nie auf echter Hardware lief (MIDI-Keyboard, Touch), ausdrücklich als ungetestet kennzeichnen.
- Python gibt es nur in WSL (`wsl -e python3 …`), nicht unter Windows.
- **Text mit Backticks nie in `wsl -e bash -lc "…"` einbetten:** Die äußere Shell führt `` `…` `` als Befehl aus
  (ist schon einmal passiert, dabei fehlten danach Wörter in der Doku). Für Datei-Änderungen das Edit-Werkzeug nehmen
  oder ein Skript als Datei schreiben und ausführen.
- Die Sample-Tests geben absichtlich „Samples could not be loaded … manifest: 404“ aus (Test des Fehlerfalls).

## Git

- Repository seit 19.11.2026. Autor im Repo (lokal gesetzt): `felsspat` mit der GitHub-noreply-Adresse.
  **Nie den echten Namen oder die Gmail-Adresse** in Commits oder Dateien schreiben.
- `.gitattributes` hält alle Zeilenenden auf LF (bearbeitet wird aus Windows und aus WSL).
- Remote: `origin` = https://github.com/felsspat/melody-jump (Branch `main`), Zugriff per SSH-Schlüssel aus Windows
  (`git push` aus Git Bash funktioniert ohne Rückfrage).
- Commits nur, wenn der Mensch es möchte oder es zum Auftrag gehört; vorher Typprüfung, Tests und Build.
- **GitHub Pages:** https://felsspat.github.io/melody-jump/ . Der Workflow `.github/workflows/pages.yml` testet, baut und
  veröffentlicht `dist/` bei jedem Push auf `main`. `dist/` bleibt in `.gitignore` (Pages kann aus einem Branch nur `/`
  oder `/docs` veröffentlichen, nicht `/dist`). `base: './'` in `vite.config.ts` muss bleiben, weil die Seite unter
  `/melody-jump/` liegt. Jeder Push auf `main` geht damit sofort online.
- **Dev-Hook:** Nur im Dev-Server ist das laufende Spiel als `window.__melodyJump` erreichbar (`src/main.ts`), z.B. für
  einen Bot, der mit Headless-Chromium ein Demo-Video aufnimmt. Im Build fehlt er.

## Samples („Echte Instrumente“)

- **Voreinstellung sind die Samples** („🎸 Echte Instrumente“, Wunsch vom 19.11.2026). Auf dem Startbildschirm und in
  den Pause-Einstellungen kann man „🎛 Synthesizer“ wählen; die Wahl wird gespeichert. Die Samples laden schon beim
  Öffnen der Seite; bis sie bereit sind (oder wenn sie nicht laden), spielt der Synthesizer.
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
| Musik | `theory.ts` (Skalen, Dreiklänge, Septakkorde, `chordFromSpec("VI7")`), `Song.ts` (Abschnitte; endlos mit Generator oder endlich ohne → `endBeat`; ein Takt der Akkordfolge kann eine Liste sein, z.B. `['I', 'V7']` = halber Takt je Akkord), `melodies.ts` (Melodien als Paare aus Halbtönen ab Grundton bzw. `null` für Pausen und der Dauer in Beats, optional mit Auftakt `pickup`), `styles.ts` (Stilregeln: Swing, Blue Notes, Timing-Gewichte, Betonungen), `HarmonyJudge.ts` (Bewertung pro Ton → Resonanz), `explain.ts` (Coach-Texte, Diagnose, Zwischendominanten) |
| Spiel | `src/game/Game.ts` (Zustände `title`/`map`/`styles`/`playing`/`paused`/`gameover`/`levelComplete`; Modi `run`/`tutorial`/`campaign`; Pause-Einstellungen, Rückblick am Ende, Punkte-Einblendungen), `Tutorial.ts` (11 Schritte mit Lesepause), `Guide.ts` (Hilfe-Ringe: bekannte Melodie oder Akkordtöne) |
| Eingabe | `src/input/InputMapper.ts` (Maus/Touch, Tastatur, Gleiten; Spurbereich `LOW_MIDI`–`HIGH_MIDI` über `setLaneRange()`), `MidiInput.ts` (Web MIDI, ungetestet) |
| Kampagne | `src/campaign/chapters.ts` (15 Kapitel × 5–7 Level; `styleLevels()` für die alten Kapitel, `addChapterTunes()` hängt die Lieder aus `src/music/songs/<kapitel>.ts` vor den Jam), `progress.ts` (Sterne, `localStorage` mit `try/catch`) |
| Lieder | `src/music/notation.ts` (Notenformat, Helfer `q`/`h`/`e`…, Format `ChapterTune`), `src/music/songs/<kapitel>.ts` (je Kapitel eine Datei, Quelle und Rechtslage im Feld `source`) |
| Welt | `src/world/physics.ts` (Sprünge in Beat-Zeit), `Level.ts` (Hindernis-Generator inkl. Pixelmonster, Notenmünzen und Notenblöcke, Endlos-Stile `RECIPES`, `INTRO_SECTIONS`, `melodySection()`), `Player.ts`, `Enemies.ts` |
| Darstellung | `src/render/Renderer.ts` (Klaviertasten-Spuren, unten durchsichtig; Welt aus Blöcken, Abgründe, Ziegelmauern, Münzen, Notenblöcke, Ziel-Tor; Pixel-Mädchen aus `sprites.ts`), `Hud.ts` (HUD, Titel, Karte, Pause, Level-Ende, Game Over, Flaggen), `NoteParticles.ts` |
| UI | `src/ui/TheoryPanel.ts` (HTML-Overlay „Musik verstehen“, Taste I), `CreditsPanel.ts` (Lizenzen & Quellen der Samples) |

## Fallstricke

- **Endliche Songs:** `Song.nextSection(last)` gibt denselben Abschnitt zurück. Schleifen über Abschnitte
  müssen bei `next === section` abbrechen, sonst friert alles ein (das war schon einmal ein Bug in `Guide.ts`).
- **Timing ist latenzkorrigiert:** `engine.audibleTime`, plus Nutzer-Offset über die Tasten `[`/`]`.
  Die Tasten sind physisch gemeint (`event.code`): auf einer deutschen Tastatur liegen dort `Ü` und `+`.
- **Akkord bei vorgezogenen Tönen:** Die Bewertung nutzt den Akkord bei `beat + 0.12`.
- **Spurbereich ist variabel:** Auf schmalen Bildschirmen (< 740 px) gibt es nur C4–C6. `LOW_MIDI`, `HIGH_MIDI` und
  `LANES` sind Live-Bindings aus `InputMapper.ts`; nie feste Werte wie 48 oder 59 annehmen (z.B. im Tutorial).
- **Gleiten wird verzögert bewertet:** Töne mit `glide: true` landen erst in `pendingGlides` und zählen, wenn der Zeiger
  0,12 s darauf bleibt oder losgelassen wird. Was beim Anschlag passieren soll (Partikel, Coach, Tutorial), gehört in
  `judgeNote()`, nicht in `noteOn()`.
- **Geräusche zählen nicht:** `Sfx` spielt über `engine.sfxBus` und nie über den `HarmonyJudge`. Sie verwenden Töne des
  aktuellen Akkords (`chordTone()`), damit sie nicht schief klingen.
- **Belohnungen müssen erreichbar sein:** Notenblöcke und Münzen liegen über Hindernissen auf der Bahn eines Sprungs mit
  einer bestimmten Resonanz. Wer an `jumpShape()` oder `takeoffBeat()` dreht, muss die Simulationstests in
  `tests/world.test.ts` grün halten; der Coach nennt die nötige Resonanz.
- **Monster werden angesprungen, nicht übersprungen:** Für Pixelmonster nimmt die Läuferin `stompTakeoffBeat()` (landet
  auf der Vorderkante), sonst `takeoffBeat()`. Dieselbe Regel gilt in `Player.update`, beim Platzieren der Belohnungen in
  `Level.addSection` und in `trajectoryFails()` (von oben auf ein Monster fallen ist kein Fehlschlag). Wer eine Stelle
  ändert, muss die anderen mitziehen.
- **Notentasten:** Tasten, die Noten spielen (A–L, W–P, Z/Y), dürfen nur in Menüs andere Bedeutungen haben.
  Freie Befehlstasten: C (Coach), V (Ringe), I (Theorie), M (Band stumm), K (Kampagne im Titel),
  T (Tutorial), Q, R, L (Sprache im Titel), F3, `[`, `]`.
- **Neuer Stil:** Er braucht an folgenden Stellen etwas:
  - `StyleId` + `STYLES` in `styles.ts`
  - einen Fall in `Backing.onStep`
  - ein Spieler-Instrument in `PLAYER_INSTRUMENTS` (`SampleBank.ts`)
  - ein Kapitel in `chapters.ts` (Reihenfolge = Geschichte, Test in `campaign.test.ts`); die Lieder kommen in eine neue
    Datei `src/music/songs/<kapitel>.ts`, die in `songs/index.ts` eingetragen wird
  - ein Rezept in `RECIPES` und einen Eintrag in `ENDLESS_STYLES` (`src/world/Level.ts`) für den Endlos-Modus
  - Endlos-Auswahl: Das Raster hat `STYLE_GRID_COLS` Spalten (`Hud.ts`), Zahlentasten gibt es nur für die ersten zehn Karten
  - Texte unter `campaign.chapters.<id>`, `endless.styles.<id>` und `sections.<name>`
  - Coach-Text für das Timing (`timingText` in `explain.ts`) und einen Absatz in „Musik verstehen“ → Grooves
  - ggf. Samples: `fluid()`-Zeile in `scripts/fetch-samples.mjs`, `InstrumentId` in `SampleBank.ts`, Instrumentname unter
    `instruments.<id>` und in den Credits (`credits.sources.fluid.instruments`)
  - Tests: `tests/styles.test.ts` spielt *jeden* Melodie-Level perfekt mit und prüft die Band mit Fake-Audio; die Kapitelzahl
    steht in `styles.test.ts` und `campaign.test.ts`
  - Die Karte zeigt mehr als 12 Kapitel in zwei Reihen, mehr als 4 Level ebenfalls; bei 720 px Höhe ist es eng.
- **Neue Melodie:** Die Summe der Dauern muss Takte × Schläge ergeben (Test). Fremde Töne sind nur
  als Durchgangston erlaubt, also direkt danach ein Akkordton im Halb- oder Ganztonabstand.
  - Noten dürfen über den Taktstrich gehen (Haltebögen), nur die Summe zählt.
  - Mit Auftakt (`pickup`) muss die Melodie mit Pausen enden, die mindestens so lang sind wie der Auftakt (Test).
  - Melodien nicht aus dem Gedächtnis schreiben, sondern aus einer Notenquelle (ABC, Noten) übertragen und die Quelle im Kommentar nennen.
  - Abgelehnt, weil die EU-Gemeinfreiheit nicht belegt ist: „Frankie and Johnny“ (Fassung der Leightons 1908/12, Todesjahre unbekannt).

## TODO

- **Gitarre/Mikrofon als Eingabe** (Wunsch vom 19.11.2026; der Mensch hat ein Rocksmith-USB-Kabel, „Real Tone Cable“):
  - Das Kabel ist eine USB-Soundkarte und erscheint als Mikrofon. Zugriff per `getUserMedia` mit
    `echoCancellation`, `noiseSuppression` und `autoGainControl` auf `false`; Geräteauswahl in den Einstellungen.
  - Einstimmige Tonhöhenerkennung (z.B. YIN, siehe `scripts/fetch-samples.mjs`), Anschlag über Lautstärkesprung,
    Lautstärke daraus. Erkannte Töne laufen wie Maus/Tastatur/MIDI über `noteOn`/`noteOff` (eigene Quelle in
    `InputMapper`). Bends, Slides und Vibrato dürfen keine Ton-Wackler erzeugen.
  - Keine Akkorde (mehrere Saiten lassen sich nicht sicher trennen). Tiefe Saiten brauchen am längsten zur Erkennung;
    die Verzögerung über den Latenz-Offset bzw. den Latenz-Hinweis des Coachs ausgleichen.
  - Hören: wahlweise das Gitarrensignal auf die Lautsprecher leiten (echter Klang, leicht verzögert) oder die erkannten
    Töne mit einem Spielinstrument spielen. Pegelanzeige zum Einrichten.
  - Funktioniert dann mit jedem Mikrofon (Singen, Pfeifen, Blockflöte).
  - Der Mensch kann das mit Kabel und Gitarre selbst testen.

## Stand und Planung

Stand nach Themen, nächste Schritte, Urheberrecht und entschiedene Fragen stehen in **`docs/kampagnen-plan.md`**.
Neue Arbeit dort beim passenden Thema eintragen (nicht als Datumsprotokoll anhängen) und die Testzahl aktuell halten.

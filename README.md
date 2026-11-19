# Melody Jump

Seitenscrollendes Jump & Run im Browser, bei dem du den Läufer nicht direkt steuerst, sondern **Musik machst**.
Wie harmonisch und taktgenau du spielst („Resonanz“), entscheidet, wie hoch und weit er springt, ob er Leben
regeneriert, ein Schild bekommt usw.

**Online spielen:** https://felsspat.github.io/melody-jump/ (wird bei jedem Push auf `main` automatisch neu gebaut,
siehe `.github/workflows/pages.yml`).

## Starten (Node läuft in WSL)

```bash
cd /mnt/c/Users/devri/git/melody-jump
npm install
npm test          # Unit-Tests (Theorie, Harmonie-Bewertung, Physik/Level)
npm run dev       # Dev-Server, dann http://localhost:5173 im Windows-Browser öffnen
npm run build     # statischer Build nach dist/
```

`node_modules` enthält dann Linux-Binaries, also `npm` immer aus WSL heraus ausführen.

## Steuerung

| Eingabe | Wirkung |
|---|---|
| Maus/Touch: Klick | Ton spielen. X = Tonhöhe (C3–C6, chromatisch), Y = Lautstärke (oben = laut). Halten = Ton halten, Ziehen = Gleiten (bewertet wird nur der Ton, auf dem du anhältst oder loslässt) |
| MIDI-Keyboard | **noch komplett ungetestet** (kein Gerät zum Ausprobieren). Gedacht: einfach anschließen und spielen (Chrome/Edge; beim ersten Spielstart fragt der Browser nach Erlaubnis). Anschlagstärke = Lautstärke, alle Oktaven |
| `A S D F G H J K L ;` | weiße Tasten ab der aktuellen Oktave |
| `W E T Z/Y U O P` | schwarze Tasten (physische Position, egal ob QWERTZ oder QWERTY) |
| `↑` / `↓` | Oktave wechseln |
| `1`–`5`, `Shift` | Lautstärke / Akzent |
| `Tab` | Skalenmodus: die Tastenreihe spielt nur Töne der aktuellen Tonart |
| `V` | Hilfe-Ringe an/aus (Vorschlagsmelodie: welcher Ton, wann); auch per Knopf oben rechts |
| `C` | Coach an/aus (erklärt jeden Ton und gibt Tipps); auch per Knopf oben rechts |
| Touch (Handy/Tablet) | Alles geht per Knopf. Auf schmalen Bildschirmen gibt es nur zwei Oktaven (C4–C6), damit die Spuren breit genug für Finger sind; hochkant erscheint der Hinweis, das Gerät zu drehen |
| `T` | im Menü: Tutorial starten · `Enter` im Tutorial: Schritt überspringen |
| `L` / Flaggen | im Startbildschirm: Sprache wechseln (Deutsch / English) |
| `Esc` / `Q` | Pause / im Pausenmenü zurück zum Hauptmenü |
| `M` | Begleitung stumm |
| Pause → „⚙ Einstellungen“ | Lautstärke von Band und eigenem Instrument, Tempo und Klang ändern – auch mitten im Level |
| `F3` | Debug-Overlay (Bewertung jeder Note) |
| `[` / `]` | Latenz-Offset anpassen, falls Töne neben dem Takt bewertet werden (deutsche Tastatur: `Ü` / `+`). Der Wert wird gespeichert; der Coach weist darauf hin, wenn du gleichmäßig zu früh oder zu spät bist |

## Einstieg

- **Tutorial** (`src/game/Tutorial.ts`): 11 Schritte mit kleinen Aufgaben in einem ruhigen Übungsraum (C-Dur, 80 BPM,
  C–Am–F–G), ohne Gegner und ohne Lebensverlust: Ton spielen → hoch/tief → Takt → Akkordtöne → Akkordwechsel →
  Ringe folgen → warum Töne schief klingen (Durchgangston) → Melodien bauen → Spezial-Moves → Hindernisse.
- **Hilfe-Ringe** (`src/game/Guide.ts`): schlagen eine sichere Melodie aus Akkordtönen vor; der Ring schließt sich auf dem Schlag.
- **Coach** (`src/music/explain.ts`): erklärt zu jedem Ton, warum er passt oder reibt, wie das Timing war,
  welches Intervall es war, und gibt pro Takt einen Tipp zum größten aktuellen Problem.

## Wie die Bewertung funktioniert

Pro Ton (`src/music/HarmonyJudge.ts`):

- **Harmonie**: Ton des aktuellen Akkords +3, Ton der Tonart +1, tonartfremd −2. Löst ein fremder Ton per Halb-/Ganzton
  in einen Akkordton auf, zählt er nachträglich als Durchgangston.
- **Intervall** zum vorherigen Ton: Oktave, Quinte, Quarte, Terzen und Sexten +1, Schritte +0,5, Tritonus −1.
- **Timing**: auf dem Schlag ×1,25, auf der Achtel ×1, Sechzehntel ×0,8, daneben ×0,55.
- **Anti-Spam**: viele Töne pro Schlag oder dieselbe Note immer wieder bringen weniger.
- **Muster**: 3 verschiedene Akkordtöne in einem Schlag = Schild, Oktavsprung = Doppelsprung,
  3 schiefe Töne hintereinander = ein „Misston“-Gegner taucht auf.

Über manchen Hindernissen schweben **Notenmünzen** oder **Notenblöcke** (♪). Nur wer mit hoher Resonanz springt,
erreicht sie (Notenblöcke stößt man mit dem Kopf an); der Coach sagt vorher, wie viel Resonanz nötig ist.

Die Resonanz (0–100) ist die gewichtete Summe der letzten zwei Takte. Vier Takte mit Resonanz ≥ 70 geben ein Leben zurück.

## Aufbau

- `src/audio/`: AudioEngine (Mixer, Hall), Clock (Lookahead-Scheduler, Tempowechsel), Synth (Spielerstimme), Backing (Begleitband)
- `src/music/`: Theorie, Song (Abschnitte mit Tonart/Tempo/Taktart/Akkordfolge), HarmonyJudge
- `src/world/`: Sprungphysik in Beat-Zeit, Level-Generator, Player, Gegner
- `src/render/`: Welt-Renderer, fliegende Noten, HUD
- `src/game/Game.ts`: Spielschleife und Zustände

## Sprachen / Texte

Alle sichtbaren Texte stehen in **`src/i18n/texts.json`**. Jeder Eintrag enthält beide Sprachen nebeneinander:

```json
"resonance": { "de": "Resonanz {n}", "en": "Resonance {n}" }
```

- `{name}`-Platzhalter werden zur Laufzeit ersetzt, Listen (z.B. Tutorial-Zeilen) sind Arrays.
- Standardsprache = Browsersprache (`de-*` → Deutsch, sonst Englisch). Überschreibbar per Flagge im Startbildschirm,
  Taste `L` oder `?lang=en` in der URL; die Wahl wird im Browser gemerkt.
- Neue Sprache: Code in `LOCALES` (`src/i18n/i18n.ts`) ergänzen und jedem Eintrag in `texts.json` den Text hinzufügen.
  Der Test `has every text in every language` meldet fehlende Übersetzungen.
- Code, Kommentare und Bezeichner sind durchgehend Englisch.

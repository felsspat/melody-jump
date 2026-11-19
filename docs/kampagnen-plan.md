# Plan: Kampagne „Musikgeschichte“ (Stand: 19.11.2026)

Ziel: Neben dem Endlos-Modus eine Kampagne mit Kapiteln in historischer Reihenfolge. Jedes Kapitel bringt
einen eigenen Stil mit: eigene Begleitband, eigene Regeln, was „passt“, eigenes Timing-Gefühl,
eigene Melodien und eine Intro-Karte mit Geschichte und Wikipedia-Link.

## Status

**Fertig (spielbar):** Alle 11 Kapitel mit je 3–4 Leveln. Alle Kapitel sind **frei wählbar** (Entscheidung
der Nutzerin bzw. des Nutzers): Niemand muss Kapitel 1 schaffen, um z.B. Blues zu spielen.

| # | Kapitel | Zeit | Melodie (Level 1+2) | Jam (Level 3) | Groove-Regel |
|---|---|---|---|---|---|
| 1 | Volkslied & Klassik | bis 19. Jh. | Funkel funkel · Ode an die Freude · Bruder Jakob | – (Level 3 = Bruder Jakob + Walzer) | gerade |
| 2 | Ragtime | ca. 1895–1918 | The Entertainer (Joplin 1902, vereinfacht) | I – VI7 – II7 – V7 (Zwischendominanten) | Synkopen zählen fast voll |
| 3 | Blues | ab ca. 1900 | eigener 12-Takt-Blues | 12-Takt-Jam in G | Shuffle, Blue Notes b3/b5/b7 |
| 4 | Dixieland | 1910er–1920er | When the Saints (trad.) | I – I – I7 – IV – I – V7 – I – I | Two-Beat (1 und 3), leicht geswingt (0,6) |
| 5 | Swing | 1930er–1945 | eigener „Swing-Riff“ | ii – V7 – I – VI7 | Swing-Achtel, 2/4 leicht betont |
| 6 | Rock 'n' Roll | ca. 1954–59 | eigener Boogie-Riff durch 12 Takte | 12-Takt in A, 132 BPM | Backbeat 2/4 |
| 7 | Ska | ca. 1959–66 | Oh! Susanna (Foster 1848) als Ska | I – IV – V7 – IV | Offbeats zählen am meisten |
| 8 | Rocksteady & Reggae | 1966 → ab 1968 | eigener „Insel-Riddim“ (e-Moll) | i – iv – i – VII (a-Moll) | One Drop: Schlag 3 |
| 9 | Funk & Disco | ab ~1965 → 70er | eigener Funk-Riff | E7-Vamp | „the One“, 16tel zählen |
| 10 | Hip-Hop | ab 1973 | eigener „Bronx-Hook“ (a-Moll) | i – iv – i – VI (a-Moll) | Boom-Bap: Snare 2/4, leicht „laid back“ (0,58) |
| 11 | House & Techno | ab ca. 1984 | eigener „Club-Hook“ | i – VI – III – VII (a-Moll), 124 BPM | Four-on-the-floor, Offbeats zählen am meisten |

**Zweite Melodie (Level „tune2“, vor dem Jam):** Ragtime: Maple Leaf Rag (A-Teil, Takte 5–8 vereinfacht) ·
Blues: Careless Love · Dixieland: Oh, Didn't He Ramble · Swing: Down by the Riverside · Ska: Linstead Market.

Ebenfalls fertig:

- **Kampagnenkarte:** Zeitstrahl mit Kapitelkarten, Sternen pro Kapitel, Kapiteltext,
  „So spielst du“, Wikipedia-Button und Level-Buttons.
- **Level-Ende:** 1–3 Sterne aus durchschnittlicher Resonanz und verlorenen Leben.
  Danach „Nächstes Level“, „Nochmal“ oder „Karte“. Der Fortschritt wird im Browser gespeichert.
- **Stilregeln** (`src/music/styles.ts`): Swing-Anteil, Blue Notes und Timing-Gewichte für Schlag,
  Offbeat, 16tel und daneben, dazu Betonungen pro Schlag.
- **Akkorde:** Septakkorde und Akkordsymbole (`"V7"`, `"VI7"`, `"ii"`).
- **Band pro Stil** (`src/audio/Backing.ts`):
  - Ragtime: Oom-pah
  - Blues: Shuffle mit Boogie-Bass
  - Swing: Ride, Walking Bass, Piano
  - Rock 'n' Roll: Backbeat, Boogie-Bass, Piano-Achtel
  - Ska: Skank auf dem Offbeat, Rimshot
  - Reggae: One Drop, Skank, Bubble-Orgel
  - Funk: 16tel-Hi-Hat, Oktav-Bass, Gitarren-Stabs
- **Erklärungen:**
  - Der Coach kennt Blue Notes, Septimen, Zwischendominanten und Groove-Timing.
  - „Musik verstehen“ hat drei neue Kapitel: 8 (Blues), 9 (Zwischendominanten) und 10 (Grooves).
- **Tests:** 97 Stück. Unter anderem prüfen sie:
  - Jedes Level 1 klingt beim perfekten Mitspielen gut, und kein fremder Ton bleibt unaufgelöst.
  - Jede Band spielt einen ganzen Level ohne Fehler; das läuft über eine Fake-Audio-Engine.

**Bewusste Vereinfachungen** gegenüber dem ursprünglichen Plan:

- Weiterhin **ein Akkord pro Takt**, es gibt noch keine Akkord-Zeitachse.
- Melodien haben **keinen echten Auftakt**; stattdessen beginnen sie mit einer Pause.
- Der Taktgeber läuft in **Achteln**. Funk erzeugt seine 16tel innerhalb der Band.
- Das Spieler-Instrument ist in allen Kapiteln derselbe Synth.

**Fertig: Samples („Echte Instrumente“).** Standard bleibt der Synthesizer, Samples sind wählbar.
- **Quellen:**
  - VCSL (CC0): Klavier, Saxophon, Mundharmonika, Schlagzeug
  - FluidR3_GM (CC BY 3.0): Gitarren, Bässe, Orgel, Trompete, Clavinet
- **Spieler-Instrument je Kapitel:**

  | Kapitel | Instrument |
  |---|---|
  | Klassik, Ragtime | Klavier |
  | Blues | Mundharmonika |
  | Swing | Saxophon |
  | Rock 'n' Roll | verzerrte Gitarre |
  | Ska | Trompete |
  | Reggae | Orgel |
  | Funk | Clavinet |

- **Band:** Sie nutzt ebenfalls Samples: Kontrabass bis Swing, danach E-Bass, Skank-Gitarre, Orgel, Clavinet und das Schlagzeug.
- Details stehen in `CREDITS.md` und `CLAUDE.md`.

**Fertig: Endlos-Modus mit Stilwahl** (19.11.2026).
- „Endlos“ (oder Enter) auf dem Startbildschirm öffnet einen Auswahlbildschirm mit 9 Karten:
  „Gemischt“, Klassik und die 7 weiteren Stile. Man kann klicken, 1–9 drücken oder Pfeiltasten + Enter benutzen.
- Die Wahl wird gespeichert (`endless-style`). Nach Game Over startet „Nochmal“ im selben Stil.
- `src/world/Level.ts`: `RECIPES` legt je Stil Tonarten, Progressionen, Tempo-Bereich, Taktzahl und Abschnittsnamen fest.
  Das Tempo steigt über etwa 8 Abschnitte vom unteren zum oberen Wert.
- **Klassik** verhält sich wie früher: bekannte Melodien, dann zufällige Abschnitte, auch in Moll und im 3/4-Takt.
- **Gemischt** beginnt ebenfalls mit den bekannten Melodien und wählt danach für jeden Abschnitt einen zufälligen Stil.
- Tests in `tests/styles.test.ts`: gültige Abschnitte je Stil, steigendes Tempo, Mischung und Band mit Fake-Audio.

**Fertig (19.11.2026, Wünsche aus dem Test):**
- **Pause-Knopf** oben rechts (neben der Punktzahl). In der Pause bleiben Coach-, Tutorial- und Ansagetexte stehen und
  verblassen nicht; ein Banner unten bietet „Weiter“, „Musik verstehen“ und „Hauptmenü“.
- **Klavier-Optik** der Tasten-Spuren: deckendere Elfenbein- und Lacktasten, Glanz und Schatten der schwarzen Tasten,
  deutliche Fugen zwischen E–F und H–C, Tastenfronten, Notenname auf jedem C, Holzleiste mit rotem Filz.
  Alle Spuren sind weiterhin gleich breit (ein Halbton pro Spur), damit die Maus-Zuordnung gleich bleibt.
- **Lizenzen sichtbar:** Knopf „ⓘ Lizenzen & Quellen“ auf dem Startbildschirm (oben links) öffnet ein Fenster
  (`src/ui/CreditsPanel.ts`); die Credits-Zeile unten ist größer und anklickbar.
- **Pixelmonster:** Etwa jedes vierte Hindernis (Endlos und Kampagne, nicht im Tutorial) ist ein Monster
  (2 eigene Designs × 3 Farben, 36–132 px groß). Physikalisch ist es eine Mauer, also gelten dieselben Sprungregeln;
  es hüpft im Takt. Der Coach sagt vorher, wie viel Resonanz der Sprung braucht (`monsterTip()` in `explain.ts`).
  Drüberspringen gibt +50 Punkte.
- **Kapitel Dixieland** (neu Kapitel 4, vor Swing): Stil `dixieland` mit Two-Beat (Gewicht auf 1 und 3) und leicht
  geswingten Achteln (0,6). Die Band hat Tuba auf 1 und 3, Banjo auf jedem Schlag und leichte Drums. „When the Saints“
  ist von Swing hierher gewandert; Swing hat jetzt den eigenen „Swing-Riff“ über ii – V7 – I – VI7. Spieler-Instrument mit
  Samples: Trompete (es gibt kein Klarinetten-Sample). Auch im Endlos-Modus wählbar (10 Stile, Raster 5 × 2, Taste 0).
  Erklärt im Kapitel und in „Musik verstehen“ → Grooves (Two-Beat, Kollektivimprovisation).

**Fertig (19.11.2026, Punkte 2–5 des alten Plans):**
- **Samples verfeinert:** Drumset-Bassdrum („drum_bass_hard“ von menegass, freesound.org #100051, CC0, über Sonic Pi)
  statt der Konzert-Bassdrum. Klavier hat 3 Anschlagstärken (vl1–vl3), Saxophon 2; welche erklingt, entscheidet
  die Lautstärke des Tons (`layerFor()`: bis 0,45 leise, ab 0,8 laut). Das hohe G5 gibt es leise nicht (falsche Tonhöhe
  in der Quelle), dort wird das nächste Sample verwendet.
- **Akkord-Zeitachse und Auftakte:** Ein Takt der Akkordfolge kann mehrere Akkorde haben (`['I', 'V7']`), und
  Melodien können einen Auftakt (`pickup`) haben, der im Einzählen bzw. am Ende des vorigen Abschnitts erklingt. Die
  Hilfe-Ringe zeigen ihn. „When the Saints“ hat jetzt einen echten Auftakt („Oh when the“). Erklärt in „Musik verstehen“ → Takt & Rhythmus.
- **Mehr Melodien:** 5 neue, gemeinfreie Melodien (siehe oben). Sie wurden nicht aus dem Gedächtnis geschrieben, sondern
  aus Notenquellen übertragen (Quellen stehen in `melodies.ts`). „Frankie and Johnny“ wurde **nicht** eingebaut: Die
  bekannte Fassung geht auf die Leighton-Brüder (1908/1912) zurück, deren Todesjahre nicht belegt sind.
- **Kapitel Hip-Hop und House & Techno** mit eigenen Beats (Drumcomputer-Kick, Clap, offene Hi-Hat, Plattenkratzer,
  Synth-Bass und -Stabs) und eigenen Melodien. Auch im Endlos-Modus (12 Stile, Raster 4 × 3). Bei House spielt man
  auch mit „Echte Instrumente“ den Synthesizer.

**Fertig (19.11.2026, Durchsicht des Benutzererlebnisses):**
- **Auto-Pause** beim Tab-Wechsel; der **Latenz-Offset** (`[`/`]`) wird gespeichert.
- **Kampagne:** Coach-Tipp pro Takt und Misston-Gegner gibt es jetzt auch dort (vorher nur im Endlos-Modus).
- **Rekord** zählt nur noch für Endlos-Läufe.
- **Gleiten mit der Maus:** Nur überquerte Spuren klingen, werden aber nicht bewertet; es zählt der Ton, auf dem der
  Zeiger 0,12 s bleibt oder losgelassen wird (`GLIDE_SETTLE_SEC` in `Game.ts`).
- **Rückblick am Ende** (Level geschafft und Game Over): Zahl der Töne, Anteil Akkordtöne, Anteil im Takt, getroffene
  Ringe und ein Tipp fürs nächste Mal (`summarize()` in `explain.ts`).
- **Latenz-Hinweis:** Kommen die Töne gleichmäßig zu früh oder zu spät (`timingBias()`), erklärt der Coach, was Latenz
  ist und welche Taste sie ausgleicht.
- **Einstellungen in der Pause** („⚙ Einstellungen“): Lautstärke von Band und eigenem Instrument (0–150 %, gespeichert),
  Tempo (wirkt sofort im laufenden Level) und Klang.
- Kleinigkeiten: Samples werden nach einem Ladefehler erneut versucht, die Fall-Animation hängt nicht mehr von der
  Bildrate ab, `<html lang>` folgt der Sprache, kein Bildschirmwackeln bei „reduzierte Bewegung“ im System.
- **MIDI-Keyboard** (`src/input/MidiInput.ts`, Web MIDI): Noten an/aus mit Anschlagstärke, auch später eingesteckte
  Geräte. Zugriff wird beim ersten Spielstart erfragt. Läuft in Chrome/Edge, nicht in Safari.
  **Komplett ungetestet:** Nur das Auslesen der MIDI-Nachrichten hat Unit-Tests; mit einem echten Keyboard wurde es nie ausprobiert.
- **Touch-Bedienung:** Ringe und Coach als Knöpfe oben rechts, Game Over mit Knöpfen (Nochmal, Karte, Hauptmenü;
  sie reagieren erst nach 0,8 s, damit ein Ton-Tipp nicht sofort neu startet). Unter 740 px Breite nur zwei Oktaven
  (C4–C6, `setLaneRange()` in `InputMapper.ts`); hochkant ein Hinweis zum Drehen. Ungetestet auf echten Geräten.
- Nicht lösbar: Ein vor dieser Änderung in der Kampagne entstandener Rekord bleibt stehen (es ist nicht gespeichert,
  woher er kam).

**Fertig (19.11.2026, mehr Jump-&-Run-Gefühl, Wunsch aus dem Test):**
- **Abgründe statt „Blöcke auf Bodenhöhe“:** Lücken im Boden sahen aus wie flache Blöcke (darunter war nur der
  Hintergrund in Bodenfarbe). Jetzt sind sie fast schwarz, mit Felskanten an den Rändern.
- **Boden aus Blöcken** (oben eine Reihe Quader, darunter versetzte Ziegel), **Mauern als Ziegeltürme**; vom Schild
  zerschlagene Mauern fliegen in Brocken auseinander.
- **Notenblöcke** ( in ): schweben über manchen Hindernissen statt einer Notenmünze. Wer hoch genug
  springt, stößt mit dem Kopf dagegen: +100, der Block fliegt weg. Coach-Tipp mit der nötigen Resonanz (),
  Ansage beim ersten Block. Test: in der Simulation ab der genannten Resonanz immer erreichbar.
- **Notenmünzen** drehen sich, **Punkte** steigen dort auf, wo man sie verdient (+100, +50).
- **Geräusche** (): Sprung, Doppelsprung, Landung, Münze, Notenblock, Gegner, Mauer, Treffer, Absturz,
  Fanfare. Alle aus Akkordtönen des gerade klingenden Akkords, damit sie zur Musik passen; sie zählen nicht für die
  Resonanz. Eigene Lautstärke „Geräusche“ in den Pause-Einstellungen.
- **Staubwolken** beim Landen, **Ziel-Tor** mit Notenschlüssel am Ende jedes Kampagnen-Levels.
- Alles nur mit Tests und Typprüfung abgesichert, nicht angesehen oder angehört.

## Nächste Schritte (Vorschlag)

1. **Im Browser anhören:** neue Bassdrum, leise/laute Klavier- und Saxophon-Töne, Hip-Hop- und House-Band,
   die fünf neuen Melodien (besonders Maple Leaf Rag, Takte 5–8).
2. **Maple Leaf Rag originalgetreuer:** Akkorde mit erniedrigter Stufe (z.B. `bVI`) in `chordFromSpec` erlauben; dann
   passen Takte 5–6 und 11/15 genau zum Original.
3. **Ab 1.1.2029:** „St. Louis Blues“ (W. C. Handy † 1958) im Blues-Kapitel. Vorher nicht einbauen!
4. **Optional:** „Frankie and Johnny“, falls sich eine sicher gemeinfreie Fassung findet (z.B. Hughie Cannon,
   „He Done Me Wrong“, 1904, Cannon † 1912).

## Samples: Hintergrund der Entscheidung (umgesetzt, siehe oben)

Ohne Server geht das gut: Die Samples liegen als statische Dateien in `public/` und werden von Vite
mit ausgeliefert. Kandidaten mit freier Lizenz:

| Quelle | Inhalt | Lizenz | Hinweis |
|---|---|---|---|
| FluidR3_GM (General-MIDI-Soundfont) | Klavier, Gitarren, Orgel, Bläser, Bass … | MIT | als vorgerenderte MP3/OGG-Notensets verfügbar (z.B. Projekt „midi-js-soundfonts“) |
| MusyngKite-Soundfont | wie oben, hochwertiger | CC BY-SA 3.0 | Namensnennung + Weitergabe unter gleicher Lizenz |
| Salamander Grand Piano | sehr gutes Klavier | CC BY 3.0 | groß, auf wenige Töne reduzieren |
| Drum-Samples von freesound.org mit CC0 | Kick, Snare, Hi-Hat, Ride, Rimshot | CC0 | einzeln auswählen, keine Namensnennung nötig |

Technik:

- Ein `SampleBank`-Modul lädt die Samples per `fetch` und `decodeAudioData`.
- Fehlende Töne werden per `playbackRate` aus dem nächsten Sample hochgerechnet.
- Solange die Samples noch laden, fällt das Spiel auf die bisherige Synthese zurück.
- `Backing` und `Synth` rufen nur noch `instrument.play(midi, time, dur)` auf.

Größe:

- Etwa 3–8 MB, wenn man pro Instrument nur jede dritte Note sampelt.
- Lizenzangaben gehören in eine `CREDITS.md` und auf den Startbildschirm.

Entschieden:

- (a) Lizenz: CC0 und CC BY mit Namensnennung sind okay (bestätigt am 19.11.2026).
- (b) Die Samples liegen im Projekt (`public/samples/`), damit das Spiel ohne Internet läuft.

## Urheberrecht (EU: 70 Jahre nach dem Tod)

- **Verwendet und gemeinfrei:**
  - Joplin († 1917): The Entertainer, Maple Leaf Rag
  - Beethoven
  - Foster († 1864)
  - Cole († 1911) & J. R. Johnson († 1954): „Oh, Didn't He Ramble“ (seit 2025)
  - traditionelle Lieder wie „Twinkle“, „Bruder Jakob“, „When the Saints“, „Careless Love“,
    „Down by the Riverside“, „Linstead Market“
- **Eigene Kompositionen:** Blues-Melodie, Swing-Riff, Boogie-Riff, Insel-Riddim, Funk-Riff, Bronx-Hook, Club-Hook.
- **Nicht verwenden:** „St. Louis Blues“ (Handy † 1958) bis Ende 2028.
  Ebenso alle Originale ab den 1950ern, z.B. Rock 'n' Roll, Ska, Reggae, Funk.
  Außerdem: „Bourbon Street Parade“ (Barbarin † 1969), „Tiger Rag“ (LaRocca † 1961), „Frankie and Johnny“ (unklar).

## Entschiedene Fragen (19.11.2026)

1. **Dixieland** bekommt ein eigenes Kapitel vor Swing (umgesetzt am 19.11.2026).
2. **„St. Louis Blues“** kommt ab 2029 dazu, wenn es in der EU gemeinfrei ist.
3. **CC BY 3.0** für einen Teil der Samples ist in Ordnung, mit Namensnennung wie umgesetzt.

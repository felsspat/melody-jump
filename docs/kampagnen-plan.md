# Plan und Stand: Melody Jump (Stand: 19.11.2026)

Ziel: Ein Jump & Run mit etwas klassischem Jump-&-Run-Gefühl, bei dem man nicht springt, sondern **Musik macht**.
Neben dem Endlos-Modus gibt es eine Kampagne „Musikgeschichte“ mit Kapiteln in historischer Reihenfolge. Jedes Kapitel
bringt einen eigenen Stil mit: eigene Begleitband, eigene Regeln, was „passt“, eigenes Timing-Gefühl, eigene Melodien
und eine Intro-Karte mit Geschichte und Wikipedia-Link.

Was im Browser geprüft ist und was nicht, steht bei den einzelnen Punkten und unter „Nächste Schritte“.

## Kampagne

Alle 11 Kapitel mit je 3–4 Leveln sind spielbar und **frei wählbar** (Entscheidung der Nutzerin bzw. des Nutzers):
Niemand muss Kapitel 1 schaffen, um z.B. Blues zu spielen.

| # | Kapitel | Zeit | Melodie (Level 1+2) | Zweite Melodie („tune2“) | Jam (letztes Level) | Groove-Regel | Instrument (Samples) |
|---|---|---|---|---|---|---|---|
| 1 | Volkslied & Klassik | bis 19. Jh. | Funkel funkel · Ode an die Freude · Bruder Jakob | – | – (Level 3 = Bruder Jakob + Walzer) | gerade | Klavier |
| 2 | Ragtime | ca. 1895–1918 | The Entertainer (Joplin 1902, vereinfacht) | Maple Leaf Rag (A-Teil, Takte 5–8 vereinfacht) | I – VI7 – II7 – V7 (Zwischendominanten) | Synkopen zählen fast voll | Klavier |
| 3 | Blues | ab ca. 1900 | eigener 12-Takt-Blues | Careless Love | 12-Takt-Jam in G | Shuffle, Blue Notes b3/b5/b7 | Mundharmonika |
| 4 | Dixieland | 1910er–1920er | When the Saints (mit Auftakt) | Oh, Didn't He Ramble | I – I – I7 – IV – I – V7 – I – I | Two-Beat (1 und 3), leicht geswingt (0,6) | Trompete |
| 5 | Swing | 1930er–1945 | eigener „Swing-Riff“ | Down by the Riverside | ii – V7 – I – VI7 | Swing-Achtel, 2/4 leicht betont | Saxophon |
| 6 | Rock 'n' Roll | ca. 1954–59 | eigener Boogie-Riff durch 12 Takte | – | 12-Takt in A, 132 BPM | Backbeat 2/4 | verzerrte Gitarre |
| 7 | Ska | ca. 1959–66 | Oh! Susanna (Foster 1848) als Ska | Linstead Market | I – IV – V7 – IV | Offbeats zählen am meisten | Trompete |
| 8 | Rocksteady & Reggae | 1966 → ab 1968 | eigener „Insel-Riddim“ (e-Moll) | – | i – iv – i – VII (a-Moll) | One Drop: Schlag 3 | Orgel |
| 9 | Funk & Disco | ab ~1965 → 70er | eigener Funk-Riff | – | E7-Vamp | „the One“, 16tel zählen | Clavinet |
| 10 | Hip-Hop | ab 1973 | eigener „Bronx-Hook“ (a-Moll) | – | i – iv – i – VI (a-Moll) | Boom-Bap: Snare 2/4, leicht „laid back“ (0,58) | Klavier |
| 11 | House & Techno | ab ca. 1984 | eigener „Club-Hook“ | – | i – VI – III – VII (a-Moll), 124 BPM | Four-on-the-floor, Offbeats zählen am meisten | Synthesizer |

**Weitere Lieder (seit 19.11.2026, je 3 pro Kapitel, Wunsch „mehr Lieder pro Ära“):** Sie stehen in
`src/music/songs/<kapitel>.ts` (Format `ChapterTune` in `src/music/notation.ts`) und werden von `addChapterTunes()` in
`chapters.ts` automatisch zu Leveln vor dem Jam (Level-Id `<kapitel>-<melodie>`, mindestens 16 Takte). Gemeinfreie
Melodien wurden aus Notenquellen übertragen (Quelle und Begründung im Feld `source`), die anderen sind eigene Stücke.

| Kapitel | Neue Lieder |
|---|---|
| Volkslied & Klassik | Brahms' Wiegenlied „Guten Abend, gut' Nacht“ (3/4) · Drunken Sailor (d-Moll) · Auld Lang Syne |
| Ragtime | The Easy Winners (Joplin) · Twelfth Street Rag (Bowman †1949) · Elite Syncopations (Joplin, 2. Teil) |
| Blues | Goin' Down the Road · Motherless Child (Spiritual, d-Moll) · Take This Hammer (Work Song) |
| Dixieland | Bill Bailey (Cannon †1912) · Swing Low, Sweet Chariot · Joshua Fit the Battle (g-Moll) |
| Swing | Loch Lomond (trad., Swing-Hit 1937) · eigener „Mitternachts-Riff“ (d-Moll) · eigenes „Jump Town“ |
| Rock 'n' Roll | eigene: Sock-Hop-Riff (12 Takte) · Doo-Wop im Mondschein (I–vi–IV–V) · Stop-Time-Boogie |
| Ska | aus Jekyll „Jamaican Song and Story“ (1907): Der Mungo kommt · Wein nicht, Jamaika-Mädchen · trad. Mango Walk |
| Reggae | aus Jekyll (1907): Krieg in Monkland (c-Moll) · In Somerset geboren (f-Moll) · eigenes „Morgen am Hang“ |
| Funk & Disco | eigene: Spiegelkugel-Stolz · Kellerfunk (e-Moll) · Bläserhiebe |
| Hip-Hop | eigene: Staubige Tasten · Regen auf Vinyl · Betonschatten |
| House & Techno | eigene: Klavier im Morgengrauen · Acid-Schleife · Samt-Tanzfläche |

Die Kapiteltexte nennen den Jam jetzt „letzter Level“ statt „Level 3“. Die Karte zeigt mehr als vier Level in zwei Reihen.
Alle Lieder bestehen die Tests (perfekt mitgespielt: keine unaufgelösten fremden Töne, Resonanz > 55), angehört hat sie
noch niemand.

- **Kampagnenkarte:** Zeitstrahl mit Kapitelkarten, Sternen pro Kapitel, Kapiteltext, „So spielst du“, Wikipedia-Button
  und Level-Buttons.
- **Schneller spielen** (seit 19.11.2026): Auf der Karte wählt man „⏩ Tempo für bestandene Level: Normal · +15 % ·
  +30 %“ (Klick oder Tasten 1–3, gespeichert als `campaign-boost`). Es gilt nur für Level mit mindestens einem Stern und
  kommt zur Tempo-Einstellung im Hauptmenü dazu (`BOOSTS`, `boostFor()` in `progress.ts`). Der Fortschritt merkt sich das
  schnellste geschaffte Tempo je Level (`speed`), der Level-Knopf zeigt es als ⏩ bzw. ⏩⏩, das Level-Ende als
  „⏩ mit 15 % mehr Tempo“.
- **Level-Ende:** Ziel-Tor mit Notenschlüssel und Fanfare. 1–3 Sterne aus durchschnittlicher Resonanz und verlorenen
  Leben, dazu ein Rückblick (siehe „Lernen“). Danach „Nächstes Level“, „Nochmal“ oder „Karte“. Der Fortschritt wird im
  Browser gespeichert.
- In der Kampagne gibt es wie im Endlos-Modus Coach-Tipps pro Takt und Misston-Gegner.

## Endlos-Modus

- „Endlos“ (oder Enter) auf dem Startbildschirm öffnet eine Stilwahl mit 12 Karten im Raster 4 × 3: „Gemischt“,
  Klassik und die 10 weiteren Stile. Klicken, Zahlentasten 1–9 und 0 (für die ersten zehn Karten) oder Pfeiltasten + Enter.
- Die Wahl wird gespeichert (`endless-style`). Nach Game Over startet „Nochmal“ im selben Stil.
- `RECIPES` in `src/world/Level.ts` legt je Stil Tonarten, Progressionen, Tempo-Bereich, Taktzahl und Abschnittsnamen
  fest. Das Tempo steigt über etwa 8 Abschnitte vom unteren zum oberen Wert.
- **Klassik:** bekannte Melodien, dann zufällige Abschnitte, auch in Moll und im 3/4-Takt.
  **Gemischt:** ebenfalls zuerst die bekannten Melodien, danach für jeden Abschnitt ein zufälliger Stil.
- Der **Rekord** zählt nur für Endlos-Läufe. Ein früher in der Kampagne entstandener Rekord bleibt stehen, weil nicht
  gespeichert ist, woher er kam (nicht lösbar).

## Musik und Klang

- **Stilregeln** (`src/music/styles.ts`): Swing-Anteil, Blue Notes, Timing-Gewichte für Schlag, Offbeat, 16tel und
  daneben, Betonungen pro Schlag.
- **Akkorde:** Septakkorde und Akkordsymbole (`"V7"`, `"VI7"`, `"ii"`). Ein Takt kann mehrere Akkorde haben
  (`['I', 'V7']`).
- **Auftakte:** Melodien können einen Auftakt (`pickup`) haben, der im Einzählen bzw. am Ende des vorigen Abschnitts
  erklingt; die Hilfe-Ringe zeigen ihn.
- **Band pro Stil** (`src/audio/Backing.ts`): Ragtime Oom-pah · Blues Shuffle mit Boogie-Bass · Dixieland Tuba auf 1 und 3,
  Banjo, leichte Drums · Swing Ride, Walking Bass, Piano · Rock 'n' Roll Backbeat, Boogie-Bass, Piano-Achtel · Ska Skank
  auf dem Offbeat, Rimshot · Reggae One Drop, Skank, Bubble-Orgel · Funk 16tel-Hi-Hat, Oktav-Bass, Gitarren-Stabs ·
  Hip-Hop und House Drumcomputer-Kick, Clap, offene Hi-Hat, Plattenkratzer, Synth-Bass und -Stabs.
- **Samples („Echte Instrumente“):** Voreinstellung (seit 19.11.2026, vorher der Synthesizer), der Synthesizer ist wählbar. Quellen: VCSL (CC0: Klavier, Saxophon,
  Mundharmonika, Schlagzeug) und FluidR3_GM (CC BY 3.0: Gitarren, Bässe, Orgel, Trompete, Clavinet). Drumset-Bassdrum
  „drum_bass_hard“ (menegass, freesound.org #100051, CC0, über Sonic Pi); sie war viel zu laut (Datei auf 0 dB
  normalisiert, Snare 20 dB leiser, „wie eine riesige Bassdrum“) und läuft seit 19.11.2026 mit Faktor 0,2 (≈ −14 dB)
  und einem Hochpass bei 45 Hz. Gemessen im Blues: Tiefbass unter 90 Hz vorher 7 dB über den Mitten, jetzt 4 dB
  darunter. Klavier hat 3 Anschlagstärken, Saxophon 2
  (`layerFor()`: bis 0,45 leise, ab 0,8 laut; das leise G5 fehlt wegen falscher Tonhöhe in der Quelle). Die Band nutzt
  Kontrabass bis Swing, danach E-Bass. Hip-Hop und House nutzen immer Drumcomputer-Klänge, bei House spielt man auch
  mit Samples den Synthesizer. Eine einzelne kaputte Datei wird übersprungen (der Ton kommt dann vom nächsten Sample);
  lädt gar nichts, bleibt es beim Synthesizer, und beim nächsten Start wird es erneut versucht. Details in `CREDITS.md`
  und `CLAUDE.md`.
- **Fehler bis 19.11.2026:** `piano/soft-48.mp3` und `piano/soft-84.mp3` waren leer (der Stille-Filter hatte die sehr
  leisen Aufnahmen ganz weggeschnitten). Weil damals eine kaputte Datei das ganze Laden scheitern ließ, lief das Spiel
  bis dahin **immer mit dem Synthesizer**, auch mit „Echte Instrumente“. Beide Dateien sind entfernt, das Skript und ein
  Test verhindern leere Dateien.
- **Geräusche** (`src/audio/Sfx.ts`): Sprung, Doppelsprung, Landung, Münze, Notenblock, Gegner, Mauer, Treffer, Absturz,
  Fanfare. Alle aus Tönen des gerade klingenden Akkords, damit sie zur Musik passen; sie zählen nicht für die Resonanz.

**Im Browser geprüft (19.11.2026):** Die Melodien und Samples sind gut und **bleiben so**. Das gilt auch für den
vereinfachten Maple Leaf Rag; die originalgetreuere Fassung mit `bVI`-Akkorden ist verworfen. Achtung: Wegen des
Ladefehlers oben war dabei vermutlich der Synthesizer zu hören, nicht die Samples; die Samples sind also noch einmal
anzuhören.

## Welt und Jump & Run

- **Physik in Beat-Zeit** (`src/world/physics.ts`): Die Läuferin springt automatisch vor Hindernissen; Höhe und Weite
  hängen von der Resonanz ab. Mit Schild zerschlägt sie eine Mauer, mit Doppelsprung rettet sie einen zu kurzen Sprung.
- **Boden aus Blöcken** (eine Reihe Quader, darunter versetzte Ziegel), **Abgründe** fast schwarz mit Felskanten
  (vorher sahen Lücken aus wie flache Blöcke; im Browser bestätigt, dass man sie jetzt erkennt).
- **Mauern** als Ziegeltürme; vom Schild zerschlagene Mauern fliegen in Brocken auseinander.
- **Pixelmonster** (seit 19.11.2026 kleiner und mehr, Wunsch „mehr Jump & Run“): etwa jedes zweite Hindernis (nicht im
  Tutorial), 2 eigene Designs × 3 Farben, 24–60 px (vorher 36–132 px, jedes vierte). Insgesamt gibt es auch mehr
  Hindernisse (Dichte 0,6–0,9 statt 0,45–0,85 pro Takt). Physikalisch eine Mauer, hüpft im Takt. Die Läuferin **springt
  ihnen auf den Kopf** (`stompTakeoffBeat()` in `physics.ts`): Sie werden plattgedrückt (+50), sie federt ab. Seitlich
  hineinlaufen kostet ein Leben. Nötig ist dafür nur etwa 10–20 Resonanz (`stompResonanceFor()`); die Schwierigkeit
  steckt in Lücken und Mauern. Der Coach sagt vorher, wie viel Resonanz nötig ist (`monsterTip()`). Simulationstests:
  ab 30 Resonanz wird jedes Monster plattgedrückt, ohne Musik läuft man hinein.
- **Misston-Gegner:** erscheinen nach drei schiefen Tönen hintereinander; Draufspringen +50.
- **Belohnungen über Hindernissen:** sich drehende Notenmünzen (+100) oder **Notenblöcke** (`NoteBlock` in `Level.ts`,
  +100), die man mit dem Kopf anstößt. Beides nur mit höherer Resonanz erreichbar. Beim ersten Notenblock gibt es eine
  Ansage, vor jedem einen Coach-Tipp mit der nötigen Resonanz (`blockTip()`); ein Test prüft per Simulation, dass die
  Angabe stimmt.
- **Kleinigkeiten:** Staubwolken beim Landen, Punkte steigen dort auf, wo man sie verdient, Bildschirmwackeln bei Treffern
  (abgeschaltet bei „reduzierte Bewegung“ im System).
- **Klaviertasten-Spuren:** Elfenbein- und Lacktasten mit Glanz, Schatten, deutlichen Fugen zwischen E–F und H–C,
  Tastenfronten, Notenname auf jedem C, Holzleiste mit rotem Filz. Oben deckend, im unteren Bereich (etwa 300 px über
  dem Boden, wo gesprungen wird) durchsichtig, damit Landschaft und Welt durchscheinen (im Browser für gut befunden).
  Alle Spuren sind gleich breit (ein Halbton pro Spur).

## Bedienung

- **Maus:** X = Tonhöhe, Y = Lautstärke. Beim Gleiten klingen überquerte Spuren, bewertet wird aber nur der Ton, auf dem
  der Zeiger 0,12 s bleibt oder losgelassen wird (`GLIDE_SETTLE_SEC` in `Game.ts`).
- **Tastatur:** Klavierbelegung bzw. Skalenmodus; Befehlstasten siehe README.
- **Pause:** Knopf oben rechts oder Esc. Texte bleiben stehen; Banner mit „Weiter“, „⚙ Einstellungen“,
  „Musik verstehen“ und „Hauptmenü“. Die Einstellungen enthalten die Lautstärke von Band, eigenem Instrument und
  Geräuschen (0–150 %, gespeichert), das Tempo (wirkt sofort) und den Klang.
- **Auto-Pause** beim Wechsel des Browser-Tabs.
- **Latenz-Offset** mit `[`/`]` (deutsche Tastatur: `Ü`/`+`), wird gespeichert.
- **Touch:** Ringe und Coach als Knöpfe oben rechts, Game Over mit Knöpfen (reagieren erst nach 0,8 s, damit ein Ton-Tipp
  nicht sofort neu startet). Unter 740 px Breite nur zwei Oktaven (C4–C6, `setLaneRange()` in `InputMapper.ts`),
  hochkant ein Hinweis zum Drehen. **Auf echten Geräten ungetestet.**
- **MIDI-Keyboard** (`src/input/MidiInput.ts`, Web MIDI, Chrome/Edge): Noten an/aus mit Anschlagstärke, auch später
  eingesteckte Geräte; der Zugriff wird beim ersten Spielstart erfragt. **Komplett ungetestet:** Nur das Auslesen der
  MIDI-Nachrichten hat Unit-Tests. Das steht auch im Spiel: als Zeile in der Hilfe auf dem Startbildschirm und in der
  Meldung beim Anschließen („(ungetestet)“).
- **Lizenzen:** Knopf „ⓘ Lizenzen & Quellen“ auf dem Startbildschirm (`src/ui/CreditsPanel.ts`), dazu die anklickbare
  Credits-Zeile unten.

## Lernen

- **Tutorial** (11 Schritte mit Lesepause) und **Hilfe-Ringe** (bekannte Melodie oder Akkordtöne).
- **Coach:** erklärt jeden Ton (Akkordton, Blue Note, Durchgangston …), kennt Septimen, Zwischendominanten und
  Groove-Timing, gibt pro Takt einen Tipp zum größten Problem, kündigt Monster und Notenblöcke mit der nötigen Resonanz an.
- **Latenz-Hinweis:** Kommen die Töne gleichmäßig zu früh oder zu spät (`timingBias()`), erklärt der Coach, was Latenz
  ist und welche Taste sie ausgleicht.
- **Rückblick** bei Level-Ende und Game Over: Zahl der Töne, Anteil Akkordtöne, Anteil im Takt, getroffene Ringe und ein
  Tipp fürs nächste Mal (`summarize()` in `explain.ts`).
- **„Musik verstehen“** (Taste I): 10 Kapitel, u.a. Blues, Zwischendominanten, Grooves (mit Two-Beat und
  Kollektivimprovisation) und Takt & Rhythmus (mit Auftakt).

## Technik und Tests

- 110 Tests (Vitest). Unter anderem:
  - Jeder Melodie-Level klingt beim perfekten Mitspielen gut, und kein fremder Ton bleibt unaufgelöst.
  - Jede Band spielt einen ganzen Level ohne Fehler (Fake-Audio-Engine).
  - Endlos-Abschnitte je Stil sind gültig, das Tempo steigt.
  - Notenblöcke sind ab der angegebenen Resonanz erreichbar und für schwache Sprünge nicht.
  - Jeder Text existiert in jeder Sprache.
  - Keine Sample-Datei ist leer, und eine kaputte Datei legt nicht alle Samples lahm.
- Nicht automatisch geprüft: `Game.ts`, Zeichnen und Klang. Das muss im Browser angesehen und angehört werden.
- Git-Repository seit 19.11.2026 (https://github.com/felsspat/melody-jump); `.gitattributes` hält die Zeilenenden auf LF.
- **Online:** https://felsspat.github.io/melody-jump/ . Ein GitHub-Actions-Workflow testet, baut und veröffentlicht bei
  jedem Push auf `main`.
- **Demo-Video** (19.11.2026): Ein Bot hat mit Headless-Chromium Reggae endlos auf Originaltempo gespielt (Resonanz
  durchgehend 100, kein Leben verloren). Er nutzt den Dev-Hook `window.__melodyJump`. Ton und Bild kommen direkt aus
  dem Spiel; die Ausgabe-Latenz muss dabei auf 0 gesetzt werden, weil Headless-Chromium ohne Soundkarte eine ständig
  wachsende Latenz meldet.

**Bewusste Vereinfachungen:**

- Der Taktgeber läuft in **Achteln**. Funk erzeugt seine 16tel innerhalb der Band.
- Die Läuferin springt immer automatisch; es gibt keine Plattformen, auf denen man landen kann.

## Nächste Schritte (Vorschlag)

1. **Im Browser ausprobieren:**
   - „Echte Instrumente“ noch einmal anhören: Sie laden erst seit dem Fix vom 19.11.2026 wirklich.
   - Geräusche: Passen sie, stimmt die Lautstärke?
   - Notenblöcke: Erkennt man sie, fühlt sich das Anstoßen gut an?
   - Gegner in der Kampagne: zu streng für die Sterne?
   - Gleiten mit der Maus: Werden die richtigen Töne gezählt?
   - MIDI-Keyboard und Touch auf echten Geräten.
2. **Ab 1.1.2029:** „St. Louis Blues“ (W. C. Handy † 1958) im Blues-Kapitel. Vorher nicht einbauen!
3. **Optional:** „Frankie and Johnny“, falls sich eine sicher gemeinfreie Fassung findet (z.B. Hughie Cannon,
   „He Done Me Wrong“, 1904, Cannon † 1912).

## Samples: Hintergrund der Entscheidung (umgesetzt)

Ohne Server geht das gut: Die Samples liegen als statische Dateien in `public/samples/` (ca. 5 MB) und werden von Vite
mit ausgeliefert. Kandidaten mit freier Lizenz waren:

| Quelle | Inhalt | Lizenz | Hinweis |
|---|---|---|---|
| FluidR3_GM (General-MIDI-Soundfont) | Klavier, Gitarren, Orgel, Bläser, Bass … | MIT | als vorgerenderte MP3/OGG-Notensets verfügbar (z.B. Projekt „midi-js-soundfonts“) |
| MusyngKite-Soundfont | wie oben, hochwertiger | CC BY-SA 3.0 | Namensnennung + Weitergabe unter gleicher Lizenz |
| Salamander Grand Piano | sehr gutes Klavier | CC BY 3.0 | groß, auf wenige Töne reduzieren |
| Drum-Samples von freesound.org mit CC0 | Kick, Snare, Hi-Hat, Ride, Rimshot | CC0 | einzeln auswählen, keine Namensnennung nötig |

Umgesetzt: `SampleBank` lädt per `fetch` und `decodeAudioData`, fehlende Töne werden per `playbackRate` aus dem
nächsten Sample hochgerechnet, solange nichts geladen ist, spielt der Synthesizer.

## Urheberrecht (EU: 70 Jahre nach dem Tod)

- **Verwendet und gemeinfrei:**
  - Joplin († 1917): The Entertainer, Maple Leaf Rag
  - Beethoven
  - Foster († 1864)
  - Cole († 1911) & J. R. Johnson († 1954): „Oh, Didn't He Ramble“ (seit 2025)
  - traditionelle Lieder wie „Twinkle“, „Bruder Jakob“, „When the Saints“, „Careless Love“,
    „Down by the Riverside“, „Linstead Market“
  - seit 19.11.2026 außerdem: Brahms († 1897), Euday Bowman († 1949, Twelfth Street Rag), Hughie Cannon († 1912,
    Bill Bailey), Robert Burns († 1796, Auld Lang Syne), Walter Jekyll („Jamaican Song and Story“, 1907, † 1929;
    traditionelle Lieder), traditionell: Drunken Sailor, Loch Lomond, Goin' Down the Road, Motherless Child, Take This
    Hammer, Swing Low, Joshua Fit the Battle, Mango Walk
- **Eigene Kompositionen:** Blues-Melodie, Swing-Riff, Boogie-Riff, Insel-Riddim, Funk-Riff, Bronx-Hook, Club-Hook.
- **Nicht verwenden:** „St. Louis Blues“ (Handy † 1958) bis Ende 2028.
  Ebenso alle Originale ab den 1950ern, z.B. Rock 'n' Roll, Ska, Reggae, Funk.
  Außerdem: „Bourbon Street Parade“ (Barbarin † 1969), „Tiger Rag“ (LaRocca † 1961), „Frankie and Johnny“ (unklar).
  Bei der Suche am 19.11.2026 verworfen: „Just a Closer Walk with Thee“ (Urheberschaft unklar, evtl. † 1974/1989),
  „St. James Infirmary“ (Irving Mills † 1985), „Corrine, Corrina“ (Mitchell Parish † 1993), „Chinatown, My Chinatown“
  (Jean Schwartz † 1956, erst ab 2027), „Minor Swing“ (Grappelli † 1997), „Honeysuckle Rose“ (Razaf † 1973),
  „Banana Boat Song“ (Quellen von der Belafonte-Fassung 1956 geprägt), „Jamaica Farewell“ (Lord Burgess).
  Erlaubt, aber noch ohne brauchbare Notenquelle: „Trouble in Mind“ (R. M. Jones † 1945), „Nobody Knows You When You're
  Down and Out“ (Jimmie Cox † 1925), „King Porter Stomp“ (Morton † 1941), „Panama“ (Tyers † 1924).

## Entschiedene Fragen (19.11.2026)

1. **Dixieland** bekommt ein eigenes Kapitel vor Swing (umgesetzt).
2. **„St. Louis Blues“** kommt ab 2029 dazu, wenn es in der EU gemeinfrei ist.
3. **CC0 und CC BY 3.0** für die Samples sind in Ordnung, mit Namensnennung wie umgesetzt. Die Samples liegen im
   Projekt, damit das Spiel ohne Internet läuft.
4. **Alle Kapitel frei wählbar**, keine Freischaltung.
5. **Melodien und Samples bleiben so**, auch der vereinfachte Maple Leaf Rag.
6. **Mehr Jump-&-Run-Gefühl** ist gewünscht (Notenblöcke, Abgründe, Geräusche usw.); die Tasten-Spuren sind deshalb
   unten durchsichtig.

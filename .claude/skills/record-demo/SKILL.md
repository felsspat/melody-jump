---
name: record-demo
description: Record a demo video (MP4 with sound) of Melody Jump in which a bot plays the game in headless Chromium. Use when asked to record, film or capture a video/gameplay/demo of the game, e.g. a campaign level or an endless style. Defaults - English, campaign level "Ode to Joy" (folk-2), original tempo, real instruments.
---

# Record a demo video of Melody Jump

A bot plays the game like a person (key presses on the piano keyboard, exactly on the guide rings) while
headless Chromium records the game canvas and the game's own audio mix. Result: an MP4 (1280×720, 30 fps, AAC sound).

Everything runs **inside WSL**. Call the scripts with `wsl -e bash <path>` and pass arguments as separate words.
From the Bash tool (Git Bash) prefix the call with `MSYS_NO_PATHCONV=1`, otherwise Git Bash turns `/mnt/c/…` into
`C:/Program Files/Git/mnt/c/…`. Never wrap text containing backticks in `wsl -e bash -lc "…"` (the outer shell would
execute them).

## Defaults (as the user asked for them)

- Language **English** (`--lang en`)
- **Campaign**, level **`folk-2` = “Ode to Joy”** (`--level folk-2`); the video ends a few seconds after the
  level-complete screen with stars and review
- Tempo **original** (`--tempo original`, the hardest), sound **real instruments** (`--sound samples`)
- Coach panel off (cleaner picture), guide rings on

## Run

```bash
MSYS_NO_PATHCONV=1 wsl -e bash /mnt/c/Users/devri/git/melody-jump/.claude/skills/record-demo/run.sh --mp4 /mnt/c/Users/devri/Videos/melody-jump-ode-to-joy.mp4
```

Takes about as long as the video plus ~30 s. The first run installs the tools (see Setup). Run it in the background
(`run_in_background`) for long videos; it prints a status line every 5 s (`resonance`, `score`, `lives`) and a final
`result:` line.

Options (all optional):

| Option | Meaning | Default |
|---|---|---|
| `--level <id>` | campaign level, e.g. `folk-1`, `blues-2`, `reggae-3` (ids in `src/campaign/chapters.ts`) | `folk-2` |
| `--endless <style>` | endless mode instead, e.g. `reggae`, `mixed` (`ENDLESS_STYLES` in `src/world/Level.ts`) | – |
| `--seconds <n>` | play time; endless runs stop here, campaign levels stop at their end anyway | 100 (endless) |
| `--lang de\|en` | game language | `en` |
| `--tempo slow\|medium\|original` | game speed | `original` |
| `--sound samples\|synth` | real instruments or synthesizer | `samples` |
| `--fill auto\|none` | `auto`: in sections **without** a melody the bot adds a chord tone on every off-beat (good for reggae/ska); melody levels always get just the melody | `auto` |
| `--coach on\|off` | coach panel | `off` |
| `--mp4 <path>` | output file (WSL path; Windows `C:\…` = `/mnt/c/…`) | `~/melody-jump-demo.mp4` |

Example, endless reggae as in the first demo: `run.sh --endless reggae --lang de --seconds 110 --mp4 /mnt/c/Users/devri/Videos/melody-jump-reggae.mp4`

## Check the result before handing it over

- The `result:` line: `stars` (campaign), `livesLost`, `score`. Status lines should show `resonance=100` most of the
  time and bar numbers that only go up.
- `samples: ready` must appear when `--sound samples`; otherwise the video silently uses the synthesizer.
- Look at a few frames, e.g. `ffmpeg -v error -ss 30 -i <mp4> -frames:v 1 -vf scale=640:-1 /tmp/f.png`, then read the PNG.
- Loudness: `ffmpeg -i <mp4> -af volumedetect -vn -f null - 2>&1 | grep volume` (it was about −25 dB mean, −5 dB max).
- Say honestly that you can see frames but cannot hear the sound.

## Setup (automatic on first run, no root needed)

`setup.sh` installs into `~/.cache/melody-jump-video` (override with `MELODY_VIDEO_TOOLS`):

- Playwright and its **full Chromium** (`channel: 'chromium'`). The slim "headless shell" cannot decode the MP3 samples.
- `libnss3`, `libnspr4`, `libxcomposite1`, `libxdamage1`, `libxrandr2`: missing on this Ubuntu 22.04, and there is no
  passwordless sudo. They are downloaded with `apt-get download` and unpacked locally; `run.sh` sets `LD_LIBRARY_PATH`.
- `fonts-noto-color-emoji` into `~/.local/share/fonts` (otherwise ⏸, 💬 etc. are boxes).
- `ffmpeg` must already exist in WSL (it does).

## How it works / pitfalls

- **Dev server needed:** the bot reaches the game through `window.__melodyJump`, which `src/main.ts` sets only in the
  dev server. `run.sh` starts one on port 5173 if none is running (and stops it again afterwards).
- **Latency must be 0:** without a sound card, Chromium's fake output reports an `outputLatency` that keeps growing and
  jumps back. The game corrects for latency, so its clock would stutter and the bot's notes would sound late.
  `record.mjs` forces `outputLatency`/`baseLatency` to 0, which is right because the sound is tapped from the mixer.
- **Sound capture:** an init script wraps `AudioNode.connect`; whatever goes to the speakers also goes to a
  `MediaStreamDestination`. `canvas.captureStream(30)` + that audio track → `MediaRecorder` (WebM VP9/Opus) →
  chunks are streamed to Node via `exposeFunction` → `run.sh` converts to MP4 (H.264/AAC).
- **The bot** presses the keys of the guide rings (`g.guide.targets`) when their beat arrives, holding each note until
  shortly before the next one; accents on beat 1 (reggae: beat 3). The rings lie within the keyboard octave, so
  every ring has a key.
- The sequence in the video: title screen (2.5 s) → campaign map / style selection (2.5 s) → the level → result screen (6 s).

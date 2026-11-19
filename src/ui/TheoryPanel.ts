// "Understanding music" overlay: short explanations of the ideas behind the
// scoring, with Wikipedia links. Rendered as HTML (not canvas) so links are
// clickable and the text can scroll. All content comes from texts.json.

import { t, tl } from '../i18n/i18n';

export const THEORY_SECTIONS = [
  'sound',
  'consonance',
  'scale',
  'dissonance',
  'passing',
  'melody',
  'rhythm',
  'blues',
  'secondaryDominants',
  'grooves',
] as const;
export type TheorySection = (typeof THEORY_SECTIONS)[number];

/** Links are stored as "Label|URL" strings in texts.json. */
export function parseLink(entry: string): { label: string; url: string } {
  const i = entry.lastIndexOf('|');
  return i < 0 ? { label: entry, url: entry } : { label: entry.slice(0, i), url: entry.slice(i + 1) };
}

export class TheoryPanel {
  private root: HTMLDivElement;
  isOpen = false;

  constructor(private onClose: () => void) {
    this.root = document.createElement('div');
    this.root.className = 'theory-backdrop';
    this.root.hidden = true;
    // Clicking the dark backdrop (outside the card) closes the panel
    this.root.addEventListener('pointerdown', (e) => {
      if (e.target === this.root) this.close();
    });
    document.body.appendChild(this.root);
  }

  open(focus?: TheorySection): void {
    this.render(focus);
    this.root.hidden = false;
    this.isOpen = true;
    const target = focus && this.root.querySelector<HTMLElement>(`[data-section="${focus}"]`);
    if (target) target.scrollIntoView({ block: 'start' });
  }

  close(): void {
    if (!this.isOpen) return;
    this.root.hidden = true;
    this.isOpen = false;
    this.onClose();
  }

  private render(focus?: TheorySection): void {
    const card = document.createElement('div');
    card.className = 'theory-card';

    const header = document.createElement('div');
    header.className = 'theory-header';
    const h2 = document.createElement('h2');
    h2.textContent = t('theory.title');
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = t('theory.close');
    closeBtn.addEventListener('click', () => this.close());
    header.append(h2, closeBtn);

    const intro = document.createElement('p');
    intro.className = 'theory-intro';
    intro.textContent = t('theory.intro');

    const body = document.createElement('div');
    body.className = 'theory-body';
    body.appendChild(intro);

    for (const id of THEORY_SECTIONS) {
      const section = document.createElement('section');
      section.dataset.section = id;
      if (id === focus) section.classList.add('focus');
      const h3 = document.createElement('h3');
      h3.textContent = t(`theory.sections.${id}.title`);
      section.appendChild(h3);
      for (const para of tl(`theory.sections.${id}.body`)) {
        const p = document.createElement('p');
        p.textContent = para;
        section.appendChild(p);
      }
      const links = document.createElement('p');
      links.className = 'theory-links';
      links.append(t('theory.readMore') + ' ');
      tl(`theory.sections.${id}.links`).forEach((entry, i) => {
        const { label, url } = parseLink(entry);
        if (i > 0) links.append(' · ');
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = label + ' ↗';
        links.appendChild(a);
      });
      section.appendChild(links);
      body.appendChild(section);
    }

    card.append(header, body);
    this.root.replaceChildren(card);
  }
}

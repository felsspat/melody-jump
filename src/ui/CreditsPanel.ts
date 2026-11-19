// "Licenses & sources" overlay: where the instrument samples come from and under
// which license (CC BY requires visible attribution). Same look as the theory
// panel; all content comes from texts.json (credits.*).

import { t, tl } from '../i18n/i18n';
import { parseLink } from './TheoryPanel';

export const CREDIT_SOURCES = ['vcsl', 'kick', 'fluid'] as const;

export class CreditsPanel {
  private root: HTMLDivElement;
  isOpen = false;

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'theory-backdrop';
    this.root.hidden = true;
    this.root.addEventListener('pointerdown', (e) => {
      if (e.target === this.root) this.close();
    });
    document.body.appendChild(this.root);
  }

  open(): void {
    this.render();
    this.root.hidden = false;
    this.isOpen = true;
  }

  close(): void {
    this.root.hidden = true;
    this.isOpen = false;
  }

  private link(entry: string): HTMLAnchorElement {
    const { label, url } = parseLink(entry);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = label + ' ↗';
    return a;
  }

  private render(): void {
    const card = document.createElement('div');
    card.className = 'theory-card';

    const header = document.createElement('div');
    header.className = 'theory-header';
    const h2 = document.createElement('h2');
    h2.textContent = t('credits.title');
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = t('theory.close');
    closeBtn.addEventListener('click', () => this.close());
    header.append(h2, closeBtn);

    const body = document.createElement('div');
    body.className = 'theory-body';
    const intro = document.createElement('p');
    intro.className = 'theory-intro';
    intro.textContent = t('credits.intro');
    body.appendChild(intro);

    for (const id of CREDIT_SOURCES) {
      const section = document.createElement('section');
      const h3 = document.createElement('h3');
      h3.textContent = t(`credits.sources.${id}.name`);
      const what = document.createElement('p');
      what.textContent = t(`credits.sources.${id}.instruments`);
      const by = document.createElement('p');
      by.textContent = t(`credits.sources.${id}.by`);
      const links = document.createElement('p');
      links.className = 'theory-links';
      links.append(t('credits.license') + ' ', this.link(t(`credits.sources.${id}.license`)), ' · ', this.link(t(`credits.sources.${id}.source`)));
      section.append(h3, what, by, links);
      body.appendChild(section);
    }

    for (const para of tl('credits.notes')) {
      const p = document.createElement('p');
      p.className = 'theory-intro';
      p.textContent = para;
      body.appendChild(p);
    }

    card.append(header, body);
    this.root.replaceChildren(card);
  }
}

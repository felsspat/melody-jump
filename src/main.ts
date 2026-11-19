import { Game } from './game/Game';
import { detectLocale, getLocale, onLocaleChange, setLocale, t } from './i18n/i18n';

// Keep the browser tab title in sync with the selected language
onLocaleChange(() => {
  document.documentElement.lang = getLocale();
  document.title = t('title.name').replace(/♪/g, '').trim();
});
setLocale(detectLocale());

const canvas = document.getElementById('game') as HTMLCanvasElement;
new Game(canvas);

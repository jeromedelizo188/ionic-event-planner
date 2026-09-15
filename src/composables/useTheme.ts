import { ref } from 'vue';

const STORAGE_KEY = 'eventplanner-theme';

const isDark = ref(false);
let preference = 'system' as 'light' | 'dark' | 'system';

function apply(dark: boolean) {
  isDark.value = dark;
  const root = document.documentElement;
  root.classList.add('theme-anim');
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  window.setTimeout(() => root.classList.remove('theme-anim'), 320);
  try {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  } catch {
    /* storage unavailable */
  }
}

export function initTheme() {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
  preference = stored === 'light' || stored === 'dark' ? stored : 'system';
  const dark =
    stored !== null
      ? stored === 'dark'
      : window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  apply(dark);

  if (stored === null) {
    try {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          if (preference === 'system') apply(e.matches);
        });
    } catch {
      /* older browsers */
    }
  }
}

export function toggleTheme() {
  preference = isDark.value ? 'light' : 'dark';
  apply(!isDark.value);
}

export function useTheme() {
  return { isDark, toggleTheme };
}
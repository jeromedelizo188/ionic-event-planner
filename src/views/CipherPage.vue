<template>
  <ion-page class="term-page">
    <div class="term-wrap">
      <div class="term">
        <div class="titlebar">
          <div class="dot r"></div><div class="dot y"></div><div class="dot g"></div>
          <span>cipher: ~</span>
        </div>

        <div id="screen" ref="screenEl" @click="promptFocus">
          <pre class="art">{{ ART }}</pre>

          <template v-for="(line, i) in lines" :key="i">
            <div v-if="line.kind === 'text'" class="line" :class="line.cls">{{ line.text }}</div>
            <div v-else-if="line.kind === 'art'" class="art-wrap">
              <pre class="art">{{ ART }}</pre>
            </div>
            <div v-else class="line">
              <span
                v-for="(seg, j) in line.segments"
                :key="j"
                :class="seg.cls"
                >{{ seg.text }}</span
              >
            </div>
          </template>

        </div>
      </div>

      <div class="input-bar" @touchend="promptFocus" @click="promptFocus">
        <span class="prompt">visitor@localhost:<span class="path">~</span>$</span>
        <input
          id="cmd"
          ref="inputEl"
          v-model="cmd"
          class="cmd-input"
          autocomplete="off"
          spellcheck="false"
          autofocus
          @keydown="onKeydown"
        />
      </div>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { IonPage } from '@ionic/vue';
import {
  decrypt,
  encrypt,
  parseCaesarKey,
  parseVigenereKey,
  type CipherAlgorithm,
} from '@/services/cipherService';

/* ══════════════════════════════════════════════════
   CipherShell v0.1 — Linux-style crypto shell
   ══════════════════════════════════════════════════ */

const ART = `⡌⠀⠉⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣷⣄⡀⠀⠐⠊⠛⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠋⠁⠀⠀⠰⢾⢎⠙⢿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣦⣤⣀⡀⠀⣵⣯⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠠⠄⠀⠁⠀⠈⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣦⠀⠙⠛⠈⠈⠻⢿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⢀⡀⠁⠀⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠊⠄⠹⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠑⠢⣿⠷⠢⣾⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣄⠀⠀⠀⠀⠐⠪⠛⢿⣿⣿⣿⣿⣿⡄⠀⢐⣭⣿⠏⣤⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⡀⠀⠀⠀⠀⠡⠊⢿⣿⣿⣿⣿⣧⠀⠀⠀⣾⣧⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀⠂⡍⠉⠝⠃⠀⠘⠁⣹⣿⢜⢿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⠀⠀⠀⠈⠀⠃⠀⠈⣀⠀⣶⢤⣂⠚⠏⣾⡷⢺⡭⣟⡻⢿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠓⢀⠁⠪⢂⠼⠛⠻⢤⣷⣿⠏⠤⢿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⡀⠀⠀⠀⠀⡀⠚⢣⡀⠀⠠⣽⣷⡈⡛⠿⠈⠴⣸`;

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const randCh = () => CHARS[Math.floor(Math.random() * CHARS.length)];
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const BOOT = [
  'caesar.ko: loading cipher module',
  'random: initializing entropy pool',
  'mounting /dev/secure volume',
  'starting cipher daemon (cipherd)',
  'reading keyring from /etc/keys',
  'tty1: secure shell ready',
];

type Segment = { text: string; cls: string };
type Line =
  | { kind: 'text'; text: string; cls: string }
  | { kind: 'segments'; segments: Segment[] }
  | { kind: 'art' };
type WizardMode = null | 'enc-text' | 'dec-text' | 'enc-key' | 'dec-key';
interface OpEntry {
  op: string;
  algo: CipherAlgorithm;
  key: string;
  input: string;
  output: string;
}

const lines = ref<Line[]>([]);
const cmd = ref('');
const screenEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLInputElement | null>(null);

let busy = false; // lock input during animations
let mode: WizardMode = null; // wizard state
let stepData: { text?: string; algo?: CipherAlgorithm } = {};
const opLog: OpEntry[] = []; // session operation log
const cmdHistory: string[] = [];
let histIdx = -1;

// The prompt no longer scrolls away, but keep the output pinned to the
// bottom as new lines are printed.
watch(cmd, () => scrollDownAsync());

/* ── output helpers ───────────────────────────── */
function scrollDown() {
  const el = screenEl.value;
  if (el) el.scrollTop = el.scrollHeight;
}

function scrollDownAsync() {
  void nextTick(scrollDown);
}

function pushLine(line: Line): number {
  lines.value.push(line);
  scrollDownAsync();
  return lines.value.length - 1;
}

function print(text = '', cls = ''): number {
  return pushLine({ kind: 'text', text, cls });
}

/* ══════════════════════════════════════════════════
   ★ RANDOM LETTER/NUMBER SCRAMBLE LOADER ★
   Scrambles chars, then locks into final text + [OK]
   ══════════════════════════════════════════════════ */
async function scrambleTask(label: string, duration = 1200) {
  const index = print('');
  const width = Math.max(label.length, 24);
  const steps = 22;

  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    const locked = Math.floor(p * width);
    let frame = '';
    for (let j = 0; j < width; j++) {
      frame += j < locked || label[j] === ' ' ? label[j] || ' ' : randCh();
    }
    const filled = Math.round(p * 16);
    const bar = '█'.repeat(filled) + '░'.repeat(16 - filled);
    lines.value[index] = {
      kind: 'text',
      cls: '',
      text: `[${bar}] ${String(Math.round(p * 100)).padStart(3)}%  ${frame}`,
    };
    scrollDownAsync();
    await sleep(duration / steps);
  }

  lines.value.splice(index, 1, {
    kind: 'segments',
    segments: [
      { text: `[${'█'.repeat(16)}] 100%  ${label} `, cls: '' },
      { text: '[ OK ]', cls: 'ok' },
    ],
  });
  scrollDownAsync();
}

/* ══════════════════════════════════════════════════
   BOOT SEQUENCE (dmesg style)
   ══════════════════════════════════════════════════ */
async function boot() {
  busy = true;
  let t = 0;
  for (const msg of BOOT) {
    const stamp = `[${(t += 0.2 + Math.random() * 0.2).toFixed(6)}]`;
    const index = print('');
    const spin = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < spin; i++) {
      let s = '';
      for (let j = 0; j < msg.length; j++) s += msg[j] === ' ' ? ' ' : randCh();
      lines.value[index] = { kind: 'text', cls: '', text: `${stamp} ${s}` };
      scrollDownAsync();
      await sleep(45);
    }
    lines.value.splice(index, 1, {
      kind: 'segments',
      segments: [
        { text: stamp + ' ', cls: 'dim' },
        { text: msg + ' ', cls: '' },
        { text: '[ OK ]', cls: 'ok' },
      ],
    });
    scrollDownAsync();
  }
  print('');
  print("CipherShell 0.1 — type 'help' for commands.", 'white');
  print('');
  busy = false;
}

/* ══════════════════════════════════════════════════
   WIZARD FLOWS
   ══════════════════════════════════════════════════ */
async function wizardAnswer(answer: string) {
  if (mode === 'enc-text' || mode === 'dec-text') {
    if (!answer) {
      print('Empty input. Aborted.', 'err');
      mode = null;
      return;
    }
    stepData.text = answer;
    mode = mode === 'enc-text' ? 'enc-key' : 'dec-key';
    print(stepData.algo === 'vigenere' ? 'Enter keyword:' : 'Enter shift key (1-25):', 'dim');
    return;
  }

  if (mode === 'enc-key' || mode === 'dec-key') {
    const algo = stepData.algo ?? 'caesar';
    const text = stepData.text ?? '';
    const isEnc = mode === 'enc-key';

    let keyLabel: string;
    if (algo === 'vigenere') {
      if (parseVigenereKey(answer) === null) {
        print('Invalid keyword. Must contain letters. Aborted.', 'err');
        mode = null;
        return;
      }
      keyLabel = answer.trim();
    } else {
      const key = parseCaesarKey(answer);
      if (key === null) {
        print('Invalid key. Must be 1-25. Aborted.', 'err');
        mode = null;
        return;
      }
      keyLabel = String(key);
    }
    mode = null;

    const verb = isEnc ? 'Encrypting with' : 'Decrypting with';
    const kind = algo === 'vigenere' ? 'keyword ' : 'shift ';
    await scrambleTask(`${verb} ${kind}${keyLabel}`, 1400);

    const result = isEnc ? encrypt(text, algo, answer) : decrypt(text, algo, answer);
    print('');

    pushLine({
      kind: 'segments',
      segments: [
        { text: (isEnc ? 'CIPHERTEXT' : 'PLAINTEXT') + ': ', cls: isEnc ? 'cyan' : 'white' },
        { text: result.output, cls: isEnc ? 'white' : 'cyan' },
      ],
    });
    print('');

    opLog.push({ op: isEnc ? 'ENCRYPT' : 'DECRYPT', algo, key: keyLabel, input: text, output: result.output });
    stepData = {};
  }
}

function startWizard(direction: 'enc' | 'dec', requested: string) {
  if (requested && requested !== 'caesar' && requested !== 'vigenere') {
    print(`Unknown algorithm '${requested}' — use caesar or vigenere.`, 'err');
    return;
  }
  stepData.algo = requested === 'vigenere' ? 'vigenere' : 'caesar';
  mode = direction === 'enc' ? 'enc-text' : 'dec-text';
  print(direction === 'enc' ? 'Enter plaintext:' : 'Enter ciphertext:', 'dim');
}

/* ══════════════════════════════════════════════════
   COMMAND ROUTER
   ══════════════════════════════════════════════════ */
async function exec(raw: string) {
  const command = raw.trim();

  // wizard input takes priority
  if (mode) {
    await wizardAnswer(raw);
    return;
  }
  if (!command) return;

  const [name, ...args] = command.split(/\s+/);

  switch (name) {
    case 'help':
      print('Available commands:');
      print('  encrypt    - encrypt plaintext (wizard)', 'dim');
      print('  decrypt    - decrypt ciphertext (wizard)', 'dim');
      print('  log        - show session operation log', 'dim');
      print('  banner     - reprint ascii art', 'dim');
      print('  clear      - clear screen', 'dim');
      print('  reboot     - replay boot sequence', 'dim');
      print('  about      - version info', 'dim');
      print('  ls / whoami / uname - easter eggs', 'dim');
      print('');
      print('Add an algorithm to use Vigenere instead of Caesar:', 'dim');
      print('  encrypt vigenere   decrypt vigenere', 'dim');
      break;

    case 'encrypt':
      startWizard('enc', args[0] ?? '');
      break;

    case 'decrypt':
      startWizard('dec', args[0] ?? '');
      break;

    case 'log':
      if (!opLog.length) {
        print('No operations logged yet.', 'warn');
        break;
      }
      opLog.forEach((entry, i) => {
        print(`[${i + 1}] ${entry.op} ${entry.algo} (key=${entry.key})`, 'cyan');
        print(`    in : ${entry.input}`, 'dim');
        print(`    out: ${entry.output}`, 'dim');
      });
      break;

    case 'banner':
      pushLine({ kind: 'art' });
      break;

    case 'clear':
      lines.value = [];
      break;

    case 'reboot':
      lines.value = [];
      print('Rebooting...', 'warn');
      await sleep(500);
      await boot();
      break;

    case 'about':
      print('CipherShell v0.1', 'white');
      print('Course : ITP 412 - Information Assurance & Security', 'dim');
      print('Cipher : Caesar shift / Vigenere keyword', 'dim');
      print('Status : awaiting v1.0 upgrade (AES-256)', 'dim');
      break;

    case 'ls':
      print('plaintext.txt  ciphertext.enc  key.key  readme.md', 'cyan');
      break;

    case 'whoami':
      print('visitor');
      break;

    case 'uname':
      print('CipherShell localhost 0.1 #1 SMP x86_64 GNU/Linux', 'dim');
      break;

    default:
      print(`bash: ${name}: command not found`, 'err');
  }
}

/* ══════════════════════════════════════════════════
   INPUT HANDLING
   ══════════════════════════════════════════════════ */
async function onKeydown(e: KeyboardEvent) {
  // Only Enter is gated while an animation runs, so keystrokes are not
  // swallowed during the boot sequence or the scramble loader.
  if (busy && e.key === 'Enter') {
    e.preventDefault();
    return;
  }

  // arrow-up / arrow-down = command history
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (cmdHistory.length) {
      histIdx = histIdx < 0 ? cmdHistory.length - 1 : Math.max(0, histIdx - 1);
      cmd.value = cmdHistory[histIdx];
    }
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (histIdx >= 0 && histIdx < cmdHistory.length - 1) {
      cmd.value = cmdHistory[++histIdx];
    } else {
      histIdx = -1;
      cmd.value = '';
    }
    return;
  }

  if (e.key !== 'Enter') return;
  const raw = cmd.value;
  cmd.value = '';
  histIdx = -1;

  // echo the command like a real terminal
  pushLine({
    kind: 'segments',
    segments: [
      { text: 'visitor@localhost:', cls: 'prompt' },
      { text: '~', cls: 'path' },
      { text: '$ ', cls: 'prompt' },
      { text: raw, cls: '' },
    ],
  });

  if (raw.trim() && !mode) cmdHistory.push(raw.trim());

  busy = true;
  try {
    await exec(raw);
  } finally {
    // Without this, a throw inside exec leaves busy stuck true and the
    // prompt can never accept a command again.
    busy = false;
  }
  scrollDown();
}

function focusInput() {
  // preventScroll is essential: a plain focus() makes the browser
  // scroll the prompt into view, which fights any drag on the screen
  // and makes it impossible to scroll back up through the history.
  inputEl.value?.focus({ preventScroll: true });
}

// Focus from a real user gesture, which is the only context Android will
// open the soft keyboard in. Two Android specifics are handled here:
//
// 1. If the field is already focused but the keyboard was dismissed, a
//    focus() call is a no-op and the keyboard stays closed. Blipping
//    blur then focus forces the IME to come back up.
// 2. This is bound to touchend as well as click, so the focus happens in
//    the same gesture rather than after the synthesised click.
function promptFocus() {
  const el = inputEl.value;
  if (!el) return;
  if (document.activeElement === el) el.blur();
  el.focus({ preventScroll: true });
}

onMounted(() => {
  focusInput();
  void boot().then(() => {
    focusInput();
    scrollDown();
  });

  // Returning from the background can leave the WebView with a stale
  // scroll offset. Do not blur here: the browser fires this whenever a
  // tab or window loses focus, which would banish the caret.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      scrollDown();
      focusInput();
    }
  });

  // Returning to the window or app is the signal that works when
  // visibilitychange is unreliable, e.g. inside an Android WebView.
  window.addEventListener('focus', () => {
    focusInput();
  });
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* The terminal is dark-only, so it overrides the pastel theme shell
   that variables.css applies to body / ion-page. */
:global(html body) {
  background: #000;
  color: #00ff41;
  font-family: 'DejaVu Sans Mono', 'Consolas', 'Courier New', monospace;
  -webkit-font-smoothing: none;
}

/* subtle CRT scanlines */
:global(html body)::after {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0 2px,
    rgba(0, 255, 65, 0.025) 2px 4px
  );
  pointer-events: none;
  z-index: 9999;
}

.term-page {
  background: #000;
  font-family: 'DejaVu Sans Mono', 'Consolas', 'Courier New', monospace;
  color: #00ff41;
}

.term-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  /* Stacks the command bar under the terminal, both centred at the
     same max width so the two line up as one unit. */
  justify-content: flex-start;
  align-items: center;
  padding: 25px 12px;
  padding-top: calc(25px + env(safe-area-inset-top, 0px));
  padding-bottom: calc(25px + env(safe-area-inset-bottom, 0px));
}

.term {
  width: 100%;
  max-width: 920px;
  /* Grow to fill whatever the command bar leaves behind, and never
     squash below zero: min-height:0 is what lets #screen actually
     scroll instead of pushing the box off screen. */
  flex: 1 1 auto;
  min-height: 0;
  max-height: 78vh;
  display: flex;
  flex-direction: column;
  background: #0c0f0c;
  border: 1px solid #1e3324;
  box-shadow:
    0 0 40px rgba(0, 255, 65, 0.12),
    0 0 4px rgba(0, 255, 65, 0.3);
  border-radius: 6px;
  overflow: hidden;
}

/* Pointing at the terminal says "this is typeable". */
.term:hover {
  border-color: #2c4a35;
  box-shadow:
    0 0 52px rgba(0, 255, 65, 0.18),
    0 0 6px rgba(0, 255, 65, 0.38);
}

/* ── title bar ── */
.titlebar {
  background: #161b16;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #1e3324;
  flex-shrink: 0;
}
.dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
.dot.r {
  background: #ff5f56;
}
.dot.y {
  background: #ffbd2e;
}
.dot.g {
  background: #27c93f;
}
.titlebar span {
  margin: 0 auto;
  font-size: 0.75em;
  color: #3fae5f;
  letter-spacing: 1px;
}

/* ── screen ── */
#screen {
  flex: 1;
  /* min-height:0 is required, otherwise this flex child keeps its
     intrinsic content height, overflows .term and gets clipped by
     .term's overflow:hidden — leaving nothing to scroll and putting
     the input line permanently out of reach. */
  min-height: 0;
  overflow-y: auto;
  /* Claim the vertical drag gesture so a touch scroll is not swallowed
     by the page, and keep momentum scrolling on in the Android WebView. */
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 16px 18px;
  font-size: 14px;
  line-height: 1.45;
  cursor: text;
}
#screen::-webkit-scrollbar {
  width: 8px;
}
#screen::-webkit-scrollbar-track {
  background: #0c0f0c;
}
#screen::-webkit-scrollbar-thumb {
  background: #1e3324;
  border-radius: 4px;
}

/* ── ascii art ── */
.art {
  color: #00ff41;
  text-shadow: 0 0 6px rgba(0, 255, 65, 0.55);
  font-size: 11px;
  line-height: 1.15;
  margin-bottom: 14px;
  user-select: none;
  -webkit-user-select: none;
  font-family: inherit;
  white-space: pre;
  overflow-x: auto;
}

.line {
  white-space: pre-wrap;
  word-break: break-all;
}
.dim {
  color: #1d8a3c;
}
.ok {
  color: #27c93f;
  font-weight: bold;
}
.warn {
  color: #ffbd2e;
}
.err {
  color: #ff5f56;
}
.white {
  color: #e8ffe8;
}
.cyan {
  color: #00e5ff;
}

.prompt {
  color: #27c93f;
  font-weight: bold;
}
.prompt .path {
  color: #00e5ff;
}
/* ── command bar ── */
/* Pinned below the screen instead of inside it. Keeping the field out of
   the scroller means focusing it can no longer drag the output around,
   and the whole bar is a large, obvious tap target that opens the
   Android keyboard natively. */
.input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  width: 100%;
  max-width: 920px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #05100a;
  border: 1px solid #1c3a26;
  border-top: 2px solid #2c4a35;
  border-radius: 6px;
  cursor: text;
}

.input-bar:hover {
  border-color: #2c4a35;
  box-shadow:
    0 0 22px rgba(0, 255, 65, 0.16),
    0 0 4px rgba(0, 255, 65, 0.35);
}

.cmd-input {
  flex: 1 1 auto;
  min-width: 0;
  background: #020a05;
  border: 1px solid #1c3a26;
  border-radius: 4px;
  /* A real, comfortable touch target: at least a 44px tap area. */
  padding: 10px 12px;
  min-height: 44px;
  color: #e8ffe8;
  font-family: inherit;
  font-size: 16px;
  cursor: text;
  caret-color: #00ff41;
}

.cmd-input:focus {
  outline: none;
  border-color: #00ff41;
  box-shadow: 0 0 10px rgba(0, 255, 65, 0.35);
}
</style>

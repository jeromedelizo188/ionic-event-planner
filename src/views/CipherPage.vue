<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <div class="topbar">
          <LogoMark :size="34" />
          <div class="tb-titles">
            <span class="tb-name">CipherBox</span>
            <span class="tb-sub">Offline Caesar &amp; Vigenere cipher</span>
          </div>
          <div class="tb-actions">
            <ThemeToggle />
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="wrap">
        <!-- Encrypt / Decrypt -->
        <div class="chip-strip">
          <button
            v-for="mode in MODES"
            :key="mode.value"
            class="chip"
            :class="{ active: cipherMode === mode.value }"
            @click="cipherMode = mode.value"
          >
            <i :class="mode.icon"></i>
            {{ mode.label }}
          </button>
        </div>

        <!-- Algorithm -->
        <div class="field">
          <label class="field-label">Algorithm</label>
          <div class="chip-strip">
            <button
              v-for="option in CIPHER_ALGORITHMS"
              :key="option.value"
              class="chip"
              :class="{ active: algorithm === option.value }"
              @click="algorithm = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- Key -->
        <div class="field">
          <label class="field-label" for="key-input">
            {{ algorithm === 'caesar' ? 'Shift' : 'Keyword' }}
          </label>
          <div class="key-row">
            <input
              id="key-input"
              v-model="key"
              class="key-input"
              :type="algorithm === 'caesar' ? 'number' : 'text'"
              :inputmode="algorithm === 'caesar' ? 'numeric' : 'text'"
              :placeholder="algorithm === 'caesar' ? '3' : 'LEMON'"
              autocomplete="off"
            />
            <button class="swap-btn" @click="swap" aria-label="Swap input and output">
              <i class="fa-solid fa-right-left"></i>
            </button>
          </div>
          <p class="field-hint">{{ hint }}</p>
        </div>

        <!-- Input -->
        <div class="field">
          <label class="field-label" for="input-text">
            {{ cipherMode === 'encrypt' ? 'Plaintext' : 'Ciphertext' }}
          </label>
          <textarea
            id="input-text"
            v-model="input"
            class="io-area"
            :placeholder="cipherMode === 'encrypt' ? 'Type your message' : 'Paste your ciphertext'"
            autocapitalize="off"
            autocomplete="off"
            spellcheck="false"
            rows="5"
          ></textarea>
        </div>

        <!-- Error -->
        <div v-if="error" class="error-chip">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span class="error-text">{{ error }}</span>
        </div>

        <!-- Output -->
        <div class="ac-card is-lime out-card">
          <div class="out-head">
            <span class="out-chip">
              <i class="fa-solid fa-lock"></i>
              {{ cipherMode === 'encrypt' ? 'Ciphertext' : 'Plaintext' }}
            </span>
            <button class="out-copy" @click="copy">
              <i class="fa-solid fa-copy"></i>
              {{ copied ? 'Copied' : 'Copy' }}
            </button>
          </div>
          <p class="out-text" :class="{ 'is-empty': !output }">
            {{ output || 'Result appears here' }}
          </p>
        </div>

        <button class="reset-btn" @click="reset">
          <i class="fa-solid fa-eraser"></i> Clear
        </button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonContent, IonHeader, IonPage, IonToolbar } from '@ionic/vue';
import {
  CIPHER_ALGORITHMS,
  decrypt,
  encrypt,
  type CipherAlgorithm,
} from '@/services/cipherService';
import ThemeToggle from '@/components/ThemeToggle.vue';
import LogoMark from '@/components/LogoMark.vue';

type CipherMode = 'encrypt' | 'decrypt';

const MODES: ReadonlyArray<{ value: CipherMode; label: string; icon: string }> = [
  { value: 'encrypt', label: 'Encrypt', icon: 'fa-solid fa-lock' },
  { value: 'decrypt', label: 'Decrypt', icon: 'fa-solid fa-lock-open' },
];

const cipherMode = ref<CipherMode>('encrypt');
const algorithm = ref<CipherAlgorithm>('caesar');
const key = ref('3');
const input = ref('');
const copied = ref(false);

const hint = computed(() =>
  algorithm.value === 'caesar'
    ? 'Whole number from 1 to 25.'
    : 'Letters only, repeated across the message.'
);

const result = computed(() =>
  cipherMode.value === 'encrypt'
    ? encrypt(input.value, algorithm.value, key.value)
    : decrypt(input.value, algorithm.value, key.value)
);

const output = computed(() => result.value.output);
const error = computed(() => result.value.error);

function swap(): void {
  const transferred = output.value;
  input.value = transferred;
  cipherMode.value = cipherMode.value === 'encrypt' ? 'decrypt' : 'encrypt';
}

async function copy(): Promise<void> {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch {
    copied.value = false;
  }
}

function reset(): void {
  input.value = '';
  copied.value = false;
}
</script>

<style scoped>
/* ===== Top bar ===== */
.topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 14px 8px;
}

.tb-titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-right: auto;
}

.tb-name {
  font-weight: 900;
  font-size: 1.02rem;
  color: var(--sk-text);
  line-height: 1.15;
  letter-spacing: -0.01em;
}

.tb-sub {
  font-size: 0.66rem;
  font-weight: 500;
  color: var(--sk-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tb-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ===== Content ===== */
.wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 6px 14px 40px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sk-text-muted);
  padding: 0 2px;
}

.field-hint {
  margin: 0;
  font-size: 0.72rem;
  color: var(--sk-text-muted);
  padding: 0 2px;
}

/* ===== Chips ===== */
.chip-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px;
  scrollbar-width: none;
}

.chip-strip::-webkit-scrollbar {
  display: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  height: 30px;
  padding: 0 13px;
  border: none;
  border-radius: var(--sk-radius-pill);
  background: var(--sk-chip-bg);
  color: var(--sk-chip-text);
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    transform 0.14s ease;
}

.chip:active {
  transform: scale(0.95);
}

.chip.active {
  background: var(--sk-lime-deep);
  color: #ffffff;
}

.chip i {
  font-size: 11px;
}

/* ===== Key row ===== */
.key-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.key-input {
  flex: 1;
  min-width: 0;
  height: 42px;
  padding: 0 14px;
  border-radius: var(--sk-radius-pill);
  border: 1px solid var(--sk-border);
  background: var(--sk-surface);
  color: var(--sk-text);
  font-size: 0.92rem;
  font-weight: 700;
  outline: none;
}

.key-input:focus {
  border-color: var(--sk-accent-shade);
}

.swap-btn {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: var(--sk-chip-bg);
  color: var(--sk-chip-text);
  font-size: 15px;
  cursor: pointer;
}

.swap-btn:active {
  transform: scale(0.94);
}

/* ===== Text area ===== */
.io-area {
  width: 100%;
  resize: vertical;
  padding: 13px 14px;
  border-radius: var(--sk-radius-card);
  border: 1px solid var(--sk-border);
  background: var(--sk-surface);
  color: var(--sk-text);
  font-size: 0.95rem;
  line-height: 1.5;
  outline: none;
}

.io-area:focus {
  border-color: var(--sk-accent-shade);
}

/* ===== Error chip ===== */
.error-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: var(--sk-radius-pill);
  background: var(--sk-red-tint);
  border: 1px solid rgba(229, 101, 79, 0.28);
  color: var(--sk-coral-deep);
  font-size: 0.76rem;
}

.error-text {
  flex: 1;
  min-width: 0;
}

/* ===== Output card ===== */
.ac-card {
  border-radius: var(--sk-radius-card);
  padding: 15px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--sk-on-accent);
  box-shadow: var(--sk-raised-soft);
}

.is-lime {
  background: var(--sk-lime);
}

.out-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.out-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: var(--sk-radius-pill);
  background: rgba(255, 255, 255, 0.55);
  color: var(--sk-on-accent);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.out-copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  cursor: pointer;
  padding: 4px 11px;
  border-radius: var(--sk-radius-pill);
  background: rgba(255, 255, 255, 0.55);
  color: var(--sk-on-accent);
  font-size: 0.68rem;
  font-weight: 800;
}

.out-copy i {
  font-size: 10px;
}

.out-text {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.out-text.is-empty {
  opacity: 0.6;
  font-weight: 600;
}

/* ===== Reset ===== */
.reset-btn {
  align-self: center;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 36px;
  padding: 0 18px;
  border-radius: var(--sk-radius-pill);
  background: var(--sk-chip-bg);
  color: var(--sk-chip-text);
  font-weight: 800;
  font-size: 0.8rem;
}

.reset-btn i {
  font-size: 12px;
}

@media (max-width: 380px) {
  .tb-sub {
    display: none;
  }
}
</style>

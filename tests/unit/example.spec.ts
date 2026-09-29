import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import CipherPage from '@/views/CipherPage.vue'
import { describe, expect, test, vi } from 'vitest'
import { decrypt, encrypt } from '@/services/cipherService'

describe('CipherPage.vue', () => {
  test('renders cipher page', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: []
    })
    const wrapper = mount(CipherPage, {
      global: {
        plugins: [router]
      }
    })
    expect(wrapper.text()).toMatch('cipher: ~')
    wrapper.unmount()
  })
})

describe('CipherPage terminal interaction', () => {
  // attachTo is required for focus to actually move in jsdom, so the
  // tap-to-type behaviour is genuinely exercised rather than mocked.
  const mountPage = () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: []
    })
    return mount(CipherPage, {
      attachTo: document.body,
      global: {
        plugins: [router]
      }
    })
  }

  test('keeps the input out of the scroll container', () => {
    const wrapper = mountPage()
    const screen = wrapper.get('#screen').element
    const input = wrapper.get('#cmd').element
    // The field used to live inside #screen, so focusing it dragged the
    // output around and scrolling could not be done independently of it.
    expect(screen.contains(input)).toBe(false)
    expect(wrapper.get('.input-bar').element.contains(input)).toBe(true)
    wrapper.unmount()
  })

  // jsdom will not reliably move focus away from the field via blur(),
  // so park focus on a real sibling element instead and assert from there.
  const focusElsewhere = () => {
    const other = document.createElement('input')
    document.body.appendChild(other)
    other.focus()
    return other
  }

  test('tapping the command bar focuses the input', async () => {
    const wrapper = mountPage()
    const input = wrapper.get('#cmd').element as HTMLInputElement
    const other = focusElsewhere()
    expect(document.activeElement).toBe(other)
    await wrapper.get('.input-bar').trigger('pointerdown')
    expect(document.activeElement).toBe(input)
    other.remove()
    wrapper.unmount()
  })

  test('tapping the screen focuses the input', async () => {
    const wrapper = mountPage()
    const input = wrapper.get('#cmd').element as HTMLInputElement
    const other = focusElsewhere()
    expect(document.activeElement).toBe(other)
    await wrapper.get('#screen').trigger('click')
    expect(document.activeElement).toBe(input)
    other.remove()
    wrapper.unmount()
  })

  test('a full tap sequence does not leave the field unfocused', async () => {
    const wrapper = mountPage()
    const input = wrapper.get('#cmd').element as HTMLInputElement
    const bar = wrapper.get('.input-bar')
    const other = focusElsewhere()
    // One real tap produces pointerdown and then click. Guards against a
    // handler that ends the gesture by blurring the field again.
    //
    // Note this cannot catch the original Android bug: the old code
    // blurred then refocused, which ends focused either way, and jsdom
    // has no IME so keyboard state is not observable here.
    await bar.trigger('pointerdown')
    await bar.trigger('click')
    expect(document.activeElement).toBe(input)
    other.remove()
    wrapper.unmount()
  })

  test('accepts typed text', async () => {
    const wrapper = mountPage()
    const input = wrapper.get('#cmd')
    await input.setValue('hello')
    expect((input.element as HTMLInputElement).value).toBe('hello')
    wrapper.unmount()
  })

  test('runs a command once the boot sequence is done', async () => {
    const wrapper = mountPage()
    // The boot scramble is randomised in both length and duration, so
    // poll for its completion rather than guessing a wait. Enter is
    // gated until it finishes.
    await vi.waitFor(() => {
      expect(wrapper.text()).toMatch('type \'help\' for commands')
    }, { timeout: 15000, interval: 50 })
    const input = wrapper.get('#cmd')
    await input.setValue('about')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.text()).toMatch('CipherShell v0.1')
    expect((input.element as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })
})

describe('cipherService', () => {
  test('caesar encrypts and decrypts back to the original', () => {
    const plain = 'Attack at Dawn! 42'
    const { output, error } = encrypt(plain, 'caesar', '3')
    expect(error).toBe('')
    expect(output).toBe('Dwwdfn dw Gdzq! 42')
    expect(decrypt(output, 'caesar', '3').output).toBe(plain)
  })

  test('caesar leaves non-letters untouched', () => {
    expect(encrypt('a-b_c 123', 'caesar', '1').output).toBe('b-c_d 123')
  })

  test('caesar wraps around the alphabet', () => {
    expect(encrypt('xyz XYZ', 'caesar', '3').output).toBe('abc ABC')
  })

  test('vigenere encrypts and decrypts back to the original', () => {
    const plain = 'ATTACKATDAWN'
    const { output, error } = encrypt(plain, 'vigenere', 'LEMON')
    expect(error).toBe('')
    expect(output).toBe('LXFOPVEFRNHR')
    expect(decrypt(output, 'vigenere', 'LEMON').output).toBe(plain)
  })

  test('rejects an out-of-range caesar shift', () => {
    expect(encrypt('hello', 'caesar', '26').error).not.toBe('')
    expect(encrypt('hello', 'caesar', 'abc').error).not.toBe('')
  })

  test('rejects an empty vigenere keyword', () => {
    expect(encrypt('hello', 'vigenere', '123').error).not.toBe('')
  })
})

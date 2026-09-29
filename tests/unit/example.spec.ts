import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import CipherPage from '@/views/CipherPage.vue'
import { describe, expect, test } from 'vitest'
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
    expect(wrapper.text()).toMatch('cipher@localhost')
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

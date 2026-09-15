import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import { describe, expect, test } from 'vitest'

describe('HomePage.vue', () => {
  test('renders home vue', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: []
    })
    const wrapper = mount(HomePage, {
      global: {
        plugins: [router]
      }
    })
    expect(wrapper.text()).toMatch('Event Planner')
    wrapper.unmount()
  })
})
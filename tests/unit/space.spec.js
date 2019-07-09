import Vuex from 'vuex'
import {
  createLocalVue,
  shallowMount
} from '@vue/test-utils'

import Space from '@/views/Space.vue'
import Card from '@/components/Card.vue'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Space.vue', () => {
  let store
  let actions
  beforeEach(() => {
    // space = {
    //   actionClick: jest.fn(),
    //   actionInput: jest.fn()
    // }
    store = new Vuex.Store({
      state: {
        currentSpace: {
          cards: [
            { id: 1 }
          ]
        }
      },
      actions
    })
  })

  it('renders cards when passed', () => {
    const wrapper = shallowMount(Space, {
      // propsData: { msg },
      store,
      localVue
    })
    // expect(wrapper.text()).toMatch(msg)
    expect(wrapper.contains(Card)).toBe(true)
  })
})

import Vuex from 'vuex'
import {
  createLocalVue,
  shallowMount
} from '@vue/test-utils'

import Space from '@/components/Space.vue'

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
      state: {},
      actions
    })
  })

  it('renders props.msg when passed', () => {
    const msg = 'new message'
    const wrapper = shallowMount(Space, {
      propsData: { msg },
      store,
      localVue
    })
    expect(wrapper.text()).toMatch(msg)
  })
})

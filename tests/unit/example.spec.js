import { shallowMount } from '@vue/test-utils'
import Space from '@/components/Space.vue'

describe('Space.vue', () => {
  it('renders props.msg when passed', () => {
    const msg = 'new message'
    const wrapper = shallowMount(Space, {
      propsData: { msg }
    })
    expect(wrapper.text()).toMatch(msg)
  })
})

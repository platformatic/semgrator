import type { Migration } from '../../../lib/semgrator.js'
import type { Order } from '../order.js'

const migration: Migration<Order> = {
  version: '0.17.0',
  up: (input: Order) => {
    input.order.push('0.17.0')
    return input
  },
}

export default migration

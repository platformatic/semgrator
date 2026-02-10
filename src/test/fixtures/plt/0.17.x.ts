import type { Migration } from '../../../lib/semgrator.ts'
import type { Order } from '../order.ts'

const migration: Migration<Order> = {
  version: '0.17.0',
  up: (input: Order) => {
    input.order.push('0.17.0')
    return input
  },
}

export default migration

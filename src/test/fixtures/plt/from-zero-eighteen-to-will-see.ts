import type { Migration } from '../../../lib/semgrator.js'
import type { Order } from '../order.js'

export const migration: Migration<Order> = {
  version: '0.18.0',
  up: (input: Order) => {
    input.order.push('0.18.0')
    return input
  },
}

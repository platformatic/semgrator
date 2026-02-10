import type { Migration } from '../../../lib/semgrator.ts'
import type { Order } from '../order.ts'

export const migration: Migration<Order> = {
  version: '0.18.0',
  up: (input: Order) => {
    input.order.push('0.18.0')
    return input
  },
}

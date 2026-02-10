import type { Migration } from '../../../lib/semgrator.ts'
import type { Order } from '../order.ts'

export const migration: Migration<Order> = {
  version: '1.0.0',
  toVersion: '1.42.0',
  up: (input: Order) => {
    input.order.push('1.0.0')
    return input
  },
}

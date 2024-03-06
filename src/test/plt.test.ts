import { test } from 'node:test'
import { semgrator } from '../lib/semgrator.js'
import { join } from 'desm'
import type { Order } from './fixtures/order.js'
import { equal, deepEqual } from 'node:assert/strict'

test('apply all migrations in a folder', async t => {
  const res = await semgrator<Order>({
    version: '0.15.0',
    path: join(import.meta.url, 'fixtures', 'plt'),
    input: {
      order: [],
    },
  })

  equal(res.version, '1.42.0')
  deepEqual(res.result, {
    order: ['0.16.0', '0.17.0', '0.18.0', '1.0.0'],
  })
})

test('only applies needed migration from a folder', async t => {
  const res = await semgrator<Order>({
    version: '0.16.1',
    path: join(import.meta.url, 'fixtures', 'plt'),
    input: {
      order: [],
    },
  })

  equal(res.version, '1.42.0')
  deepEqual(res.result, {
    order: ['0.17.0', '0.18.0', '1.0.0'],
  })
})

test('async iterate over all migrations', async t => {
  const iterator = semgrator<Order>({
    version: '0.15.0',
    path: join(import.meta.url, 'fixtures', 'plt'),
    input: {
      order: [],
    },
  })

  const expected = ['0.16.0', '0.17.0', '0.18.0', '1.42.0']

  for await (const res of iterator) {
    equal(res.version, expected.shift())
  }
})

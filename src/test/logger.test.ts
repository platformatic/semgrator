import { test } from 'node:test'
import { pino } from 'pino'
import { sink, consecutive } from 'pino-test'
import { semgrator } from '../lib/semgrator.ts'
import type { Migration } from '../lib/semgrator.ts'

type SeenBy = {
  foo: string
}

test('logger', async t => {
  const m1: Migration<SeenBy> = {
    version: '2.0.0',
    async up(input) {
      return input
    },
  }

  const m2: Migration<SeenBy> = {
    version: '2.4.0',
    async up(input) {
      return input
    },
  }

  const stream = sink()
  const logger = pino(stream)

  await semgrator<SeenBy, SeenBy>({
    version: '1.0.0',
    migrations: [m1, m2],
    logger,
    input: {
      foo: 'bar',
    },
  })

  await consecutive(stream, [
    {
      msg: 'Migrating to version 2.0.0',
      level: 30,
    },
    {
      msg: 'Migrating to version 2.4.0',
      level: 30,
    },
  ])
})

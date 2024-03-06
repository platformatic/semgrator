import { test } from 'node:test'
import { semgrator, Migration } from '../lib/semgrator.js'
import { tspl } from '@matteo.collina/tspl'
import { throws } from 'node:assert/strict'

type SeenBy = {
  foo: string
  seenBy?: string
}

test('apply all  migrations', async t => {
  const plan = tspl(t, { plan: 3 })
  const m1: Migration<SeenBy> = {
    version: '2.0.0',
    async up(input) {
      return {
        ...input,
        seenBy: '2.0.0',
      }
    },
  }

  const m2: Migration<SeenBy> = {
    version: '2.4.0',
    up(input) {
      plan.deepEqual(input, {
        foo: 'bar',
        seenBy: '2.0.0',
      })
      return {
        ...input,
        seenBy: '2.4.0',
      }
    },
  }

  const res = await semgrator<SeenBy, SeenBy>({
    version: '1.0.0',
    migrations: [m1, m2],
    input: {
      foo: 'bar',
    },
  })

  plan.equal(res.version, '2.4.0')
  plan.deepEqual(res.result, {
    foo: 'bar',
    seenBy: '2.4.0',
  })
})

test('apply only needed', async t => {
  const plan = tspl(t, { plan: 3 })
  const m1: Migration<SeenBy> = {
    version: '2.0.0',
    async up(input) {
      plan.fail('should not be called')
      return {
        ...input,
        seenBy: '2.0.0',
      }
    },
  }

  const m2: Migration<SeenBy> = {
    version: '2.4.0',
    up(input) {
      plan.deepEqual(input, {
        foo: 'bar',
      })
      return {
        ...input,
        seenBy: '2.4.0',
      }
    },
  }

  const res = await semgrator<SeenBy, SeenBy>({
    version: '2.1.1',
    migrations: [m1, m2],
    input: {
      foo: 'bar',
    },
  })

  plan.equal(res.version, '2.4.0')
  plan.deepEqual(res.result, {
    foo: 'bar',
    seenBy: '2.4.0',
  })
})

test('apply no migrations', async t => {
  const plan = tspl(t, { plan: 2 })
  const m1: Migration<SeenBy> = {
    version: '2.0.0',
    async up(input) {
      plan.fail('should not be called')
      return {
        ...input,
        seenBy: '2.0.0',
      }
    },
  }

  const m2: Migration<SeenBy> = {
    version: '2.4.0',
    up(input) {
      plan.fail('should not be called')
      return {
        ...input,
        seenBy: '2.4.0',
      }
    },
  }

  const res = await semgrator<SeenBy, SeenBy>({
    version: '2.30.1',
    migrations: [m1, m2],
    input: {
      foo: 'bar',
    },
  })

  plan.equal(res.version, '2.30.1')
  plan.deepEqual(res.result, {
    foo: 'bar',
  })
})

test('toVersion', async t => {
  const plan = tspl(t, { plan: 3 })
  const m1: Migration<SeenBy> = {
    version: '2.0.0',
    async up(input) {
      return {
        ...input,
        seenBy: '2.0.0',
      }
    },
  }

  const m2: Migration<SeenBy> = {
    version: '2.4.0',
    toVersion: '2.10.0',
    up(input) {
      plan.deepEqual(input, {
        foo: 'bar',
        seenBy: '2.0.0',
      })
      return {
        ...input,
        seenBy: '2.4.0',
      }
    },
  }

  const res = await semgrator<SeenBy, SeenBy>({
    version: '1.0.0',
    migrations: [m1, m2],
    input: {
      foo: 'bar',
    },
  })

  plan.equal(res.version, '2.10.0')
  plan.deepEqual(res.result, {
    foo: 'bar',
    seenBy: '2.4.0',
  })
})

test('throws if path or migrations are missing', async t => {
  throws(
    () => {
      // @ts-expect-error
      semgrator({ version: '1.0.0' })
    },
    { message: 'Specify either path or migrations' },
  )
})

test('throws if version is missing', async t => {
  const m1: Migration<SeenBy> = {
    version: '2.0.0',
    async up(input) {
      return input
    },
  }

  const m2: Migration<SeenBy> = {
    version: '2.4.0',
    up(input) {
      return input
    },
  }
  throws(
    () => {
      // @ts-expect-error
      semgrator({ migrations: [m1, m2] })
    },
    {
      message:
        'Invalid version. Must be a string. Got type "undefined".',
    },
  )
})

import semver from 'semver'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { readdir } from 'node:fs/promises'

export type Migration<Input, Output = Input> = {
  version: string
  toVersion?: string
  up: (input: Input) => Promise<Output> | Output
}

interface BaseSemgratorParams<Input> {
  version: string
  input: Input
}

interface SemgratorParamsWithMigrations<Input, Output>
  extends BaseSemgratorParams<Input> {
  migrations:
    | Migration<Input, Output>[]
    | AsyncGenerator<Migration<Input, Output>>
}

interface SemgratorParamsWithPath<Input>
  extends BaseSemgratorParams<Input> {
  path: string
}

interface SemgratorResult<Output> {
  version: string
  changed: boolean
  result: Output
}

interface ThenableAsyncIterator<T> extends PromiseLike<T> {
  [Symbol.asyncIterator](): AsyncIterator<T, T>
}

async function processAll<Output>(
  iterator: AsyncGenerator<SemgratorResult<Output>>,
): Promise<SemgratorResult<Output>> {
  let lastResult: SemgratorResult<Output> | undefined
  do {
    const result = await iterator.next()
    if (result.done) {
      return result.value || lastResult
    }
    lastResult = result.value
  } while (true)
}

async function* loadMigrationsFromPath<Input, Output>(
  path: string,
): AsyncGenerator<Migration<Input, Output>> {
  const files = (await readdir(path)).filter(file =>
    file.match(/\.(c|m)?js$/),
  )

  const migrations = await Promise.all(
    files.map(async file => {
      const module = await import(
        pathToFileURL(join(path, file)).toString()
      )
      // Casted, there is nothing type safe here
      return module.migration as Migration<Input, Output>
    }),
  )

  migrations.sort((a, b) => semver.compare(a.version, b.version))

  for (const migration of migrations) {
    yield migration
  }
}

async function* processMigrations<Input, Output>(
  input: Input,
  migrations:
    | Migration<Input, Output>[]
    | AsyncGenerator<Migration<Input, Output>>,
  version: string,
): AsyncGenerator<SemgratorResult<Output>> {
  let result = input as unknown
  let lastVersion = version
  let changed = false

  for await (const migration of migrations) {
    if (semver.gt(migration.version, lastVersion)) {
      // @ts-expect-error
      result = await migration.up(result)
      lastVersion = migration.toVersion || migration.version
      changed = true
    }
    yield { version: lastVersion, result: result as Output, changed }
  }
}

function semgratorWithMigrations<Input, Output>(
  params: SemgratorParamsWithMigrations<Input, Output>,
): ThenableAsyncIterator<SemgratorResult<Output>> {
  const iterator = processMigrations(
    params.input,
    params.migrations,
    params.version,
  )

  let processing: Promise<SemgratorResult<Output>> | undefined

  return {
    [Symbol.asyncIterator]() {
      return iterator
    },
    then(onFulfilled, onRejected) {
      if (!processing) {
        processing = processAll(iterator)
      }
      return processing.then(onFulfilled, onRejected)
    },
  }
}

export function semgrator<Input = unknown, Output = unknown>(
  params:
    | SemgratorParamsWithPath<Input>
    | SemgratorParamsWithMigrations<Input, Output>,
): ThenableAsyncIterator<SemgratorResult<Output>> {
  if (typeof params.version !== 'string') {
    throw new Error(
      `Invalid version. Must be a string. Got type "${typeof params.version}".`,
    )
  }

  if ('path' in params) {
    return semgratorWithMigrations<Input, Output>({
      ...params,
      migrations: loadMigrationsFromPath<Input, Output>(params.path),
    })
  } else if ('migrations' in params) {
    return semgratorWithMigrations<Input, Output>(params)
  } else {
    throw new Error('Specify either path or migrations')
  }
}

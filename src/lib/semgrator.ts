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
  migrations: Migration<Input, Output>[]
}

interface SemgratorParamsWithPath<Input>
  extends BaseSemgratorParams<Input> {
  path: string
}

interface SemgratorResult<Output> {
  version: string
  result: Output
}

async function semgratorWithMigrations<Input, Output>(
  params: SemgratorParamsWithMigrations<Input, Output>,
): Promise<SemgratorResult<Output>> {
  let result = params.input as unknown
  let lastVersion = params.version
  for (const migration of params.migrations) {
    if (semver.gt(migration.version, lastVersion)) {
      // @ts-expect-error
      result = await migration.up(result)
      lastVersion = migration.toVersion || migration.version
    }
  }

  return { version: lastVersion, result: result as Output }
}

async function loadMigrationsFromPath<Input, Output>(
  path: string,
): Promise<Migration<Input, Output>[]> {
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

  return migrations
}

export async function semgrator<Input = unknown, Output = unknown>(
  params:
    | SemgratorParamsWithPath<Input>
    | SemgratorParamsWithMigrations<Input, Output>,
): Promise<SemgratorResult<Output>> {
  if ('path' in params) {
    const migrations = await loadMigrationsFromPath<Input, Output>(
      params.path,
    )
    return semgratorWithMigrations<Input, Output>({
      ...params,
      migrations,
    })
  } else if ('migrations' in params) {
    return semgratorWithMigrations<Input, Output>(params)
  } else {
    throw new Error('Specify either path or migrations')
  }
}

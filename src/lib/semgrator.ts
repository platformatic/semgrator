import semver from 'semver'

export type Migration<Input, Output = Input> = {
  version: string
  up: (input: Input) => Promise<Output> | Output
}

interface SemgratorParams<Input> {
  version: string
  migrations: Migration<any, any>[]
  input: Input
}

interface SemgratorResult<Output> {
  version: string
  result: Output
}

export async function semgrator<Input = unknown, Output = unknown>(
  params: SemgratorParams<Input>,
): Promise<SemgratorResult<Output>> {
  let result = params.input as unknown
  let lastVersion = params.version
  for (const migration of params.migrations) {
    if (semver.gt(migration.version, lastVersion)) {
      result = await migration.up(result)
      lastVersion = migration.version
    }
  }

  return { version: lastVersion, result: result as Output }
}

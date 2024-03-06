# semgrator

`semgrator` provides an utility to support backward compatibility when building frameworks and runtimes
that do not introduce breaking changes via new options.

## What is a compatibility option/flag/mode?

If you want to create a product that is configurable, but you do not want to break your users on behavior changes,
you can introduce a _new option_ that turns on and off the new behavior, and turn the new behavior by default.
Users of the previous behavior _would be required_ to change their configuration to keep using the software.

### How semgrator helps

`semgrator` run migrations code based on semantic version rules. So on a breaking/behavior change that results in a new
compatibility option in your configuration file, you can add a new migration rule that set the new option to `false`
automatically.

## Install

```js
npm i semgrator
```

## Usage

### Writing migrations

```ts
import type { Migration } from 'semgrator'
import type { Config } from '../your-config-meta.js'

export const migration: Migration<Config> = {
  version: '1.0.0',
  toVersion: '1.42.0',
  up: (input: Config) => {
    // Do something with Config
    return input
  },
}
```

The `version` peroperty specifies the _minimum version_ that do not need the change.
In other terms, all versions _before_ the specified one will trigger the migration.

The `toVersion` property will be used by `semgrator` as the resulting version after the change.
This is useful in case you want to have a _final_ version that is higher than `version`.

### Running semgrator

```ts
import { semgrator } from 'semgrator'

type MyConfig = {
  result: unknown
}

const res = await semgrator<MyConfig, MyConfig>({
  version: '1.0.0',
  path: 'path/to/migrations',
  input: {
    result: { foo: 'bar' } as unknown,
  },
})

console.log(res.result)
```

### Getting intermediate results

```ts
import { semgrator } from 'semgrator'

type MyConfig = {
  result: unknown
}

const iterator = semgrator<MyConfig, MyConfig>({
  version: '1.0.0',
  path: 'path/to/migrations',
  input: {
    result: { foo: 'bar' } as unknown,
  },
})

for await (const res of iterator) {
  console.log(res.version, res.result)
}
```

## License

Apache-2.0

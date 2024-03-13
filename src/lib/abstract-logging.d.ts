declare module 'abstract-logging' {
  interface LogFn {
    // TODO: why is this different from `obj: object` or `obj: any`?
    /* tslint:disable:no-unnecessary-generics */
    <T extends object>(obj: T, msg?: string, ...args: any[]): void
    (obj: unknown, msg?: string, ...args: any[]): void
    (msg: string, ...args: any[]): void
  }

  export interface AbstractLogger {
    error: LogFn
    warn: LogFn
    info: LogFn
    debug: LogFn
    trace: LogFn
  }

  export default abstractLogger
}

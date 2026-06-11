import { KMIXDefaults, type KmixOptions } from './defaults.js'

const BANK_NAMES = ['bank_1', 'bank_2', 'bank_3', 'mode'] as const

export type UserControlValue =
  | Partial<{ bank_1: number; bank_2: number; bank_3: number; mode: string; type: number[] }>
  | Array<number | string>

export interface UserOptions {
  'midi-channels'?: number[]
  [control: string]: UserControlValue | number[] | undefined
}

/** Map a positional `[v1, v2, v3, mode?]` array to `{ bank_1, bank_2, bank_3, mode? }`. */
export function arraysToObject(values: Array<number | string>): Record<string, number | string> {
  const out: Record<string, number | string> = {}
  BANK_NAMES.forEach((name, i) => {
    const v = values[i]
    if (v !== undefined) out[name] = v
  })
  return out
}

/** Convert terse array-form control values to object form. midi-channels and object values pass through. */
export function convertOptions(user: UserOptions): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(user)) {
    const value = user[key]
    if (key === 'midi-channels' || !Array.isArray(value)) {
      out[key] = value
    } else {
      out[key] = arraysToObject(value as Array<number | string>)
    }
  }
  return out
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Deep-merge `source` over a clone of `target`. Arrays are replaced wholesale; `undefined` is skipped. */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>,
): T {
  const out: Record<string, unknown> = { ...target }
  for (const key of Object.keys(source)) {
    const sv = source[key]
    if (sv === undefined) continue
    const tv = out[key]
    out[key] = isPlainObject(sv) && isPlainObject(tv) ? deepMerge(tv, sv) : sv
  }
  return out as T
}

/** Convert + merge user options over the pristine defaults. Never mutates KMIXDefaults. */
export function mergeOptions(user: UserOptions = {}): KmixOptions {
  const converted = convertOptions(user)
  return deepMerge(
    KMIXDefaults as unknown as Record<string, unknown>,
    converted,
  ) as unknown as KmixOptions
}

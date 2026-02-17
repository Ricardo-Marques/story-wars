import { useEffect } from 'react'
import { reaction, autorun, when, comparer } from 'mobx'

export { useLocalObservable } from 'mobx-react-lite'

/**
 * MobX `reaction` with auto-dispose on unmount.
 * The effect can optionally return a cleanup function (like useEffect).
 * MobX tracks dependencies in `expression` automatically — no dependency arrays.
 * Uses structural comparison by default so object returns work correctly.
 */
export function useReaction<T>(
  expression: () => T,
  effect: (value: T, prev: T | undefined) => void | (() => void),
  opts?: { fireImmediately?: boolean },
) {
  useEffect(() => {
    let cleanup: void | (() => void)
    const dispose = reaction(
      expression,
      (value, prev) => {
        if (typeof cleanup === 'function') cleanup()
        cleanup = effect(value, prev)
      },
      { ...opts, equals: comparer.structural },
    )
    return () => {
      if (typeof cleanup === 'function') cleanup()
      dispose()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * MobX `autorun` with auto-dispose on unmount.
 * Re-runs whenever any accessed observable changes.
 */
export function useAutorun(effect: () => void) {
  useEffect(() => autorun(effect), []) // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * MobX `when` with auto-dispose on unmount.
 * Fires `effect` once when `predicate` becomes true.
 */
export function useWhen(predicate: () => boolean, effect: () => void) {
  useEffect(() => when(predicate, effect), []) // eslint-disable-line react-hooks/exhaustive-deps
}

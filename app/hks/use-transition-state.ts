import { useCallback, useRef, useState } from 'react'

const PRE_ENTER = 0
const ENTERING = 1
const ENTERED = 2
const PRE_EXIT = 3
const EXITING = 4
const EXITED = 5
const UNMOUNTED = 6

const STATUS = [
  'preEnter',
  'entering',
  'entered',
  'preExit',
  'exiting',
  'exited',
  'unmounted',
] as const

const getState = (status: number) => ({
  _s: status,
  status: STATUS[status],
  isEnter: status < PRE_EXIT,
  isMounted: status !== UNMOUNTED,
  isResolved: status === ENTERED || status > EXITING,
})

type StateType = ReturnType<typeof getState>

const startOrEnd = (unmounted?: boolean) => (unmounted ? UNMOUNTED : EXITED)

const getEndStatus = (status: number, unmountOnExit?: boolean) => {
  switch (status) {
    case ENTERING:
    case PRE_ENTER:
      return ENTERED

    case EXITING:
    case PRE_EXIT:
      return startOrEnd(unmountOnExit)
  }
}

const getTimeout = (timeout?: number | { enter: number; exit: number }) =>
  typeof timeout === 'object'
    ? [timeout.enter, timeout.exit]
    : [timeout ?? 0, timeout ?? 0]

const nextTick = (transitState: (status: number) => void, status: number) =>
  setTimeout(() => {
    // Reading document.body.offsetTop can force a repaint before transition to the next state
    Number.isNaN(document.body.offsetTop) || transitState(status + 1)
  }, 0)

const updateState = (
  status: number,
  setState: (state: StateType) => void,
  latestStateRef: { current?: StateType },
  timeoutIdRef: { current?: NodeJS.Timeout },
  onChange: (state: { current: StateType }) => void = () => {},
) => {
  clearTimeout(timeoutIdRef.current)
  const state = getState(status)
  setState(state)
  latestStateRef.current = state
  onChange?.({ current: state })
}

export const useTransitionState = ({
  enter = true,
  exit = true,
  preEnter,
  preExit,
  timeout,
  initialEntered,
  mountOnEnter = true,
  unmountOnExit = true,
  onStateChange: onChange,
}: {
  enter?: boolean
  exit?: boolean
  preEnter?: boolean
  preExit?: boolean
  timeout?: number | { enter: number; exit: number }
  initialEntered?: boolean
  mountOnEnter?: boolean
  unmountOnExit?: boolean
  onStateChange?: (state: {
    current: { status: string; isEnter: boolean }
  }) => void
}): [StateType, (toEnter: boolean) => void, () => void] => {
  const [state, setState] = useState(() =>
    getState(initialEntered ? ENTERED : startOrEnd(mountOnEnter)),
  )
  const latestState = useRef(state)
  const timeoutId = useRef<NodeJS.Timeout>(undefined)
  const [enterTimeout, exitTimeout] = getTimeout(timeout)

  const endTransition = useCallback(() => {
    const status = getEndStatus(latestState.current._s, unmountOnExit)
    status && updateState(status, setState, latestState, timeoutId, onChange)
  }, [onChange, unmountOnExit])

  const toggle = useCallback(
    (toEnter?: boolean) => {
      const transitState = (status: number) => {
        updateState(status, setState, latestState, timeoutId, onChange)

        switch (status) {
          case ENTERING:
            if (enterTimeout >= 0)
              timeoutId.current = setTimeout(endTransition, enterTimeout)
            break

          case EXITING:
            if (exitTimeout >= 0)
              timeoutId.current = setTimeout(endTransition, exitTimeout)
            break

          case PRE_ENTER:
          case PRE_EXIT:
            timeoutId.current = nextTick(transitState, status)
            break
        }
      }

      const enterStage = latestState.current.isEnter

      if (typeof toEnter !== 'boolean' ? !enterStage : toEnter) {
        !enterStage &&
          transitState(enter ? (preEnter ? PRE_ENTER : ENTERING) : ENTERED)
      } else {
        enterStage &&
          transitState(
            exit ? (preExit ? PRE_EXIT : EXITING) : startOrEnd(unmountOnExit),
          )
      }
    },
    [
      endTransition,
      onChange,
      enter,
      exit,
      preEnter,
      preExit,
      enterTimeout,
      exitTimeout,
      unmountOnExit,
    ],
  )

  return [state, toggle, endTransition]
}

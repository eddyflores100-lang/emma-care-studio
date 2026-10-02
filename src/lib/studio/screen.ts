interface ScreenLock { released: boolean; release(): Promise<void> }
interface ScreenNavigator { wakeLock?: { request(type: 'screen'): Promise<ScreenLock> } }
interface ScreenDocument {
  visibilityState: string
  addEventListener(type: string, listener: () => void): void
  removeEventListener(type: string, listener: () => void): void
}

/** Best effort: browsers/OS may refuse or revoke a screen lock (e.g. low battery). */
export function keepScreenAwake(nav: ScreenNavigator = navigator, doc: ScreenDocument = document) {
  let active = true
  let requesting = false
  let lock: ScreenLock | null = null
  const acquire = async () => {
    if (!active || requesting || !nav.wakeLock || doc.visibilityState !== 'visible' || (lock && !lock.released)) return
    requesting = true
    try {
      const result = await nav.wakeLock.request('screen')
      if (!active || doc.visibilityState !== 'visible') await result.release()
      else lock = result
    } catch { /* Unsupported policy, low battery or denied lock: the game still works. */ }
    finally { requesting = false }
  }
  const release = () => { const previous = lock; lock = null; void previous?.release().catch(() => {}) }
  const onVisibility = () => {
    if (doc.visibilityState === 'visible') void acquire()
    else release()
  }
  void acquire()
  doc.addEventListener('visibilitychange', onVisibility)
  return () => { active = false; doc.removeEventListener('visibilitychange', onVisibility); release() }
}


interface LandscapeDocument extends ScreenDocument { fullscreenElement: unknown }
interface LandscapeOrientation { lock?: (mode: 'landscape') => Promise<void> }

/** Mobile browsers can drop their orientation lock when the tab is hidden. */
export function maintainLandscape(
  doc: LandscapeDocument = document,
  orientation: LandscapeOrientation = screen.orientation as LandscapeOrientation,
) {
  const restore = () => {
    if (doc.visibilityState === 'visible' && doc.fullscreenElement) {
      void orientation?.lock?.('landscape').catch(() => {})
    }
  }
  restore()
  for (const event of ['visibilitychange', 'fullscreenchange']) doc.addEventListener(event, restore)
  return () => { for (const event of ['visibilitychange', 'fullscreenchange']) doc.removeEventListener(event, restore) }
}

/** Fullscreen requires a fresh tap after the browser or OS closes it. */
export async function enterLandscape() {
  try {
    if (!document.fullscreenElement && document.fullscreenEnabled) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    }
    await (screen.orientation as LandscapeOrientation)?.lock?.('landscape')
  } catch { /* The portrait recovery panel also explains manual rotation. */ }
}

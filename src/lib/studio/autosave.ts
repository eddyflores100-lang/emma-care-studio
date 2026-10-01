/** Save the latest snapshot at a bounded interval, even during continuous movement. */
export function createAutosave(save: () => void, delay = 1200) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const flush = () => {
    if (timer !== null) clearTimeout(timer)
    timer = null
    save()
  }
  return {
    schedule() {
      if (timer === null) timer = setTimeout(flush, delay)
    },
    flush,
    dispose() { if (timer !== null) clearTimeout(timer); timer = null },
  }
}

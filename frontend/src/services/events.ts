// Small event emitter for cross-component notifications (browser-native EventTarget)
const rankingEventTarget = new EventTarget();

export const emitRankingUpdated = () => {
  try {
    rankingEventTarget.dispatchEvent(new Event('ranking-updated'));
  } catch (e) {
    // swallow errors in environments without Event support
    // (should not happen in browsers)
    // eslint-disable-next-line no-console
    console.warn('emitRankingUpdated failed', e);
  }
};

export const addRankingUpdatedListener = (listener: (e: Event) => void) => {
  rankingEventTarget.addEventListener('ranking-updated', listener);
  return () => rankingEventTarget.removeEventListener('ranking-updated', listener);
};

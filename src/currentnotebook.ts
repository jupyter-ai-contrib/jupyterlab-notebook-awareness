/**
 * Which notebook the user is currently working in.
 *
 * Kept out of `index.ts` so it can be unit tested without booting a JupyterLab
 * shell: nothing here imports from `@jupyterlab/*`.
 */

/**
 * Field written to global awareness (not a notebook's own awareness) naming the
 * notebook JupyterLab's notebook tracker considers current: normally the most
 * recently focused notebook, or one just opened while no notebook had focus.
 * It survives focus moving to a chat, a terminal or the file browser, and is
 * `null` when no notebook is current.
 */
export const GLOBAL_NOTEBOOK_PATH_FIELD = 'notebookPath';

/**
 * Compute the next value of the global notebook path.
 *
 * Follows the tracker's current notebook; the tracker already keeps it when
 * focus moves to a non-notebook widget. `previous` is a defensive fallback for
 * a null current widget, which the tracker reports only after its current
 * notebook is disposed while none of the remaining ones has had focus. In
 * ordinary use `previous` is then the closed notebook's path, so the result is
 * the same as `current ?? null`. It is kept only while a panel with that path
 * is still open, so the field never names a notebook that has been closed.
 *
 * @param current - path of the tracker's current notebook, or null
 * @param openPaths - paths of every open notebook
 * @param previous - the value published last time
 */
export function nextGlobalNotebookPath(
  current: string | null,
  openPaths: readonly string[],
  previous: string | null
): string | null {
  if (current) {
    return current;
  }
  if (previous && openPaths.includes(previous)) {
    return previous;
  }
  return null;
}

/**
 * The part of a y-protocols `Awareness` the publisher writes to.
 */
export interface IAwarenessWriter {
  setLocalStateField(field: string, value: unknown): void;
}

/**
 * Build the function that publishes the current notebook to global awareness.
 *
 * `awareness` resolves to the global awareness, or to null when there is none;
 * calls made before it resolves do nothing, and it publishes once as soon as it
 * resolves. After that each call re-reads the tracker through `currentPath` and
 * `openPaths` and writes the field only when its value changes. The first write
 * always happens, `null` included, so the field is present whenever the
 * extension is running.
 */
export function createGlobalNotebookPublisher(
  awareness: Promise<IAwarenessWriter | null>,
  currentPath: () => string | null,
  openPaths: () => readonly string[]
): () => void {
  let target: IAwarenessWriter | null = null;
  // undefined: nothing written yet
  let published: string | null | undefined = undefined;
  const publish = () => {
    if (!target) {
      return;
    }
    const next = nextGlobalNotebookPath(
      currentPath(),
      openPaths(),
      published ?? null
    );
    if (next !== published) {
      published = next;
      target.setLocalStateField(GLOBAL_NOTEBOOK_PATH_FIELD, next);
    }
  };
  awareness
    .then(resolved => {
      target = resolved;
      publish();
    })
    .catch(() => undefined);
  return publish;
}

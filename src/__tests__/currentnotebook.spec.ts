import {
  createGlobalNotebookPublisher,
  GLOBAL_NOTEBOOK_PATH_FIELD,
  IAwarenessWriter,
  nextGlobalNotebookPath
} from '../currentnotebook';

describe('nextGlobalNotebookPath', () => {
  it('reports the notebook the tracker currently has', () => {
    expect(nextGlobalNotebookPath('a.ipynb', ['a.ipynb'], null)).toEqual(
      'a.ipynb'
    );
  });

  it('follows the user from one notebook to another', () => {
    expect(
      nextGlobalNotebookPath('b.ipynb', ['a.ipynb', 'b.ipynb'], 'a.ipynb')
    ).toEqual('b.ipynb');
  });

  // Defensive: the tracker is not expected to report no current notebook while
  // the previously published one is still open, but if it does, keep it.
  it('keeps the previous path while it is still open', () => {
    expect(nextGlobalNotebookPath(null, ['a.ipynb'], 'a.ipynb')).toEqual(
      'a.ipynb'
    );
  });

  // Closing the focused notebook while the others were never focused leaves
  // the tracker with no current widget; `previous` must not outlive its file.
  it('does not name a notebook that has been closed', () => {
    expect(nextGlobalNotebookPath(null, ['b.ipynb'], 'a.ipynb')).toBeNull();
  });

  it('clears once no notebook is open', () => {
    expect(nextGlobalNotebookPath(null, [], 'a.ipynb')).toBeNull();
  });

  it('reports nothing while notebooks are open but none was ever current', () => {
    expect(nextGlobalNotebookPath(null, ['a.ipynb'], null)).toBeNull();
  });
});

describe('createGlobalNotebookPublisher', () => {
  function recorder(): [IAwarenessWriter, [string, unknown][]] {
    const writes: [string, unknown][] = [];
    return [
      {
        setLocalStateField: (field: string, value: unknown) => {
          writes.push([field, value]);
        }
      },
      writes
    ];
  }

  // Let the publisher's `awareness.then` callback run.
  const settle = () => new Promise(resolve => setTimeout(resolve, 0));

  it('writes the field only when its value changes', async () => {
    let current: string | null = 'a.ipynb';
    let open = ['a.ipynb', 'b.ipynb'];
    const [awareness, writes] = recorder();
    const publish = createGlobalNotebookPublisher(
      Promise.resolve(awareness),
      () => current,
      () => open
    );
    await settle();
    expect(writes).toEqual([[GLOBAL_NOTEBOOK_PATH_FIELD, 'a.ipynb']]);

    // Focus moves to a chat: the tracker still reports a.ipynb, nothing to write.
    publish();
    publish();
    expect(writes).toHaveLength(1);

    // a.ipynb is closed and b.ipynb was never focused.
    current = null;
    open = ['b.ipynb'];
    publish();
    publish();
    expect(writes).toEqual([
      [GLOBAL_NOTEBOOK_PATH_FIELD, 'a.ipynb'],
      [GLOBAL_NOTEBOOK_PATH_FIELD, null]
    ]);
  });

  it('keeps the published path while the tracker has no current notebook', async () => {
    let current: string | null = 'a.ipynb';
    const [awareness, writes] = recorder();
    const publish = createGlobalNotebookPublisher(
      Promise.resolve(awareness),
      () => current,
      () => ['a.ipynb']
    );
    await settle();
    expect(writes).toEqual([[GLOBAL_NOTEBOOK_PATH_FIELD, 'a.ipynb']]);

    current = null;
    publish();
    expect(writes).toEqual([[GLOBAL_NOTEBOOK_PATH_FIELD, 'a.ipynb']]);
  });

  it('writes null on the first publish when no notebook is open', async () => {
    const [awareness, writes] = recorder();
    createGlobalNotebookPublisher(
      Promise.resolve(awareness),
      () => null,
      () => []
    );
    await settle();
    expect(writes).toEqual([[GLOBAL_NOTEBOOK_PATH_FIELD, null]]);
  });

  it('publishes once the global awareness arrives', async () => {
    let resolveAwareness: (value: IAwarenessWriter | null) => void = () => {
      // replaced below
    };
    const [awareness, writes] = recorder();
    const publish = createGlobalNotebookPublisher(
      new Promise(resolve => {
        resolveAwareness = resolve;
      }),
      () => 'a.ipynb',
      () => ['a.ipynb']
    );
    publish();
    expect(writes).toEqual([]);

    resolveAwareness(awareness);
    await settle();
    expect(writes).toEqual([[GLOBAL_NOTEBOOK_PATH_FIELD, 'a.ipynb']]);
  });

  it('does nothing without a global awareness', async () => {
    const publish = createGlobalNotebookPublisher(
      Promise.resolve(null),
      () => 'a.ipynb',
      () => ['a.ipynb']
    );
    await settle();
    expect(() => publish()).not.toThrow();
  });

  it('does nothing when the global awareness cannot be loaded', async () => {
    const publish = createGlobalNotebookPublisher(
      Promise.reject(new Error('no @jupyter/collaborative-drive')),
      () => 'a.ipynb',
      () => ['a.ipynb']
    );
    await settle();
    expect(() => publish()).not.toThrow();
  });
});

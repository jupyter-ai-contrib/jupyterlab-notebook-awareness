import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';
import {
  createGlobalNotebookPublisher,
  IAwarenessWriter
} from './currentnotebook';

/**
 * Command IDs for the extension.
 */
namespace CommandIDs {
  export const getCurrentNotebook = 'notebook-awareness:get-current-notebook';
  export const getCurrentCell = 'notebook-awareness:get-current-cell';
}

/**
 * Updates the awareness state for a notebook with current cell and path info
 */
function updateAwarenessState(
  notebook: NotebookPanel | null,
  activeCell?: Cell | null
): void {
  if (!notebook?.model?.sharedModel?.awareness) {
    return;
  }

  const awareness = notebook.model.sharedModel.awareness;
  const notebookPath = notebook.context?.path || null;
  const cellId =
    (activeCell || notebook.content?.activeCell)?.model?.sharedModel?.getId() ||
    null;

  // Set both fields atomically
  awareness.setLocalStateField('notebookPath', notebookPath);
  awareness.setLocalStateField('activeCellId', cellId);
}

/**
 * Resolve the global awareness, or null when there is none.
 *
 * `IGlobalAwareness` is provided by `@jupyter/collaboration-extension`. Its
 * token module, `@jupyter/collaborative-drive`, is shared from the host rather
 * than bundled here (see `sharedPackages` in package.json), so it is imported
 * lazily. On a host without the module the import rejects, and on one without
 * a provider the service resolves to null; either way the extension works as
 * before.
 */
function loadGlobalAwareness(
  app: JupyterFrontEnd
): Promise<IAwarenessWriter | null> {
  return import('@jupyter/collaborative-drive')
    .then(({ IGlobalAwareness }) =>
      app.resolveOptionalService(IGlobalAwareness)
    )
    .catch(reason => {
      console.debug(
        'jupyterlab-notebook-awareness: no global awareness',
        reason
      );
      return null;
    });
}

/**
 * Initialization data for the jupyterlab-notebook-awareness extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-notebook-awareness:plugin',
  description:
    "A JupyterLab extension that tracks a user's current notebook and cell.",
  requires: [INotebookTracker],
  autoStart: true,
  activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
    // Publish the current notebook to global awareness, when there is one.
    const publishCurrentNotebook = createGlobalNotebookPublisher(
      loadGlobalAwareness(app),
      () => notebookTracker.currentWidget?.context?.path || null,
      () => {
        const paths: string[] = [];
        notebookTracker.forEach(panel => {
          // A notebook being closed can still be in the tracker while its
          // handlers run; it must not count as open.
          if (!panel.isDisposed && panel.context?.path) {
            paths.push(panel.context.path);
          }
        });
        return paths;
      }
    );

    // Add commands for fetching current notebook and cell
    app.commands.addCommand(CommandIDs.getCurrentNotebook, {
      label: 'Get Current Notebook',
      execute: () => {
        const currentNotebook = notebookTracker.currentWidget;
        if (!currentNotebook) {
          return null;
        }

        return {
          path: currentNotebook.context?.path || null,
          title: currentNotebook.title.label,
          id: currentNotebook.id,
          model: {
            readOnly: currentNotebook.model?.readOnly,
            dirty: currentNotebook.model?.dirty
          },
          context: {
            path: currentNotebook.context?.path,
            contentsModel: currentNotebook.context?.contentsModel
          }
        };
      },
      describedBy: {
        args: {
          type: 'object',
          properties: {}
        }
      }
    });

    app.commands.addCommand(CommandIDs.getCurrentCell, {
      label: 'Get Current Cell',
      execute: () => {
        const currentNotebook = notebookTracker.currentWidget;
        if (!currentNotebook?.content?.activeCell) {
          return null;
        }

        const activeCell = currentNotebook.content.activeCell;
        const activeCellIndex = currentNotebook.content.activeCellIndex;

        return {
          id: activeCell.model?.sharedModel?.getId() || null,
          index: activeCellIndex,
          type: activeCell.model?.type,
          source: activeCell.model?.sharedModel?.getSource(),
          notebook: {
            path: currentNotebook.context?.path || null,
            title: currentNotebook.title.label
          }
        };
      },
      describedBy: {
        args: {
          type: 'object',
          properties: {}
        }
      }
    });

    // Handle when the active cell changes within a notebook
    notebookTracker.activeCellChanged.connect(
      (tracker: INotebookTracker, cell: Cell | null) => {
        updateAwarenessState(tracker.currentWidget, cell);
        publishCurrentNotebook();
      }
    );

    // Handle when the current notebook changes (switching between notebooks)
    notebookTracker.currentChanged.connect(
      (tracker: INotebookTracker, notebook: NotebookPanel | null) => {
        if (notebook) {
          // Set initial state when notebook opens
          updateAwarenessState(notebook);

          // Also listen for when the notebook content is ready
          if (notebook.content) {
            // Set state again once content is fully loaded
            setTimeout(() => {
              updateAwarenessState(notebook);
            }, 100);
          }
        }
        publishCurrentNotebook();
      }
    );

    // Handle when a notebook widget is added (covers page refresh case)
    notebookTracker.widgetAdded.connect(
      (tracker: INotebookTracker, notebook: NotebookPanel) => {
        // Wait for the notebook to be fully ready
        notebook.revealed.then(() => {
          updateAwarenessState(notebook);
        });

        // Also set state when the context is ready
        notebook.context.ready.then(() => {
          updateAwarenessState(notebook);
          publishCurrentNotebook();
        });

        // A rename changes the path without a cell or current-widget change
        notebook.context.pathChanged.connect(() => {
          updateAwarenessState(notebook);
          publishCurrentNotebook();
        }, notebook);
      }
    );

    // Set initial state for any already open notebooks
    if (notebookTracker.currentWidget) {
      updateAwarenessState(notebookTracker.currentWidget);
    }
    publishCurrentNotebook();
  }
};

export default plugin;

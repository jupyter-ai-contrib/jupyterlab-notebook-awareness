import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
/**
 * Initialization data for the jupyterlab-notebook-awareness extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-notebook-awareness:plugin',
  description: 'A JupyterLab extension that tracks a user\'s current notebook and cell.',
  requires: [INotebookTracker],
  autoStart: true,
  activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
    console.log('JupyterLab extension jupyterlab-notebook-awareness is activated!');
    
    notebookTracker.activeCellChanged.connect((notebook) => {
      const cellId = notebook.activeCell?.model.sharedModel.getId();
      notebook.currentWidget?.model?.sharedModel.awareness.setLocalStateField('activeCellId', cellId);
    })


    notebookTracker.currentChanged.connect((notebook) => {
      const nbPath = notebook.currentWidget?.context.path;
      notebook.currentWidget?.model?.sharedModel.awareness.setLocalStateField('notebookPath', nbPath);
    })
  }
};

export default plugin;

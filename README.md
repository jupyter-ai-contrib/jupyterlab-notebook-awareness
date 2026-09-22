# jupyterlab_notebook_awareness

[![Github Actions Status](https://github.com/jupyter-ai-contrib/jupyterlab-notebook-awareness/workflows/Build/badge.svg)](https://github.com/jupyter-ai-contrib/jupyterlab-notebook-awareness/actions/workflows/build.yml)

A JupyterLab extension that tracks a user's current notebook and cell.

## Usage

A JupyterLab frontend extension that tracks user awareness by adding `activeCellId` and `notebookPath` to each client's collaborative awareness state, and, when a global awareness is available, `notebookPath` to the global awareness state (see [Global Awareness](#global-awareness)). This enables applications to know which notebook and cell each user is currently viewing.

### Awareness State Schema

The extension adds the following fields to each client's awareness state:

- **`activeCellId`** (string | null): The unique ID of the currently active cell the user is viewing
- **`notebookPath`** (string | null): The file path of the notebook the user has open

### Example Awareness Structure

Here is an example of the complete awareness structure in JSON with multiple users:

```json
{
  "4233401820": {
    "user": {
      "username": "960fe034b7b847dfbee15eede12caac7",
      "name": "Anonymous Kale",
      "display_name": "Anonymous Kale",
      "initials": "AK",
      "avatar_url": null,
      "color": "var(--jp-collaborator-color5)"
    },
    "activeCellId": "42768507-1132-43fb-86ba-980a4e73e490",
    "notebookPath": "data_analysis.ipynb",
    "cursors": [
      {
        "anchor": {
          "type": {
            "client": 2431406065,
            "clock": 6
          },
          "tname": null,
          "item": null,
          "assoc": 0
        },
        "head": {
          "type": {
            "client": 2431406065,
            "clock": 6
          },
          "tname": null,
          "item": null,
          "assoc": 0
        },
        "primary": true,
        "empty": true
      }
    ]
  },
  "1582940372": {
    "user": {
      "username": "alice_researcher",
      "name": "Alice Smith",
      "display_name": "Alice Smith",
      "initials": "AS",
      "avatar_url": "https://example.com/avatar.jpg",
      "color": "var(--jp-collaborator-color2)"
    },
    "activeCellId": "b8f3e729-4891-4c2a-9876-543210fedcba",
    "notebookPath": "machine_learning.ipynb",
    "cursors": []
  }
}
```

### State Updates

The awareness state is automatically updated when:

- A user opens a notebook (sets `notebookPath`)
- A user clicks on a different cell (updates `activeCellId`)
- A user switches between notebooks (updates both fields)
- A user renames a notebook (updates `notebookPath`)
- A user refreshes the page (restores state when notebook loads)

### Global Awareness

When `@jupyter/collaboration-extension` provides a global awareness, the extension also writes one field to each client's **global** awareness state (the `IGlobalAwareness` token from `@jupyter/collaborative-drive`; the same state that carries the `user` and `current` fields). That frontend extension ships in the `jupyter-collaboration-ui` package, which jupyter-collaboration installs and which jupyter-server-documents also depends on.

- **`notebookPath`** (string | null): The notebook JupyterLab's notebook tracker considers current: normally the most recently focused notebook, or one opened while no notebook had focus. `null` when there is none.

How the field behaves:

- **Sticky:** jupyter-collaboration's `current` field follows the current main-area widget, so it changes when the user works in a terminal or in a chat opened in the main area. `notebookPath` keeps naming the notebook, so a consumer outside the notebook (a chat assistant, for example) can tell which notebook a client means.
- **Cleared:** it is `null` when no notebook is open. It can also be `null` while notebooks are still open: when the tracker's current notebook is closed and none of the remaining ones has ever had focus (for example, notebooks opened in the background while another notebook was active).
- **Per client:** the field is per browser tab. A user with two JupyterLab tabs open publishes two values, and a consumer has to choose between them (for example, the client it is talking to).
- **Paths:** with jupyter-collaboration 3.x the path carries the `RTC:` drive prefix, as the notebook's own path does there.

Without a global awareness the field is not written and the extension behaves as described above.

The global field is updated when:

- A user opens, switches to or renames a notebook (same as above)
- A user moves focus to a non-notebook widget such as a chat or a terminal (the field is kept)
- A user closes their last open notebook (the field clears)

```typescript
// From a plugin that lists IGlobalAwareness among its requires or optional
for (const [clientId, state] of globalAwareness.getStates()) {
  console.log(clientId, state.user?.name, state.notebookPath);
}
```

### Accessing Awareness Data

You can access the awareness data programmatically in JupyterLab:

```typescript
// Get the current notebook's awareness
const notebook = notebookTracker.currentWidget;
const awareness = notebook?.model?.sharedModel?.awareness;

// Get all awareness states
const allStates = awareness?.getStates();

// Get local user's state
const localState = awareness?.getLocalState();
```

## Requirements

- JupyterLab >= 4.0.0
- Optional: `@jupyter/collaboration-extension` (from jupyter-collaboration >= 3.0 or jupyter-collaboration-ui >= 1.0), for the global `notebookPath` field. Without it the field is not written.

## Install

To install the extension, execute:

```bash
pip install jupyterlab_notebook_awareness
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab_notebook_awareness
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab_notebook_awareness directory
# Install package in development mode
pip install -e "."
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall jupyterlab_notebook_awareness
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyterlab-notebook-awareness` within that folder.

### Testing the extension

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)

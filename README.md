# jupyterlab_notebook_awareness

[![Github Actions Status](https://github.com/jupyter-ai-contrib/jupyterlab-notebook-awareness/workflows/Build/badge.svg)](https://github.com/jupyter-ai-contrib/jupyterlab-notebook-awareness/actions/workflows/build.yml)

A JupyterLab extension that tracks a user's current notebook and cell.

## Usage

A JupyterLab frontend extension that tracks user awareness by adding `activeCellId` and `notebookPath` to each client's collaborative awareness state. This enables applications to know which notebook and cell each user is currently viewing.

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
- A user refreshes the page (restores state when notebook loads)

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

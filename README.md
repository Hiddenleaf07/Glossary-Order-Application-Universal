Hi everyone!
I recently launched Glossary-Order-Application-Universal-for-kitchen, a tool designed to solve digital order and tracking records.
After working on it for weeks, I decided to open up the codebase to the community. It follows a source-available / dual-license model so you can audit, self-host, and contribute to the code freely.

## Application structure

- `Grocery_Requisition_App.html` contains the UI.
- `js/data.js` contains the default catalog and units.
- `js/app.js` contains UI behavior and requisition workflows.
- `js/storage.js` provides resilient local persistence and state snapshots.
- `js/image-search.js` provides cached Google Custom Search image selection with a generated fallback.
- `js/github-sync.js` commits configured admin state changes through the GitHub Contents API.

## Admin integrations

Open **Settings** in the application to configure:

1. A Google Custom Search API key and image-search engine ID. Search results are cached locally and are not requested again for the same product query.
2. A fine-grained GitHub token with repository contents write access, repository owner/name, branch, and a JSON data-file path. Catalog, cart, history, unit, and company changes are persisted locally first and then synchronized to that file.

The GitHub Pages workflow deploys every push to `main`, so a successful configured synchronization is deployed automatically by GitHub Pages.

Copyright: hiddenleaf07/GitHub.com

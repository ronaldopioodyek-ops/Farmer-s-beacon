# GitHub Pages deployment

This branch adds a GitHub Actions workflow that builds the Vite frontend and deploys the dist to GitHub Pages.

- Branch: gh-pages-deploy
- Workflow: .github/workflows/gh-pages.yml
- After merging to main and pushing this branch the workflow will publish the site to https://ronaldopioodyek-ops.github.io/Farmer-s-beacon/

Notes:
- This publishes frontend only. Backend endpoints will remain offline unless hosted elsewhere.

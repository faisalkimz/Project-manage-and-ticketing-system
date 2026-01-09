# Cleanup Summary — Omni-PMS

## Actions performed
- Consolidated all top-level project docs into `docs/CONSOLIDATED.md`.
- Moved originals to `docs/archive/` for safe reference: `SPECIFICATION.md`, `FEATURES_*.md`, `ADVANCED_FEATURES.md`, `IMPLEMENTATION_COMPLETE.md`, `INTEGRATION_AND_QA.md`, `.agent/ARCHITECTURE.md`, and `.agent/workflows/*`.
- Shortened top-level `README.md` to point to `docs/CONSOLIDATED.md`.
- Added repository `.gitignore` with common ignores (Python, node, dist, db files, secrets, etc.).
- Removed committed Python bytecode files (`__pycache__` / `.pyc`) from git and rely on `.gitignore` to prevent re-adding.
- Removed an insecure plaintext credential file: `backend/scripts/login_admin.json` and replaced it with `backend/scripts/login_admin.example.json` (which contains placeholder content). The real credential file is removed from the repo and added to `.gitignore`.
- Removed empty `.agent/` folder (contents archived).
- Built the frontend (`npm run build`) to ensure recent changes didn't break the build.

## Suggested next steps (need your confirmation)
1. Remove or archive local DB file `backend/db.sqlite3` (it is untracked but present locally). Do you want it deleted or moved to `docs/archive/local-dbs/`?  
2. Decide if `backend/venv/` or any local virtualenvs should be removed from repository (if present under repo) — currently not tracked.  
3. Run a global linter (flake8/eslint) and fix outstanding issues.  
4. Consider scrubbing secrets from git history if needed (we removed one secret from HEAD; full history scrub requires BFG or git filter-repo).  
5. Review seed scripts and decide which are needed; we can move obsolete scripts to `scripts/archive/`.

If you confirm any of the suggested deletions, I can apply them and open a PR with the full list of changes. If you want me to also scrub the sensitive file from the Git history, I can prepare that workflow (requires a force-push and coordination).

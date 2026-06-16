# Prelegal backend

FastAPI service that forms the V1 technical foundation. It owns the (ephemeral)
SQLite database and serves the statically exported frontend so the whole product
runs from one container on http://localhost:8000.

## Layout

```
backend/
  app/
    config.py   # env-driven paths (DB file, static dir)
    db.py       # SQLite: recreated from scratch on every startup + users table
    main.py     # FastAPI app: /api/health + static frontend mount
  tests/        # pytest suite
```

## Develop (uv)

```bash
uv sync                       # install deps (incl. dev group)
uv run uvicorn app.main:app --reload --port 8000
uv run pytest                 # run the test suite
```

The database (`prelegal.db` by default) is **dropped and recreated on every
startup**, so it is disposable and never committed.

### Environment variables

| Variable              | Default              | Purpose                                    |
| --------------------- | -------------------- | ------------------------------------------ |
| `PRELEGAL_DB_PATH`    | `backend/prelegal.db`| SQLite file location.                      |
| `PRELEGAL_STATIC_DIR` | `backend/static`     | Exported frontend (`out/`) to serve.       |

## Notes

V1 ships with a **fake, frontend-only login** (no authentication). The `users`
table is created as scaffolding so real registration/login can be added later
without a schema migration; no endpoint reads or writes it yet.

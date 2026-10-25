# pi-spinners

Pi extension that replaces the boring `Working` row with Claude Code style spinner verbs:
`Baking…`, `Cogitating…`, `Percolating…`.

Each time Pi starts working it picks a verb from `extensions/spinners.txt`, then rotates to a
new one every 2, 3 or 5 seconds (the schedule Claude Code's VS Code extension uses) until the
run settles.

## Install

```bash
pi install /path/to/pi-spinners        # global, written to ~/.pi/agent/settings.json
pi install git:github.com/<you>/pi-spinners
pi -e /path/to/pi-spinners             # one-off try, no config change
```

Requires Pi 1.4.0 or newer (uses `ctx.ui.setWorkingMessage()`).

## Use

- Edit `extensions/spinners.txt` — one verb per line. Blank lines are ignored. An empty or
  missing file falls back to the default `Working`. Changes apply on the next session.
- `/spinners off` restores the default `Working` row; `/spinners on` turns verbs back on.
  The choice is persisted as `piSpinners.enabled` in `~/.pi/agent/settings.json`
  (`$PI_CODING_AGENT_DIR/settings.json` when that variable is set). On by default.
- `/spinners` without arguments reports the current state.

## Notes

- Only the working row text changes; the animated spinner frames stay Pi's own.
- The rotation timer runs from `agent_start` to `agent_settled`, so it does nothing while idle.
- Verb text is global to the session and appears in the working row only, never in the
  transcript.

## Develop

```bash
npm test     # node --test, type stripping; no build step
```

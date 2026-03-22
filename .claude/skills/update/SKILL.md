---
name: update
description: Fetch fresh Dota 2 stats from OpenDota API and rebuild the worker bundle. Use when stats need refreshing.
disable-model-invocation: true
---

Run the update script to fetch fresh data and rebuild:

```bash
./update-stats.sh
```

If the user passes `--deploy` as $ARGUMENTS, deploy too:

```bash
./update-stats.sh --deploy
```

If the user passes `--push` as $ARGUMENTS, commit+push+deploy:

```bash
./update-stats.sh --push
```

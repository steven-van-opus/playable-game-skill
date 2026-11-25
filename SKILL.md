---
name: playable-game-skill
description: Build or revise small offline HTML5 games as one portable index.html with Canvas 2D, keyboard and touch controls, and a sub-5 MB file budget.
---

# Make a single-file playable game

1. Pick one core action and write down how the player learns it, scores, loses or wins, and restarts. Keep the first few seconds forgiving. Use [the starter](template/index.html) for a lightweight Canvas 2D page or inspect [Mothlight](examples/mothlight/index.html) for an example with two types of falling objects.
2. Put the CSS, vanilla JavaScript, and artwork in one `index.html`. Draw shapes directly on the canvas or embed assets as data URLs. Use real HTML buttons for start and restart. Keep the starter's Content Security Policy so the page can run offline without making external requests.
3. Use the same game actions for keyboard and touch. If touch uses coordinates, map the pointer from the canvas's displayed bounds into its logical dimensions. Clamp elapsed time in the animation loop so a suspended tab does not fast-forward through gameplay. Make scoring, collision, and restart resettable without reloading.
4. Run `node scripts/verify.mjs path/to/index.html` from this skill's folder against your own code. It checks the byte budget and runs an inline Canvas smoke test using Node. Open the file in a browser as well. Play with keyboard and a touch viewport, restart, and check that the game runs offline without console errors.
5. Hand back the HTML, its controls, its file size and the checks you ran. If you could not run a browser check, say which part remains unverified.

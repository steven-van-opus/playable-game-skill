# Playable Game Skill

A small workflow for building games that run from a single offline HTML file. It includes a Canvas 2D starter, a no-dependency Node verifier, and Mothlight, an original lane-dodging game.

## Use it with a coding agent

Clone this repository and open the folder in Claude Code, Codex, or Cursor. Ask the agent to read `SKILL.md` and describe the game you want. For example:

> Read SKILL.md and build a tiny game about a moth collecting lanterns. Let me play it with arrow keys or by tapping a lane. Put the finished game in one index.html and verify it.

To start manually, copy `template/index.html` and edit the game loop, drawing code, and controls. Node.js is needed only for the verifier. The game itself needs a browser with Canvas 2D.

## Try it

Open [Mothlight](examples/mothlight/index.html) from a local copy in your browser. Guide the moth between three lanes with ← and →, keys 1 through 3, or a tap on a lane. Collect gold lanterns and avoid purple thorns.

```sh
node scripts/verify.mjs template/index.html
node scripts/verify.mjs examples/mothlight/index.html
```

The verifier checks for a file smaller than 5,000,000 bytes, an offline content policy, and several active Canvas frames. Run it on game code you trust. A browser playthrough still checks touch, timing, and game feel.

MIT licensed. Inspired by [Blyth Playable Kit](https://github.com/blyth-ai/playable-kit).

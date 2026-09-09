# Cursor Agents Window

Interactive frontend prototype of a redesigned Cursor Agents Window. There is no backend — sending a message runs a local mock that streams, shows tools, and changes with **mode**, **effort**, and **Fast**.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Try

- **Mode** — Agent / Plan / Ask / Debug. `Shift+Tab` cycles.
- **Model** — searchable picker with official marks. `⌘/` / `Ctrl+/`. The chip always shows logo + name.
- **Effort** — open the cube rail, drag ticks, or hold the cube to charge. `⌥↑` `⌥↓`.
- **Fast** — lightning toggle. `Ctrl+Shift+/`.
- Send in each mode, then **Stop**. Plan replies include **Build with Agent**.

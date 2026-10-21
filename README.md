# Educational Shorts

Portrait Remotion videos for teaching. Definitions are plain data. A shared timeline drives the Vite preview, Remotion Studio, and the export scripts.

## Requirements

Node.js 22 or 24. The `engines` field requires `>=22`.

The first render downloads Chrome Headless Shell into `node_modules` if it is not already there. Later renders reuse it.

## Setup

```console
npm install
```

## Preview

```console
npm run dev
```

The Vite app embeds a Remotion Player. It does not wrap that player in a Studio composition.

- The video menu lists every entry in `src/videos/registry.ts`.
- Workspace theme and video theme are separate. The page opens dark. Changing one leaves the other as it is. Video theme is the composition `inputProps` value, so light and dark do not need two compositions.
- The scene list seeks with `PlayerRef.seekTo`. End frames are exclusive.
- Size, frame rate, duration, the playhead frame, and the playhead time come from the same metadata helper Studio uses.
- Validation errors for the selected video are listed beside the player.
- Safe area draws the inset rectangle over the player. The composition only uses those insets as padding, so exports do not contain the guide. Defaults are 90 left, 180 right, 160 top, and 300 bottom.
- The portrait frame scales inside the viewport and keeps its aspect ratio.

```console
npm run studio
```

Studio registers one composition per registry id. Each composition renders the shared `Video` component. `calculateMetadata` calls the same helper as the preview.

## Checks

```console
npm run validate
npm run typecheck
npm run lint
npm test
```

`npm run validate` schema-checks every registry entry and names the video, scene, and field when something is wrong.

## Export

Output defaults to `out/`, which is gitignored. The scripts refuse to write under `src/`.

```console
npm run render -- --video=event-loop --theme=dark
npm run render -- --video=event-loop --theme=light
npm run still -- --video=event-loop --theme=dark --frame=450
```

Render bundles `src/index.ts`, selects that composition, and calls `renderMedia` with the same `{ theme }` input props as `selectComposition`. The file is H.264, `yuv420p`, muted, at the composition size and frame rate. The default path is `out/event-loop-dark.mp4`.

`npm run still` uses the same props and calls `renderStill`. The default path is `out/<id>-<theme>-<frame>.png`. Pass `--out=<file>` to choose another `.mp4` or `.png` outside `src/`.

## Authoring

Copy `src/videos/starter.ts`, change the id, and add the parsed video to `src/videos/registry.ts`. A new Short is that one registry entry.

Scenes are ordered data. Captions and beats use scene-local frames: inclusive start, exclusive end. `secondsToFrames` rounds once. The timeline builder is the only place that assigns global start frames.

`src/videos/event-loop.ts` is the browser event-loop film: hook, code walkthrough, diagram, and takeaway. Teaching claims and the MDN link live in `src/videos/event-loop.md`, not on screen.

## Themes

`defaultTheme` on a video is the Studio default and the preview's starting video theme. The workspace chrome has its own control and does not write `defaultTheme`.

## Custom scenes

A scene template is a type string, a Zod props schema, and a component, registered with `registerScene` in `src/templates/registry.ts`. Content stays plain data. A definition accepts a custom type only after that schema also joins the scene union in `src/engine/schema.ts`.

## Troubleshooting

- `npm run dev` or `npm run studio` fails immediately on Node 20 or older. Use Node 22 or 24.
- The first `npm run render` or `npm run still` can pause while Chrome Headless Shell downloads.
- `Refusing to write under src/` means the output path is inside this project's `src` directory. Write to `out/` instead.
- Unknown `--video` values list the registry ids. `--theme` is `light` or `dark`. Stills need `--frame` inside the video, from 0 through the last frame.

## License

Remotion's license terms depend on who is using it. Some companies need a paid license. Read the current terms at [remotion.dev/license](https://remotion.dev/license) before you ship a product on top of it.

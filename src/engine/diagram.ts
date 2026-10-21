import { containsFrame, intervalsAtFrame } from "./intervals";
import type { DiagramScene } from "./schema";

export type ResolvedDiagramItem = {
  id: string;
  label: string;
  emphasized: boolean;
  x: number;
  y: number;
};

export type ResolvedDiagramNode = {
  id: string;
  label: string;
  emphasized: boolean;
  x: number;
  y: number;
  items: ResolvedDiagramItem[];
};

export type ResolvedDiagramConnector = {
  id: string;
  from: string;
  to: string;
  label: string | null;
  emphasized: boolean;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

export type ResolvedDiagram = {
  frame: number;
  nodes: ResolvedDiagramNode[];
  connectors: ResolvedDiagramConnector[];
};

const COLUMN_X = 0.5;
const FIRST_NODE_Y = 0.2;
const LAST_NODE_Y = 0.8;

function nodeY(index: number, count: number): number {
  if (count <= 1) {
    return (FIRST_NODE_Y + LAST_NODE_Y) / 2;
  }
  const span = LAST_NODE_Y - FIRST_NODE_Y;
  return FIRST_NODE_Y + (span * index) / (count - 1);
}

/**
 * Logical diagram state at one scene-local frame.
 * Node order in the definition is top to bottom. An item's position is the
 * position of the node that contains it at this frame.
 */
export function resolveDiagramState(
  scene: DiagramScene,
  frame: number,
): ResolvedDiagram {
  if (
    !Number.isInteger(frame) ||
    frame < 0 ||
    frame >= scene.durationInFrames
  ) {
    throw new RangeError(
      `Frame ${String(frame)} is outside scene "${scene.id}" (0 inclusive, ${String(scene.durationInFrames)} exclusive)`,
    );
  }

  const emphasized = new Set<string>();
  const activeEmphasis = intervalsAtFrame(scene.emphasis, frame);
  for (const beat of activeEmphasis) {
    for (const target of beat.targets) {
      emphasized.add(target);
    }
  }

  const nodes: ResolvedDiagramNode[] = [];
  const nodeCenters = new Map<string, { x: number; y: number }>();

  for (let index = 0; index < scene.nodes.length; index++) {
    const node = scene.nodes[index];
    if (!node) {
      continue;
    }
    const x = COLUMN_X;
    const y = nodeY(index, scene.nodes.length);
    nodeCenters.set(node.id, { x, y });

    const items: ResolvedDiagramItem[] = [];
    for (const item of node.items) {
      if (!containsFrame(item, frame)) {
        continue;
      }
      items.push({
        id: item.id,
        label: item.label,
        emphasized: emphasized.has(item.id),
        x,
        y,
      });
    }

    nodes.push({
      id: node.id,
      label: node.label,
      emphasized: emphasized.has(node.id),
      x,
      y,
      items,
    });
  }

  const connectors: ResolvedDiagramConnector[] = [];
  for (const connector of scene.connectors) {
    const from = nodeCenters.get(connector.from);
    const to = nodeCenters.get(connector.to);
    if (!from || !to) {
      const missing = from ? connector.to : connector.from;
      throw new Error(
        `Diagram connector "${connector.id}" references unknown node "${missing}"`,
      );
    }
    connectors.push({
      id: connector.id,
      from: connector.from,
      to: connector.to,
      label: connector.label ?? null,
      emphasized: emphasized.has(connector.id),
      fromX: from.x,
      fromY: from.y,
      toX: to.x,
      toY: to.y,
    });
  }

  return { frame, nodes, connectors };
}

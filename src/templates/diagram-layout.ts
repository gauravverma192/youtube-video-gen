export const diagramMetrics = {
  cardWidthRatio: 0.86,
  paddingX: 28,
  paddingY: 22,
  labelSize: 44,
  labelLine: 1.2,
  itemRow: 76,
  itemGap: 12,
  headerGap: 16,
  minCardHeight: 156,
  maxCardHeight: 360,
} as const;

export type CenteredBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Point = {
  x: number;
  y: number;
};

export type Segment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type ArrowParts = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  head: string;
};

type PlacedNode = {
  id: string;
  x: number;
  y: number;
  itemCount: number;
};

function spacingLimit(
  nodes: readonly { y: number }[],
  canvasHeight: number,
): number {
  if (nodes.length <= 1) {
    return Math.floor(canvasHeight * 0.72);
  }
  const centers = nodes
    .map((node) => node.y * canvasHeight)
    .sort((left, right) => left - right);
  let minGap = Number.POSITIVE_INFINITY;
  for (let index = 1; index < centers.length; index++) {
    const gap = (centers[index] ?? 0) - (centers[index - 1] ?? 0);
    if (gap < minGap) {
      minGap = gap;
    }
  }
  return Math.floor(minGap * 0.72);
}

export function cardHeightForItems(itemCount: number, limit: number): number {
  const rows = Math.max(itemCount, 1);
  const labelBlock = Math.ceil(
    diagramMetrics.labelSize * diagramMetrics.labelLine,
  );
  const natural =
    diagramMetrics.paddingY * 2 +
    labelBlock +
    diagramMetrics.headerGap +
    rows * diagramMetrics.itemRow +
    Math.max(0, rows - 1) * diagramMetrics.itemGap;
  return Math.min(
    natural,
    diagramMetrics.maxCardHeight,
    Math.max(limit, diagramMetrics.minCardHeight),
  );
}

function containCenter(center: number, size: number, span: number): number {
  const half = size / 2;
  if (span <= size) {
    return span / 2;
  }
  return Math.min(span - half, Math.max(half, center));
}

export function nodeBoxes(
  nodes: readonly PlacedNode[],
  canvas: { width: number; height: number },
): CenteredBox[] {
  const width = Math.round(canvas.width * diagramMetrics.cardWidthRatio);
  const limit = spacingLimit(nodes, canvas.height);
  return nodes.map((node) => {
    const height = cardHeightForItems(node.itemCount, limit);
    return {
      id: node.id,
      x: containCenter(node.x * canvas.width, width, canvas.width),
      y: containCenter(node.y * canvas.height, height, canvas.height),
      width,
      height,
    };
  });
}

function borderPoint(
  origin: Point,
  toward: Point,
  halfWidth: number,
  halfHeight: number,
): Point {
  const dx = toward.x - origin.x;
  const dy = toward.y - origin.y;
  if (dx === 0 && dy === 0) {
    return { x: origin.x, y: origin.y - halfHeight };
  }
  const scaleX = dx === 0 ? Number.POSITIVE_INFINITY : halfWidth / Math.abs(dx);
  const scaleY =
    dy === 0 ? Number.POSITIVE_INFINITY : halfHeight / Math.abs(dy);
  const scale = Math.min(scaleX, scaleY);
  return { x: origin.x + dx * scale, y: origin.y + dy * scale };
}

/** Line from the source box edge to the target box edge, in that direction. */
export function connectorSegment(from: CenteredBox, to: CenteredBox): Segment {
  const source = { x: from.x, y: from.y };
  const target = { x: to.x, y: to.y };
  const start = borderPoint(source, target, from.width / 2, from.height / 2);
  const end = borderPoint(target, source, to.width / 2, to.height / 2);
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}

/** Shaft stops at the base of the arrowhead. The tip is the segment end. */
export function arrowParts(segment: Segment, headLength: number): ArrowParts {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  const distance = Math.hypot(dx, dy) || 1;
  const length = Math.min(headLength, distance * 0.45);
  const ux = dx / distance;
  const uy = dy / distance;
  const baseX = segment.x2 - ux * length;
  const baseY = segment.y2 - uy * length;
  const px = -uy;
  const py = ux;
  const half = length * 0.48;
  const head = [
    `${segment.x2},${segment.y2}`,
    `${baseX + px * half},${baseY + py * half}`,
    `${baseX - px * half},${baseY - py * half}`,
  ].join(" ");
  return { x1: segment.x1, y1: segment.y1, x2: baseX, y2: baseY, head };
}

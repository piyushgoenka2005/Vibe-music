import {
  GP9_SPINNER,
  GALLERY_SPINNER_FALLBACK,
  ROLAND_GP9,
} from "./gp9-assets";

export type SpinnerMode = "roland" | "gallery";

export type SpinnerConfig = {
  mode: SpinnerMode;
  frames: string[];
  fixFrames: readonly number[];
};

function padProductSpinner(value: number) {
  return (GP9_SPINNER.productSpinner.startPad + value).toString().slice(1);
}

function padParallax(index: number) {
  return (GP9_SPINNER.parallax.padStart + index).toString().slice(1);
}

export function buildProductSpinnerFrames(prefix: string): string[] {
  const { length, step } = GP9_SPINNER.productSpinner;
  const frames: string[] = [];
  for (let f = length; f >= 0; f -= step) {
    frames.push(`${prefix}${padProductSpinner(f)}.jpg`);
  }
  return frames;
}

export function buildParallaxFrames(path: string, suffix = ""): string[] {
  const { maxIndex, step, extension } = GP9_SPINNER.parallax;
  const frames: string[] = [];
  for (let i = 0; i < maxIndex; i += step) {
    frames.push(`${path}_${padParallax(i)}${suffix}.${extension}`);
  }
  return frames;
}

export function buildGalleryFrames(): string[] {
  return [...GALLERY_SPINNER_FALLBACK];
}

export function frameIndexFromProgress(progress: number, frameCount: number) {
  const clamped = Math.max(0, Math.min(1, progress));
  return Math.min(frameCount - 1, Math.round(clamped * (frameCount - 1)));
}

export function progressFromFrameIndex(index: number, frameCount: number) {
  if (frameCount <= 1) return 0;
  return index / (frameCount - 1);
}

export function nearestFixFrameIndex(progress: number) {
  const { fixFrames } = GP9_SPINNER;
  let nearest = 0;
  let minDist = Infinity;
  fixFrames.forEach((f, i) => {
    const d = Math.abs(f - progress);
    if (d < minDist) {
      minDist = d;
      nearest = i;
    }
  });
  return nearest;
}

export async function probeRolandSpinnerPrefix(): Promise<string | null> {
  const testIndices = [0, 2, 100];

  for (const prefix of GP9_SPINNER.candidatePrefixes) {
    const frames = buildProductSpinnerFrames(prefix);
    const ok = await Promise.all(
      testIndices.map(
        (i) =>
          new Promise<boolean>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = frames[Math.min(i, frames.length - 1)];
          })
      )
    );
    if (ok.every(Boolean)) return prefix;
  }

  const parallaxPath = `${ROLAND_GP9}/gp-9`;
  const parallaxFrames = buildParallaxFrames(parallaxPath);
  const parallaxOk = await new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = parallaxFrames[0];
  });
  if (parallaxOk) return `parallax:${parallaxPath}`;

  return null;
}

export async function resolveSpinnerConfig(): Promise<SpinnerConfig> {
  const prefix = await probeRolandSpinnerPrefix();

  if (prefix?.startsWith("parallax:")) {
    const path = prefix.replace("parallax:", "");
    return {
      mode: "roland",
      frames: buildParallaxFrames(path),
      fixFrames: GP9_SPINNER.fixFrames,
    };
  }

  if (prefix) {
    return {
      mode: "roland",
      frames: buildProductSpinnerFrames(prefix),
      fixFrames: GP9_SPINNER.fixFrames,
    };
  }

  return {
    mode: "gallery",
    frames: buildGalleryFrames(),
    fixFrames: GP9_SPINNER.fixFrames,
  };
}

export function preloadFrames(
  frames: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  let loaded = 0;
  const batchSize = 10;

  return new Promise((resolve) => {
    if (frames.length === 0) {
      resolve();
      return;
    }

    let index = 0;

    const loadNext = () => {
      const batch = frames.slice(index, index + batchSize);
      if (batch.length === 0) {
        resolve();
        return;
      }

      index += batchSize;
      let batchDone = 0;

      batch.forEach((src) => {
        const img = new Image();
        const done = () => {
          loaded += 1;
          onProgress?.(loaded, frames.length);
          batchDone += 1;
          if (batchDone === batch.length) {
            setTimeout(loadNext, 30);
          }
        };
        img.onload = done;
        img.onerror = done;
        img.src = src;
      });
    };

    loadNext();
  });
}

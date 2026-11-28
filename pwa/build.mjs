import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const artwork = [
  "assets/brush-paper.svg",
  "assets/desert-dua-hero-prayer-mat-1000.jpg",
  "assets/desert-dua-hero-prayer-mat-1672.jpg",
  "assets/desert-dua-hero-textured.jpg",
  "assets/dua-moments-dawn.jpg",
  "assets/dua-moments-rain.jpg",
  "assets/dua-moments-sunset.jpg",
  "assets/ijabah-logo.webp",
  "assets/night.webp",
  "assets/painted-canvas-v1.webp",
  "assets/sujood.webp",
  "assets/ummah-flags-painting.jpg",
];

export function offlineBuild() {
  let outputDirectory;
  return {
    name: "ijtaba-offline",
    apply: "build",
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir);
    },
    async writeBundle(_output, bundle) {
      const worker = await readFile(new URL("./worker.js", import.meta.url), "utf8");
      const profiles = await readdir(resolve(outputDirectory, "assets/dua-profiles"));
      const icons = await readdir(resolve(outputDirectory, "icons"));
      const paths = [...new Set([
        "index.html", "offline.html", "manifest.webmanifest",
        ...Object.keys(bundle).filter((file) => /\.(js|css)$/.test(file)),
        ...artwork,
        ...profiles.filter((name) => name.endsWith(".png")).map((name) => `assets/dua-profiles/${name}`),
        ...icons.filter((name) => name.endsWith(".png")).map((name) => `icons/${name}`),
      ])].sort();
      const hash = createHash("sha256").update(worker);
      const files = await Promise.all(paths.map((path) => readFile(resolve(outputDirectory, path))));
      paths.forEach((path, index) => hash.update(path).update("\0").update(files[index]));
      const version = hash.digest("hex").slice(0, 20);
      const source = `const CACHE_NAME = "ijtaba-static-${version}";\nconst PRECACHE = ${JSON.stringify(paths.map((path) => `/${path}`))};\n${worker}`;
      await writeFile(resolve(outputDirectory, "sw.js"), source);
    },
  };
}

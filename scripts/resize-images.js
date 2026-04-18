import sharp from "sharp";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, "../assets");

const variants = [
  { src: "Avatar_CTA.webp", width: 350, out: "Avatar_CTA-350w.webp" },
  { src: "Avatar_CTA.webp", width: 500, out: "Avatar_CTA-500w.webp" },
];

for (const { src, width, out } of variants) {
  const input = path.join(assetsDir, src);
  const output = path.join(assetsDir, out);
  await sharp(input).resize(width).webp({ quality: 82 }).toFile(output);
  console.log(`✓ ${out}`);
}

console.log("Done.");

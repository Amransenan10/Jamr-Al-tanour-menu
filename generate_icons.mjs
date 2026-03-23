import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const input = 'public/assets/logo.png';
const outputDir = 'public/assets';

async function generateIcons() {
  const sizes = [192, 512];
  for (const size of sizes) {
    const output = path.join(outputDir, `icon-${size}.png`);
    await sharp(input)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(output);
    console.log(`Generated ${output}`);
  }
}

generateIcons().catch(console.error);

import sharp from 'sharp';

const inputPath = 'C:\\Users\\Abdulwasea\\.gemini\\antigravity\\brain\\a1c814fd-88f1-4773-9f25-e21c14422f5e\\media__1785646601318.png';
const outputPath = 'c:\\Users\\Abdulwasea\\Desktop\\jamr altanuor\\public\\assets\\logo.png';
const logo192 = 'c:\\Users\\Abdulwasea\\Desktop\\jamr altanuor\\public\\assets\\icon-192.png';
const logo512 = 'c:\\Users\\Abdulwasea\\Desktop\\jamr altanuor\\public\\assets\\icon-512.png';

async function run() {
  console.log("Loading image...");
  const image = sharp(inputPath);
  const { width, height } = await image.metadata();
  console.log(`Image details: ${width}x${height}`);

  // Get raw pixel buffer with alpha channel
  const rawBuffer = await image.ensureAlpha().raw().toBuffer();

  const bgR = rawBuffer[0];
  const bgG = rawBuffer[1];
  const bgB = rawBuffer[2];
  console.log(`Detected background color at (0,0): R=${bgR}, G=${bgG}, B=${bgB}`);

  const threshold = 45;
  for (let i = 0; i < rawBuffer.length; i += 4) {
    const r = rawBuffer[i];
    const g = rawBuffer[i+1];
    const b = rawBuffer[i+2];
    const dist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
    if (dist < threshold) {
      rawBuffer[i+3] = 0; // Set transparent
    }
  }

  console.log("Processed transparency. Writing logo files...");
  // Reconstruct the image from the modified raw buffer and crop empty borders using .trim()
  const processedImage = sharp(rawBuffer, {
    raw: {
      width,
      height,
      channels: 4
    }
  }).trim();

  // Save the main logo
  await processedImage.clone().png().toFile(outputPath);
  console.log("Saved transparent logo.png");

  // Save resized versions for PWA icons
  await processedImage.clone().resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(logo192);
  console.log("Saved icon-192.png");

  await processedImage.clone().resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(logo512);
  console.log("Saved icon-512.png");

  console.log("All logo files converted successfully!");
}

run().catch(console.error);

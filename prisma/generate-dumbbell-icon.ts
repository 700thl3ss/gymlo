import sharp from "sharp";

// Minimalist angled Dumbbell icon with Gymlo colorway
// Background: #24201E (Signature dark espresso)
// Dumbbell: #EBD9B4 (Warm cream) with #976232 (warm bronze) accents

const dumbbellSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#24201E"/>
  <!-- Centered diagonal 45-deg minimalist dumbbell -->
  <g transform="translate(256, 256) rotate(-45) translate(-256, -256)">
    <!-- Center Handle Bar -->
    <rect x="210" y="242" width="92" height="28" rx="14" fill="#EBD9B4" />
    <rect x="230" y="248" width="52" height="16" rx="8" fill="#976232" />

    <!-- Left Collar -->
    <rect x="194" y="222" width="14" height="68" rx="7" fill="#976232" />
    <!-- Left Inner Heavy Plate -->
    <rect x="146" y="186" width="42" height="140" rx="18" fill="#EBD9B4" />
    <!-- Left Outer End Plate -->
    <rect x="114" y="206" width="26" height="100" rx="13" fill="#EBD9B4" />

    <!-- Right Collar -->
    <rect x="304" y="222" width="14" height="68" rx="7" fill="#976232" />
    <!-- Right Inner Heavy Plate -->
    <rect x="324" y="186" width="42" height="140" rx="18" fill="#EBD9B4" />
    <!-- Right Outer End Plate -->
    <rect x="372" y="206" width="26" height="100" rx="13" fill="#EBD9B4" />
  </g>
</svg>`;

async function main() {
  await sharp(Buffer.from(dumbbellSvg))
    .resize(512, 512)
    .png()
    .toFile("c:/magnolia/gymlo/public/apple-touch-icon.png");

  await sharp(Buffer.from(dumbbellSvg))
    .resize(192, 192)
    .png()
    .toFile("c:/magnolia/gymlo/public/icon-192.png");

  await sharp(Buffer.from(dumbbellSvg))
    .resize(512, 512)
    .png()
    .toFile("c:/magnolia/gymlo/public/icon-512.png");

  // Also save a preview in the brain folder
  await sharp(Buffer.from(dumbbellSvg))
    .resize(512, 512)
    .png()
    .toFile("C:/Users/haden/.gemini/antigravity/brain/a7f2dc75-31d5-43cc-84ea-296a639d615d/dumbbell_icon_preview.png");

  console.log("Successfully created minimalist dumbbell icons!");
}

main().catch(console.error);

import sharp from "sharp";
import path from "path";

function makeSvg({
  bgColor = "#24201E",
  fgColor = "#EBD9B4",
  withCircle = false,
  circleColor = "#352F2C",
  translateX = 68,
  translateY = 76,
  dogScale = 6.2,
}: {
  bgColor?: string;
  fgColor?: string;
  withCircle?: boolean;
  circleColor?: string;
  translateX?: number;
  translateY?: number;
  dogScale?: number;
} = {}) {
  const circleElement = withCircle
    ? `<circle cx="256" cy="256" r="200" fill="${circleColor}"/>`
    : "";

  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="${bgColor}"/>
    ${circleElement}
    <g transform="translate(${translateX}, ${translateY}) scale(${dogScale})" fill="${fgColor}">
      <!-- Barbell Bar -->
      <rect x="4" y="10" width="56" height="3.2" rx="1.6" />
      <!-- Left Plates -->
      <rect x="6" y="1" width="4" height="21" rx="1.8" />
      <rect x="11" y="3" width="3.5" height="17" rx="1.5" />
      <rect x="15.5" y="5.5" width="2.5" height="12" rx="1" />
      <!-- Right Plates -->
      <rect x="46" y="5.5" width="2.5" height="12" rx="1" />
      <rect x="49.5" y="3" width="3.5" height="17" rx="1.5" />
      <rect x="54" y="1" width="4" height="21" rx="1.8" />
      <!-- Paws -->
      <path d="M22 10 C22 8, 26 8, 26 10 L26 13 C26 14, 22 14, 22 13 Z" />
      <path d="M38 10 C38 8, 42 8, 42 10 L42 13 C42 14, 38 14, 38 13 Z" />
      <!-- Corgi Silhouette -->
      <path d="M 24 13 L 23 18 L 19 13 C 17 10, 16 14, 18 19 L 21 26 C 20 28, 17 29, 17 31 C 17 33, 21 34, 25 33 L 25 36 C 24 40, 23 46, 23 52 L 20 54 C 19 55, 19 57, 21 57 L 27 57 C 29 57, 29 55, 28 52 L 28 44 L 36 44 L 36 52 C 35 55, 35 57, 37 57 L 43 57 C 45 57, 45 55, 44 54 L 41 52 C 41 46, 40 40, 39 36 L 39 33 C 43 34, 47 33, 47 31 C 47 29, 44 28, 43 26 L 46 19 C 48 14, 47 10, 45 13 L 41 18 L 40 13 Z" />
      <path d="M24 12 L24 20 L28 22 L27 12 Z" />
      <path d="M40 12 L40 20 L36 22 L37 12 Z" />
    </g>
  </svg>`;
}

const mockups = [
  {
    name: "mockup_1_classic.png",
    opt: { bgColor: "#24201E", fgColor: "#EBD9B4", translateX: 68, translateY: 76, dogScale: 6.2 },
  },
  {
    name: "mockup_2_spotlight.png",
    opt: { bgColor: "#1A1715", circleColor: "#2C2725", withCircle: true, fgColor: "#FDFBF7", translateX: 68, translateY: 76, dogScale: 6.2 },
  },
  {
    name: "mockup_3_gold_badge.png",
    opt: { bgColor: "#24201E", circleColor: "#976232", withCircle: true, fgColor: "#FFFFFF", translateX: 68, translateY: 76, dogScale: 6.2 },
  },
  {
    name: "mockup_4_pure_black.png",
    opt: { bgColor: "#09090B", circleColor: "#18181B", withCircle: true, fgColor: "#EBD9B4", translateX: 68, translateY: 76, dogScale: 6.2 },
  },
];

const targetDir = "C:/Users/haden/.gemini/antigravity/brain/a7f2dc75-31d5-43cc-84ea-296a639d615d";

async function run() {
  for (const m of mockups) {
    const filePath = path.join(targetDir, m.name);
    await sharp(Buffer.from(makeSvg(m.opt)))
      .resize(512, 512)
      .png()
      .toFile(filePath);
    console.log("Created:", m.name);
  }
}

run().catch(console.error);

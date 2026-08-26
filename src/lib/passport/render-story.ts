import sharp from "sharp";
import QRCode from "qrcode";

export const PASSPORT_STORY_W = 1080;
export const PASSPORT_STORY_H = 1920;

const MAX_AVATAR_BYTES = 800_000;

type Composite = {
  input: Buffer;
  left: number;
  top: number;
};

export type PassportStoryInput = {
  fullName: string;
  passportNumber: string;
  memberSinceYear: number;
  levelName: string;
  levelMark: string;
  xp: number;
  avatarUrl: string | null;
  publicUrl: string;
  showQrCode: boolean;
  locale: "ar" | "en";
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function parseDataUrl(url: string): Buffer | null {
  const match = url.match(/^data:[^;,]+(?:;base64)?,([\s\S]+)$/);
  if (!match?.[1]) return null;
  if (match[1].length > MAX_AVATAR_BYTES * 1.4) return null;
  try {
    const buf = Buffer.from(match[1], "base64");
    return buf.length > MAX_AVATAR_BYTES ? null : buf;
  } catch {
    return null;
  }
}

async function loadAvatar(url: string | null): Promise<Buffer | null> {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("data:")) return parseDataUrl(trimmed);
  if (trimmed.startsWith("/api/")) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const res = await fetch(trimmed, { cache: "force-cache" });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.length > MAX_AVATAR_BYTES ? null : buf;
    } catch {
      return null;
    }
  }
  return null;
}

function buildSceneSvg(input: PassportStoryInput): string {
  const ar = input.locale === "ar";
  const title = ar ? "جواز VELORA الرقمي" : "Digital Beauty Passport";
  const subtitle = ar ? "MY VELORA PASSPORT" : "MY VELORA PASSPORT";
  const name = escapeXml(truncate(input.fullName, 28));
  const level = escapeXml(`${input.levelName} ${input.levelMark}`);
  const passportNo = escapeXml(input.passportNumber);
  const since = escapeXml(String(input.memberSinceYear));
  const xp = escapeXml(input.xp.toLocaleString("en-US"));
  const memberLabel = ar ? "عضوة منذ" : "Member Since";
  const levelLabel = ar ? "مستوى العضوية" : "Member Level";
  const xpLabel = ar ? "نقاط XP" : "XP Points";
  const verifyLabel = ar ? "امسحي للتحقق" : "Scan to verify";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PASSPORT_STORY_W}" height="${PASSPORT_STORY_H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F5F1FB"/>
      <stop offset="45%" stop-color="#FAFAFE"/>
      <stop offset="100%" stop-color="#FFFFFF"/>
    </linearGradient>
    <linearGradient id="doc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FEFEFF"/>
      <stop offset="50%" stop-color="#F5F1FB"/>
      <stop offset="100%" stop-color="#F0EBF8"/>
    </linearGradient>
    <pattern id="wave" width="120" height="120" patternUnits="userSpaceOnUse">
      <path d="M0 60 Q30 20 60 60 T120 60" fill="none" stroke="#7E68B5" stroke-width="0.5" opacity="0.18"/>
      <path d="M0 30 Q30 70 60 30 T120 30" fill="none" stroke="#7E68B5" stroke-width="0.4" opacity="0.14"/>
      <circle cx="60" cy="60" r="28" fill="none" stroke="#7E68B5" stroke-width="0.35" opacity="0.12"/>
    </pattern>
  </defs>
  <rect width="${PASSPORT_STORY_W}" height="${PASSPORT_STORY_H}" fill="url(#bg)"/>
  <rect x="60" y="120" width="960" height="1680" rx="28" fill="url(#doc)" stroke="#DCD3F5" stroke-width="2"/>
  <rect x="60" y="120" width="960" height="1680" rx="28" fill="url(#wave)" opacity="0.55"/>
  <text x="540" y="250" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="34" letter-spacing="16" fill="#24202B">VELORA</text>
  <text x="540" y="300" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" letter-spacing="8" fill="#7E68B5">${subtitle}</text>
  <text x="540" y="345" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#777080">${escapeXml(title)}</text>
  <text x="540" y="1180" text-anchor="middle" font-family="Georgia, serif" font-size="220" fill="#7E68B5" opacity="0.05">V</text>
  <rect x="120" y="390" width="840" height="920" rx="18" fill="#FFFFFF" fill-opacity="0.45" stroke="#E8E0F8" stroke-width="1"/>
  <text x="160" y="450" font-family="Arial, Helvetica, sans-serif" font-size="16" letter-spacing="3" fill="#7E68B5">PASSPORT NO.</text>
  <text x="160" y="485" font-family="ui-monospace, monospace" font-size="24" fill="#24202B">${passportNo}</text>
  <ellipse cx="290" cy="690" rx="105" ry="128" fill="#F5F1FB" stroke="#B9A7E8" stroke-width="2"/>
  <text x="540" y="610" text-anchor="middle" font-family="Georgia, serif" font-size="44" fill="#24202B">${name}</text>
  <text x="540" y="670" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" letter-spacing="4" fill="#7E68B5">${level}</text>
  <text x="220" y="880" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" letter-spacing="2" fill="#777080">${escapeXml(memberLabel)}</text>
  <text x="220" y="920" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#24202B">${since}</text>
  <text x="540" y="880" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" letter-spacing="2" fill="#777080">${escapeXml(levelLabel)}</text>
  <text x="540" y="920" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#24202B">${level}</text>
  <text x="860" y="880" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" letter-spacing="2" fill="#777080">${escapeXml(xpLabel)}</text>
  <text x="860" y="920" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#24202B">${xp}</text>
  <text x="540" y="1020" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#777080">VELORA · VERIFIED · DIGITAL BEAUTY PASSPORT</text>
  <rect x="430" y="1380" width="220" height="220" rx="12" fill="#FFFFFF" stroke="#DCD3F5" stroke-width="1"/>
  <text x="540" y="1630" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" letter-spacing="2" fill="#7E68B5">${escapeXml(verifyLabel)}</text>
  <text x="540" y="1710" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#999">velorabeautyiq.me</text>
</svg>`;
}

async function composeAvatar(initials: string): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="210" height="256">
    <ellipse cx="105" cy="128" rx="100" ry="122" fill="#F5F1FB" stroke="#B9A7E8" stroke-width="2"/>
    <text x="105" y="145" text-anchor="middle" font-family="Georgia, serif" font-size="52" fill="#5A4A7A">${escapeXml(initials)}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function passportInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "V";
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "V";
}

/**
 * Server-rendered MY VELORA PASSPORT Story — 1080×1920 PNG.
 */
export async function renderPassportStoryPng(
  input: PassportStoryInput,
): Promise<Buffer> {
  const scene = Buffer.from(buildSceneSvg(input));
  const composites: Composite[] = [];

  const avatarRaw = await loadAvatar(input.avatarUrl);
  let avatarLayer: Buffer;
  if (avatarRaw) {
    try {
      avatarLayer = await sharp(avatarRaw, { failOn: "none" })
        .rotate()
        .resize(210, 256, { fit: "cover" })
        .png()
        .toBuffer();
    } catch {
      avatarLayer = await composeAvatar(passportInitials(input.fullName));
    }
  } else {
    avatarLayer = await composeAvatar(passportInitials(input.fullName));
  }

  composites.push({
    input: avatarLayer,
    left: 185,
    top: 562,
  });

  if (input.showQrCode && input.publicUrl) {
    const qrPng = await QRCode.toBuffer(input.publicUrl, {
      type: "png",
      width: 400,
      margin: 1,
      color: { dark: "#24202B", light: "#FFFFFF" },
    });
    const qrSized = await sharp(qrPng)
      .resize(190, 190, { fit: "contain" })
      .png()
      .toBuffer();
    composites.push({
      input: qrSized,
      left: 445,
      top: 1395,
    });
  }

  return sharp(scene).composite(composites).png().toBuffer();
}

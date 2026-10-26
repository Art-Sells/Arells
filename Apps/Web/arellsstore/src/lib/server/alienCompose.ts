import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export const ALIEN_COMPOSE_BASE_REL = path.join(
  'public',
  'images',
  'banners',
  'assets',
  'crypto',
  'Bitcoin',
  'Posters',
  'BTCBaseAnnouncementPoster.jpg'
);
export const ALIEN_COMPOSE_IRIS_REL = path.join('public', 'tmp', 'bitcoin-alien-iris-ref.jpg');

/**
 * Grok multi-image edit: <IMAGE_0> base poster (canvas first), <IMAGE_1> selfie, <IMAGE_2> iris.
 * Base must be first — Grok follows the first image for layout/aspect.
 */
export const ALIEN_COMPOSE_PROMPT = [
  'EDIT TASK (not a new generation): Start from <IMAGE_0> and change as little as possible.',
  'OUTPUT MUST still be the same Season One poster as <IMAGE_0> — same concrete wall, same girl on the left, same bearded man in the center, same framing, same warm lighting, same rust-orange jacket family / white tee / white pants on the right figure (jacket cut may become feminine if <IMAGE_1> is female — see GENDER FIT), same gold A necklace and hand pose.',
  'TEXT: Copy on-image lettering from <IMAGE_0> exactly (same words, spelling, placement, size). Do NOT add any new words, titles, captions, watermarks, logos, or gibberish. Do NOT invent alternate premiere dates or show names. If you cannot reproduce the text perfectly, leave that region identical to <IMAGE_0>.',
  'Replace ONLY the featureless matte-white silhouette head and white hands on the RIGHT figure. Do NOT replace Sam or Leila. Do NOT replace the background. Do NOT crop to a portrait of <IMAGE_1>. Do NOT output <IMAGE_1> itself. Do NOT restyle the whole poster as a selfie.',
  'IDENTITY: Fill that white head/hands with an unmistakable photorealistic likeness of the person in <IMAGE_1> — same face shape, bone structure, nose, lips, ears, mustache/facial hair when present in <IMAGE_1>, hair or shaved head/hairline exactly as in <IMAGE_1>, skin tone, skin texture, and age. Look down at the necklace as in <IMAGE_0>.',
  'HANDS (REQUIRED — COLOR LOCK): Both hands on the right figure MUST have the SAME photorealistic skin tone as the finished face from <IMAGE_1> — warm living skin, matching undertone and darkness. NEVER leave hands matte-white, mannequin-white, plaster-white, or lighter than the face. NEVER output white gloves or unpainted white silhouette hands. Fingers, knuckles, and nails stay natural; only skin color must match the face.',
  'HAIR: Match <IMAGE_1>\'s hairstyle (color, parting, texture, length style) but keep hair proportional to the finished head — not oversized. If hair is worn out/down/loose, show it complete (not cropped bald, not stuffed only inside the skull), yet keep volume moderate: hair mass should stay in scale with the ~50%-smaller head and the orange jacket shoulders. Do NOT create a huge halo of hair bigger than the torso. Do NOT exaggerate length or puffiness beyond <IMAGE_1>. Bald/shaved only if <IMAGE_1> is bald/shaved.',
  'HEAD SIZE (REQUIRED): The finished head must be about 50% smaller than the white mannequin head in <IMAGE_0> (roughly half the white head\'s width and height). Keep it centered on the same neck/collar, aligned with the orange jacket shoulders. Do NOT fill the entire white head region. Do NOT match the full white head size. Leave clear empty margin inside the old white oval if needed. Hands stay the same size as the white hands in <IMAGE_0>.',
  'IRIS: For the right character only, use natural non-glowing amber/burnt-orange irises matching <IMAGE_2>\'s color and detail — matte photorealistic, no bloom, no glow. Leave Sam and Leila\'s eyes as in <IMAGE_0>.',
  'MAKEUP: For the right character only — IF <IMAGE_1> appears female / already wears lipstick or eyeliner, change lipstick and eyeliner to Bitcoin orange (warm amber/burnt-orange matching the iris hue), natural photorealistic, not cartoon. IF <IMAGE_1> appears male / masculine (or has no lipstick/eyeliner), do NOT add lipstick, eyeliner, mascara, or any makeup — keep a natural bare face. Leave Sam and Leila unchanged.',
  'GENDER FIT: Infer sex presentation from <IMAGE_1>. IF female / feminine: restyle the right figure\'s orange jacket to a feminine cut (softer shoulder, more tailored/fitted waist, feminine collar/zipper proportions); give the visible body feminine proportions under the jacket (shoulders, chest, waist) consistent with <IMAGE_1>. IF male / masculine: keep the orange jacket cut, tee, pants, and body proportions as in <IMAGE_0> (do not feminize). Leave Sam and Leila unchanged.',
  'JACKET COLOR (CRITICAL — COLOR LOCK): The right figure\'s jacket MUST stay the exact same rust-orange / Bitcoin orange as in <IMAGE_0> — same hue, saturation, and brightness. Feminine cut may change shape/fit only. NEVER recolor the jacket (no pink, red, brown, black, beige, or any other color). Leave Sam and Leila jackets unchanged.',
  'If you are unsure, keep more of <IMAGE_0> unchanged and only swap the white silhouette regions.',
].join(' ');

/**
 * Wide 2:1 Personal Bitcoin Alien portrait.
 * <IMAGE_0> selfie identity, <IMAGE_1> iris style.
 */
export const ALIEN_PORTRAIT_PROMPT = [
  'Create a wide cinematic portrait (aspect 2:1) of the SAME person as <IMAGE_0> as their Personal Bitcoin Alien character.',
  'IDENTITY LOCK: unmistakable photorealistic likeness of <IMAGE_0> — face shape, features, skin tone, hair or shaved head exactly as in <IMAGE_0>.',
  'EXPRESSION: neutral, calm, looking straight at camera. No smile exaggeration, no looking down at a necklace.',
  'IRIS: natural non-glowing amber/burnt-orange irises matching <IMAGE_1> color and radial detail — matte photorealistic, no bloom, no supernatural glow.',
  'MAKEUP: IF <IMAGE_0> appears female / already wears lipstick or eyeliner, change lipstick and eyeliner to Bitcoin orange (warm amber/burnt-orange matching the iris hue), natural photorealistic, not cartoon. IF <IMAGE_0> appears male / masculine (or has no lipstick/eyeliner), do NOT add lipstick, eyeliner, mascara, or any makeup — keep a natural bare face.',
  'WARDROBE: rust-orange zip/button jacket over a light tee, cinematic warm lighting, simple soft background (no poster text, no other people, no necklace required).',
  'GENDER FIT: Infer sex presentation from <IMAGE_0>. IF female / feminine: use a feminine-cut orange jacket (softer shoulder, tailored/fitted waist, feminine collar/zipper proportions) and feminine head-and-shoulders body proportions consistent with <IMAGE_0>. IF male / masculine: keep a standard menswear orange jacket cut and masculine body proportions (do not feminize).',
  'JACKET COLOR (CRITICAL — COLOR LOCK): The jacket MUST be the exact same rust-orange / Bitcoin orange as the Personal Bitcoin Alien wardrobe — same hue, saturation, and brightness. Feminine cut may change shape/fit only. NEVER recolor the jacket (no pink, red, brown, black, beige, or any other color).',
  'Head-and-shoulders framing for a wide 2:1 image. No extra text, logos, or watermarks.',
].join(' ');

/** Re-encode to a clean sRGB JPEG. */
async function toCleanJpeg(buffer: Buffer, maxEdge = 1536): Promise<Buffer> {
  try {
    return await sharp(buffer, { failOn: 'none' })
      .rotate()
      .resize({
        width: maxEdge,
        height: maxEdge,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toColorspace('srgb')
      .jpeg({ quality: 95, mozjpeg: true })
      .toBuffer();
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'unknown';
    throw new Error(`Could not read that photo (${detail}). Try a different JPEG or PNG.`);
  }
}

/** Tight head/shoulders crop so clothing/background don't dilute identity. */
async function toIdentityJpeg(buffer: Buffer): Promise<Buffer> {
  try {
    const img = sharp(buffer, { failOn: 'none' }).rotate();
    const meta = await img.metadata();
    const w = meta.width || 0;
    const h = meta.height || 0;
    if (w < 32 || h < 32) {
      return toCleanJpeg(buffer);
    }

    const cropW = Math.round(w * 0.86);
    const cropH = Math.round(h * 0.78);
    const left = Math.max(0, Math.round((w - cropW) / 2));
    const top = Math.max(0, Math.round(h * 0.04));
    const topClamped = Math.min(top, Math.max(0, h - cropH));

    return await sharp(buffer, { failOn: 'none' })
      .rotate()
      .extract({
        left,
        top: topClamped,
        width: Math.min(cropW, w - left),
        height: Math.min(cropH, h - topClamped),
      })
      .resize({
        width: 1536,
        height: 1536,
        fit: 'inside',
        withoutEnlargement: false,
      })
      .toColorspace('srgb')
      .jpeg({ quality: 95, mozjpeg: true })
      .toBuffer();
  } catch {
    return toCleanJpeg(buffer);
  }
}

function toDataUri(jpeg: Buffer): string {
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
}

export async function readAlienComposeRef(
  relPath: string
): Promise<{ buffer: Buffer; mime: 'image/jpeg' }> {
  const abs = path.join(process.cwd(), relPath);
  const raw = await fs.readFile(abs);
  const buffer = await toCleanJpeg(raw);
  return { buffer, mime: 'image/jpeg' };
}

export function grokApiKeyOrThrow(): string {
  const key =
    process.env.GROK_API_KEY?.trim() ||
    process.env.XAI_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error('GROK_API_KEY is not set');
  }
  return key;
}

async function grokImageEdit(args: {
  prompt: string;
  images: Array<{ url: string; type: string }>;
  aspectRatio: string;
}): Promise<Buffer> {
  const apiKey = grokApiKeyOrThrow();
  const res = await fetch('https://api.x.ai/v1/images/edits', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-imagine-image-2.0',
      prompt: args.prompt,
      images: args.images,
      aspect_ratio: args.aspectRatio,
      resolution: '1k',
      response_format: 'b64_json',
    }),
  });

  const raw = await res.text();
  let json: {
    data?: Array<{ b64_json?: string; url?: string }>;
    error?: { message?: string };
    message?: string;
  };
  try {
    json = JSON.parse(raw) as typeof json;
  } catch {
    throw new Error(`Grok image edit returned non-JSON (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(json.error?.message || json.message || `Grok image edit failed (${res.status})`);
  }

  const b64 = json.data?.[0]?.b64_json;
  if (b64) {
    return Buffer.from(b64, 'base64');
  }

  const url = json.data?.[0]?.url;
  if (url) {
    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      throw new Error(`Failed to download Grok result image (${imgRes.status})`);
    }
    return Buffer.from(await imgRes.arrayBuffer());
  }

  throw new Error('Grok image edit returned no image data');
}

/**
 * Multi-image edit via xAI Grok Imagine (JSON edits API).
 * Order: base poster FIRST (layout lock), then selfie, then iris.
 */
export async function composePersonalBitcoinAlien(args: {
  selfie: Buffer;
  selfieMime: string;
  base: Buffer;
  baseMime: string;
  iris: Buffer;
  irisMime: string;
}): Promise<Buffer> {
  const [baseJpeg, identityJpeg, irisJpeg] = await Promise.all([
    toCleanJpeg(args.base),
    toIdentityJpeg(args.selfie),
    toCleanJpeg(args.iris),
  ]);

  return grokImageEdit({
    prompt: ALIEN_COMPOSE_PROMPT,
    images: [
      { url: toDataUri(baseJpeg), type: 'image_url' },
      { url: toDataUri(identityJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
    ],
    aspectRatio: '3:2',
  });
}

/**
 * Wide 2:1 Personal Bitcoin Alien portrait — neutral expression, iris locked.
 * Order: selfie identity, then iris ref.
 */
export async function composePersonalBitcoinAlienPortrait(args: {
  selfie: Buffer;
  iris: Buffer;
}): Promise<Buffer> {
  const [identityJpeg, irisJpeg] = await Promise.all([
    toIdentityJpeg(args.selfie),
    toCleanJpeg(args.iris),
  ]);

  return grokImageEdit({
    prompt: ALIEN_PORTRAIT_PROMPT,
    images: [
      { url: toDataUri(identityJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
    ],
    aspectRatio: '2:1',
  });
}

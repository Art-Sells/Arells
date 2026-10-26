import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const ALIEN_COMPOSE_DIR = path.join(
  'public',
  'images',
  'banners',
  'assets',
  'crypto',
  'Bitcoin',
  'AlienCompose'
);

/** Launch / share metaposter base (white mannequin). */
export const ALIEN_COMPOSE_BASE_REL = path.join(ALIEN_COMPOSE_DIR, 'metaposter-base.jpg');
/** Wide SEASON ONE banner base (white mannequin between SEASON / ONE). */
export const ALIEN_SEASONONE_BASE_REL = path.join(ALIEN_COMPOSE_DIR, 'seasonone-base.jpg');
/** Permanent iris color/detail reference (not tmp). */
export const ALIEN_COMPOSE_IRIS_REL = path.join(ALIEN_COMPOSE_DIR, 'iris-ref.jpg');

/**
 * Grok multi-image edit: <IMAGE_0> base poster (canvas first), <IMAGE_1> selfie, <IMAGE_2> iris.
 * Base must be first — Grok follows the first image for layout/aspect.
 */
export const ALIEN_COMPOSE_PROMPT = [
  'EDIT TASK (not a new generation): Start from <IMAGE_0> and change as little as possible.',
  'OUTPUT MUST still be the same square Launch / “now playing” metaposter as <IMAGE_0> — same beige wall, same left-side orange title stack (“THE BITCOIN ALIEN RACE” / “Season One” / “now playing”), same framing, same lighting family, same rust-orange jacket / white tee / white pants on the LEFT white-mannequin figure (jacket cut may become feminine if <IMAGE_1> is female — see GENDER FIT), same gold A / triangular necklace.',
  'ANTI-TWIN / MALE SIMILARITY LOCK (CRITICAL): If <IMAGE_1> is a man who looks similar to the bearded man on the RIGHT, they MUST stay TWO DIFFERENT people. NEVER clone <IMAGE_1> onto the bearded man. NEVER make left and right men twins or copies. The RIGHT bearded man must remain the ORIGINAL man from <IMAGE_0> only — not the uploaded selfie.',
  'SAM + GIRL LOCK (CRITICAL — DO NOT TOUCH): The bearded man and young girl on the RIGHT must stay identical to <IMAGE_0> — faces, skin, hair, eyes, iris color (NOT amber/orange from <IMAGE_2>), clothing, hands, lighting. Do NOT apply <IMAGE_1> or <IMAGE_2> to them. If their eyes become orange/amber/glowing, the edit failed.',
  'SAM + GIRL EYES (CRITICAL — NEVER ERASE): Sam and the girl MUST keep complete, open, living eyes exactly as in <IMAGE_0> — pupils, irises, sclera, eyelids, lashes. FORBIDDEN: blank eyes, white-out eyes, missing irises, closed/melted eye sockets, smeared eye regions, featureless faces, painted-over eyes. If their eyes are erased or damaged vs <IMAGE_0>, the edit FAILED — restore eyes from <IMAGE_0> before finishing.',
  'TEXT: Copy on-image lettering from <IMAGE_0> exactly. Do NOT invent premiere dates or new words.',
  'Replace ONLY the featureless matte-white silhouette head (and any white neck/hands/skin) on the LEFT mannequin figure in the orange jacket. Do NOT replace the bearded man or the girl.',
  'HEAD SIZE (CRITICAL — MATCH MANNEQUIN EXACTLY): LEFT head+hair+wrap MUST match the white mannequin head size in <IMAGE_0>. Scale likeness INTO that bound. Center on same neck/collar.',
  'IDENTITY (LEFT MANNEQUIN ONLY): Photorealistic likeness of <IMAGE_1> ONLY on the LEFT orange-jacket figure — face, hair, skin, age. Distinct from the RIGHT bearded man even if similar.',
  'EXPRESSION (CRITICAL — NEUTRAL): LEFT face must be neutral / calm — closed or gently relaxed mouth, no smile, no grin, no laugh, no frown, no scowl, no surprise. If <IMAGE_1> is smiling, frowning, or expressive, convert to a neutral expression while keeping identity. Match the calm look of the bearded man / girl in <IMAGE_0>.',
  'LIGHTING (CRITICAL — EVEN STUDIO MATCH): LEFT face/neck/hands: soft even studio-like light matching the bearded man / girl in <IMAGE_0>. FORBIDDEN: harsh split lighting, blown white forehead/nose hotspots, shiny plastic skin, selfie flash. Skin must look like real living skin.',
  'NECK (CRITICAL — MOST COMMON FAILURE — NEVER WHITE): The LEFT neck from jawline to collar MUST be living skin continuous with the LEFT face — same tone, undertone, pores/texture. FORBIDDEN: leaving the original mannequin neck white, porcelain, plaster, or tee-white under the chin. A face with a white neck is a FAILED edit — repaint the entire neck column before finishing.',
  'HANDS (CRITICAL — NEVER WHITE): Every LEFT hand/wrist/finger (including in pockets) MUST match the LEFT face skin tone. FORBIDDEN: mannequin-white, plaster, white gloves, white blobs into white pants/tee.',
  'HAIR: Match <IMAGE_1> hair but keep head+hair within mannequin head bound.',
  'HATS (REQUIRED — REMOVE): Remove hats/caps/beanies; show natural hair. Do not enlarge head.',
  'HEADWEAR (CRITICAL — DEFAULT NONE): Do NOT add a bandana, wrap, durag, scarf, headband, or any headwear. Bare head / natural hair only UNLESS <IMAGE_1> clearly already wears a bandana/wrap/durag/scarf/headband — then keep that item only and recolor it to LEFT jacket rust-orange. NEVER invent headwear.',
  'IRIS (LEFT FIGURE ONLY): LEFT irises match <IMAGE_2> amber/burnt-orange — matte, NO glow, NO bloom, NO neon. LEFT eyes must be complete (pupil + iris + sclera) — never blank/erased. Bearded man and girl keep ORIGINAL eye colors from <IMAGE_0> — never orange.',
  'NO GLOWING EYES (CRITICAL — ALL FIGURES): Eyes must be matte / natural photorealistic only. FORBIDDEN on anyone: glowing eyes, luminous pupils, light beams, bloom, neon, emissive/HDR eye glow, sci-fi shine.',
  'NO ERASED EYES (CRITICAL — ALL FIGURES): Nobody may have blank, white, missing, or destroyed eyes. Sam + girl eyes = <IMAGE_0>. LEFT eyes = full eyes with <IMAGE_2> iris color.',
  'MAKEUP: LEFT only — female lipstick/eyeliner → Bitcoin orange; male/bare → no makeup. Sam/girl unchanged.',
  'GENDER FIT (CRITICAL — LEFT FIGURE ONLY): Infer sex presentation from <IMAGE_1>. IF female / feminine: restyle the LEFT orange jacket to a feminine cut (softer shoulder, tailored/fitted waist, feminine collar/zipper proportions) and give feminine body proportions under the jacket (shoulders, chest, waist) consistent with <IMAGE_1>. IF male / masculine: keep the orange jacket cut, tee, pants, and body proportions as in <IMAGE_0> (menswear / do not feminize). Never change Sam or the girl.',
  'JACKET COLOR (CRITICAL): LEFT jacket exact rust-orange / Bitcoin orange from <IMAGE_0> — gender fit may change cut/shape only, never hue.',
  'If unsure, change less — only the LEFT white mannequin regions.',
].join(' ');

/**
 * Second-pass metaposter fix: <IMAGE_0> first compose result, <IMAGE_1> original base.
 * Hardens head size when the first pass ignores mannequin scale.
 */
export const ALIEN_COMPOSE_HEAD_SIZE_FIX_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0>. Change as little as possible.',
  'NECK FIX (CRITICAL — DO THIS): If the LEFT orange-jacket person has a white / mannequin / porcelain neck under a skinned face, REPAINT the entire neck + throat + visible skin at the collar to match the face skin tone continuously (jaw → neck → collar). No white neck column. This is required even if head size is already correct.',
  'HEAD SIZE FIX (CRITICAL): If the LEFT head is too big, shrink it to MATCH the mannequin head size in <IMAGE_1> — same width/height/scale vs orange jacket shoulders. Keep identity, iris color, jacket, pose from <IMAGE_0>. Center on same neck/collar as <IMAGE_1>.',
  'HANDS: If any LEFT hand/wrist is still white, paint skin matching the face.',
  'SAM + GIRL EYE RESTORE (CRITICAL): If the bearded man or girl on the RIGHT have blank/erased/missing/white eyes vs <IMAGE_1>, RESTORE their complete eyes from <IMAGE_1> exactly — pupils, irises, sclera. Do not leave damaged eyes.',
  'LEFT EYES: LEFT figure must keep complete eyes (not blank); amber iris color from <IMAGE_0> result stays matte — no glow.',
  'NO GLOWING EYES: Keep eyes matte — no glow, bloom, neon, or emissive pupils on anyone.',
  'Do NOT change Sam or the girl except to restore erased eyes from <IMAGE_1>. Do NOT change text, background, or framing.',
].join(' ');

/**
 * Wide 2:1 Personal Bitcoin Alien portrait.
 * <IMAGE_0> selfie identity, <IMAGE_1> iris style.
 */
export const ALIEN_PORTRAIT_PROMPT = [
  'PRIORITY ORDER (HIGHEST FIRST): (1) IRIS LOCK to <IMAGE_1>, (2) identity from <IMAGE_0>, (3) sun light + front pose, (4) everything else. Never sacrifice iris color for any other goal.',
  'Create a wide portrait (aspect 2:1) of the SAME person as <IMAGE_0> as their Personal Bitcoin Alien character.',
  'IRIS (MOST IMPORTANT — CRITICAL — LOCK TO <IMAGE_1>): BOTH irises MUST match <IMAGE_1> exactly — same amber / burnt-orange / Bitcoin-orange hue, saturation, brightness, and radial detail. Matte photorealistic, natural wetness OK. FORBIDDEN: brown, blue, green, hazel, black, gray, or any <IMAGE_0> eye color; glow; bloom; neon. If EITHER eye is not clearly amber/burnt-orange like <IMAGE_1>, the entire edit failed — fix the irises before anything else. Eye color comes ONLY from <IMAGE_1>.',
  'NO GLOWING EYES (CRITICAL): Eyes must be matte / natural photorealistic only. FORBIDDEN: glowing eyes, luminous pupils, light beams, bloom, neon, emissive/HDR eye glow, sci-fi shine.',
  'IDENTITY ONLY FROM <IMAGE_0>: Use <IMAGE_0> ONLY for face identity (shape, features, skin tone, hair). Discard <IMAGE_0>\'s lighting, camera angle, pose, and eye color.',
  'POSE (CRITICAL — FACE FORWARD): Head and face straight-on / front view. Eyes into camera. FORBIDDEN: 3/4 turn, looking left/right, profile, chin-down selfie angle. If <IMAGE_0> is turned, straighten to full frontal.',
  'EXPRESSION (CRITICAL — NEUTRAL): Neutral / calm mouth. If <IMAGE_0> is expressive, convert to neutral while keeping identity.',
  'LIGHTING (CRITICAL — SUN LIGHT — IGNORE PHOTO LIGHT): Ignore <IMAGE_0> lighting completely. Relight with natural sunlight on the face — clear daytime sun, soft open-shade fill so skin stays readable, natural sun catchlights. FORBIDDEN: cinematic lighting, studio softboxes, ring light, phone selfie flash, copying photo lighting, evening/golden-hour/sunset, harsh underexposed shadow side, blown white hotspots.',
  'BACKGROUND (CRITICAL — BEIGE WALL): Plain indoor wall behind the subject — warm beige / light sand plaster wall matching the Launch / Season One poster wall family. Soft even light on the wall, subtle texture OK. FORBIDDEN: orange color wash, solid #F88D00 backdrop, gray studio sweep, busy room, windows, outdoors, gradients that read as abstract color fields instead of a wall.',
  'MAKEUP: IF <IMAGE_0> appears female / already wears lipstick or eyeliner, Bitcoin-orange lipstick/eyeliner. IF male / bare-faced, do NOT add makeup.',
  'HATS (REQUIRED — REMOVE): Remove hats/caps/beanies; show natural hair.',
  'HEADWEAR (CRITICAL — DEFAULT NONE): Do NOT invent bandanas/wraps. Only keep if clearly in <IMAGE_0>, then recolor to jacket rust-orange.',
  'WARDROBE: rust-orange zip/button jacket over a light tee (no poster text, no other people, no necklace required).',
  'GENDER FIT: Feminine <IMAGE_0> → feminine orange jacket cut + proportions. Masculine → menswear jacket cut. Do not feminize males.',
  'JACKET COLOR (CRITICAL): Exact rust-orange / Bitcoin orange wardrobe hue.',
  'Head-and-shoulders framing, wide 2:1. No extra text, logos, or watermarks.',
].join(' ');

/** Second pass: force studio lighting + frontal pose on My Character portrait. */
export const ALIEN_PORTRAIT_STUDIO_FIX_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0>. Keep the same person and jacket.',
  'IRIS (MOST IMPORTANT): BOTH irises must stay amber/burnt-orange Bitcoin alien eyes — never revert to brown/blue/green/natural photo eye color. If irises drifted, fix them first.',
  'NO GLOWING EYES (CRITICAL): Keep eyes matte — no glow, bloom, neon, luminous pupils, or emissive shine.',
  'LIGHTING FIX (CRITICAL — SUN LIGHT): Relight the face/neck from scratch with natural daytime sunlight (clear sun + soft open-shade fill). REMOVE cinematic/studio/ring-light/selfie-flash look and any leftover phone-photo lighting.',
  'POSE FIX (CRITICAL): Full front-facing — straight at camera, no 3/4 turn left or right. Eyes forward.',
  'EXPRESSION: Keep neutral / calm.',
  'BACKGROUND FIX (CRITICAL — BEIGE WALL): Replace any orange wash / abstract color field with a plain warm beige / light sand indoor wall (same family as Launch / Season One posters). Soft even wall light, subtle texture OK. FORBIDDEN: orange backdrop, gray studio sweep, busy scene.',
].join(' ');

/**
 * Wide SEASON ONE banner — sole mannequin only (no other cast).
 * <IMAGE_0> SeasonOne banner, <IMAGE_1> selfie, <IMAGE_2> iris.
 */
export const ALIEN_SEASONONE_PROMPT = [
  'EDIT TASK (not a new generation): Start from <IMAGE_0> and change as little as possible. INPAINT the sole center mannequin only — NOT a new poster.',
  'LOCKED CANVAS from <IMAGE_0>: same ultra-wide banner, same beige wall, same “SEASON” (left) and “ONE” (right) lettering, same framing/aspect, same soft studio light. ONE figure only — the center orange-jacket mannequin. Do NOT invent extra people.',
  'Replace ONLY the featureless matte-white mannequin head (and any white neck/hands/skin) on the sole orange-jacket figure. Keep gold triangular / “A” necklace, white tee, hands-in-pockets pose, jacket hue from <IMAGE_0>.',
  'IDENTITY: Photorealistic likeness of <IMAGE_1> — face, hair, skin, age — on that sole figure only.',
  'EXPRESSION (CRITICAL — NEUTRAL): Neutral / calm face. If <IMAGE_1> is expressive, convert to neutral while keeping identity.',
  'LIGHTING: Soft even light matching <IMAGE_0>. No selfie flash, no plastic shine.',
  'NECK (CRITICAL — NEVER WHITE): Neck jawline→collar = living skin continuous with the face. Face + white neck = FAILED.',
  'HANDS (CRITICAL — NEVER WHITE): Hands/wrists/fingers (including in pockets) match face skin tone. No mannequin-white.',
  'HEAD SIZE: Same size as the white mannequin head in <IMAGE_0>. Do NOT enlarge past that bound. Do NOT cover “SEASON” or “ONE”.',
  'HATS (REMOVE) / HEADWEAR DEFAULT NONE: No invented bandanas/wraps; natural hair from <IMAGE_1> unless <IMAGE_1> already wears headwear (then recolor to jacket rust-orange).',
  'IRIS (CRITICAL — LOCK TO <IMAGE_2>): BOTH irises MUST match <IMAGE_2> exactly — same amber / burnt-orange / Bitcoin-orange hue, saturation, brightness, and radial iris texture/detail. Matte photorealistic, natural wetness OK. Eye color + iris texture come ONLY from <IMAGE_2>.',
  'NO GLOWING EYES (CRITICAL): Matte eyes only. FORBIDDEN: glow, bloom, neon, luminous pupils, emissive/HDR eye shine.',
  'MAKEUP: Female/lipstick in <IMAGE_1> → Bitcoin-orange lipstick/eyeliner. Male/bare → no makeup.',
  'BODY LOCK (CRITICAL — NO BODY RECOMPOSE): Keep jacket cut, shoulders, chest, waist, tee, pants/pose, and overall body proportions EXACTLY as in <IMAGE_0>. Do NOT feminize, masculinize, reshape, slim, widen, or restyle the body or jacket. Face/skin/hair/iris only.',
  'JACKET COLOR (CRITICAL): Exact rust-orange / Bitcoin orange from <IMAGE_0> — never change hue or cut.',
  'FAILURE CHECK: If any white mannequin neck/hands remain, eyes glow, irises are not amber like <IMAGE_2>, or the body/jacket shape changed from <IMAGE_0> — fix those before finishing.',
].join(' ');

/**
 * Second-pass Season One: neck/hands + iris harden; keep sole-figure layout.
 * <IMAGE_0> first compose result, <IMAGE_1> original seasonone-base, <IMAGE_2> iris.
 */
export const ALIEN_SEASONONE_FIX_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0>. Change as little as possible.',
  'SOLE FIGURE: Keep ONE person only — the center orange-jacket figure. Do NOT add other people. Keep “SEASON” / “ONE” and beige wall from <IMAGE_1>.',
  'BODY LOCK: Jacket cut and body proportions must match <IMAGE_1> — do not reshape the body.',
  'NECK FIX: If neck is still white/mannequin, repaint jaw→collar to match face skin continuously.',
  'HANDS FIX: If any hand/wrist is still white, paint skin matching the face.',
  'HEAD SIZE: If head is too big vs the mannequin in <IMAGE_1>, shrink to that bound; keep identity.',
  'IRIS (CRITICAL): BOTH irises must match <IMAGE_2> amber/burnt-orange hue + radial texture — matte, NO glow.',
  'NO GLOWING EYES: Matte only.',
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
      model: process.env.GROK_IMAGE_MODEL?.trim() || 'grok-imagine-image-2.0',
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
    toCleanJpeg(args.base, 2048),
    toIdentityJpeg(args.selfie),
    toCleanJpeg(args.iris),
  ]);

  const firstPass = await grokImageEdit({
    prompt: ALIEN_COMPOSE_PROMPT,
    images: [
      { url: toDataUri(baseJpeg), type: 'image_url' },
      { url: toDataUri(identityJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
    ],
    // LaunchPoster(metaposter) is square 2000×2000 — keep 1:1 so Grok does not recompose Sam/girl.
    aspectRatio: '1:1',
  });

  // Second pass: force LEFT head to mannequin scale using original base as size reference.
  const firstJpeg = await toCleanJpeg(firstPass, 2048);
  return grokImageEdit({
    prompt: ALIEN_COMPOSE_HEAD_SIZE_FIX_PROMPT,
    images: [
      { url: toDataUri(firstJpeg), type: 'image_url' },
      { url: toDataUri(baseJpeg), type: 'image_url' },
    ],
    aspectRatio: '1:1',
  });
}

/** Ultra-wide SEASON ONE banner with mannequin replaced. */
export async function composePersonalBitcoinAlienSeasonOne(args: {
  selfie: Buffer;
  base: Buffer;
  iris: Buffer;
}): Promise<Buffer> {
  const [baseJpeg, identityJpeg, irisJpeg] = await Promise.all([
    toCleanJpeg(args.base, 4561),
    toIdentityJpeg(args.selfie),
    toCleanJpeg(args.iris),
  ]);

  const firstPass = await grokImageEdit({
    prompt: ALIEN_SEASONONE_PROMPT,
    images: [
      { url: toDataUri(baseJpeg), type: 'image_url' },
      { url: toDataUri(identityJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
    ],
    // Banner is ~4:1; follow IMAGE_0 so “SEASON” / “ONE” stay.
    aspectRatio: 'auto',
  });

  // Second pass: neck/hands + iris harden; keep sole-figure banner.
  const firstJpeg = await toCleanJpeg(firstPass, 4561);
  return grokImageEdit({
    prompt: ALIEN_SEASONONE_FIX_PROMPT,
    images: [
      { url: toDataUri(firstJpeg), type: 'image_url' },
      { url: toDataUri(baseJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
    ],
    aspectRatio: 'auto',
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

  const firstPass = await grokImageEdit({
    prompt: ALIEN_PORTRAIT_PROMPT,
    images: [
      { url: toDataUri(identityJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
    ],
    aspectRatio: '2:1',
  });

  // Second pass: strip leftover selfie lighting + force frontal pose; re-pass iris so eyes stay locked.
  const firstJpeg = await toCleanJpeg(firstPass, 2048);
  return grokImageEdit({
    prompt: [
      ALIEN_PORTRAIT_STUDIO_FIX_PROMPT,
      'IRIS REF: Match BOTH irises to <IMAGE_1> amber/burnt-orange exactly — highest priority. NO GLOWING EYES — matte only.',
    ].join(' '),
    images: [
      { url: toDataUri(firstJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
    ],
    aspectRatio: '2:1',
  });
}

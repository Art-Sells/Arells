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
  'HEAD SIZE (CRITICAL — #1 CONSTRAINT AFTER CANVAS): LEFT head + hair MUST be the SAME pixel scale as the white mannequin head in <IMAGE_0>. Measure vs orange-jacket shoulders / collar: head width ≈ mannequin head width in <IMAGE_0>, chin-to-crown ≈ mannequin. FORBIDDEN: enlarging the head to fit more face detail, big hair that grows the silhouette, oversized face vs Sam. Shrink the likeness INTO the mannequin bound — do NOT expand the bound. Center on the same neck/collar as <IMAGE_0>. A LEFT head larger than the mannequin = FAILED edit.',
  'IDENTITY (LEFT MANNEQUIN ONLY): Photorealistic likeness of <IMAGE_1> ONLY on the LEFT orange-jacket figure — face, hair, skin, age — but ALWAYS within the mannequin head-size bound above. Distinct from the RIGHT bearded man even if similar.',
  'EXPRESSION (CRITICAL — NEUTRAL): LEFT face must be neutral / calm — closed or gently relaxed mouth, no smile, no grin, no laugh, no frown, no scowl, no surprise. If <IMAGE_1> is smiling, frowning, or expressive, convert to a neutral expression while keeping identity. Match the calm look of the bearded man / girl in <IMAGE_0>.',
  'LIGHTING (CRITICAL — EVEN STUDIO MATCH): LEFT face/neck/hands: soft even studio-like light matching the bearded man / girl in <IMAGE_0>. FORBIDDEN: harsh split lighting, blown white forehead/nose hotspots, shiny plastic skin, selfie flash. Skin must look like real living skin.',
  'NECK (CRITICAL — MOST COMMON FAILURE — NEVER WHITE): The LEFT neck from jawline to collar MUST be living skin continuous with the LEFT face — same tone, undertone, pores/texture. FORBIDDEN: leaving the original mannequin neck white, porcelain, plaster, or tee-white under the chin. A face with a white neck is a FAILED edit — repaint the entire neck column before finishing.',
  'HANDS (CRITICAL — NEVER WHITE): Every LEFT hand/wrist/finger (including in pockets) MUST match the LEFT face skin tone. FORBIDDEN: mannequin-white, plaster, white gloves, white blobs into white pants/tee.',
  'HAIR: Match <IMAGE_1> hair style/color but COMPRESS hair into the mannequin head bound — hair must not enlarge the head silhouette past <IMAGE_0> mannequin.',
  'HATS (REQUIRED — REMOVE): Remove hats/caps/beanies; show natural hair. Do not enlarge head.',
  'HEADWEAR (CRITICAL — DEFAULT NONE): Do NOT add a bandana, wrap, durag, scarf, headband, or any headwear. Bare head / natural hair only UNLESS <IMAGE_1> clearly already wears a bandana/wrap/durag/scarf/headband — then keep that item only and recolor it to LEFT jacket rust-orange. NEVER invent headwear.',
  'IRIS (LEFT FIGURE ONLY — CRITICAL — LOCK TO <IMAGE_2>): LEFT BOTH irises MUST match <IMAGE_2> exactly — same amber / burnt-orange / Bitcoin-orange hue, saturation, brightness, AND radial iris fiber texture/detail from the close-up. Matte photorealistic, natural wetness OK. Eye color + iris texture come ONLY from <IMAGE_2> — never from <IMAGE_1> natural eye color. LEFT eyes must be complete (pupil + iris + sclera) — never blank/erased. Bearded man and girl keep ORIGINAL eye colors from <IMAGE_0> — never orange from <IMAGE_2>.',
  'NO GLOWING EYES (CRITICAL — ALL FIGURES): Eyes must be matte / natural photorealistic only. FORBIDDEN on anyone: glowing eyes, luminous pupils, light beams, bloom, neon, emissive/HDR eye glow, sci-fi shine.',
  'NO ERASED EYES (CRITICAL — ALL FIGURES): Nobody may have blank, white, missing, or destroyed eyes. Sam + girl eyes = <IMAGE_0>. LEFT eyes = full eyes with <IMAGE_2> iris color + texture.',
  'MAKEUP: LEFT only — female lipstick/eyeliner → Bitcoin orange; male/bare → no makeup. Sam/girl unchanged.',
  'GENDER FIT (CRITICAL — LEFT FIGURE ONLY): Infer sex presentation from <IMAGE_1>. IF female / feminine: restyle the LEFT orange jacket to a feminine cut (softer shoulder, tailored/fitted waist, feminine collar/zipper proportions) and give feminine body proportions under the jacket (shoulders, chest, waist) consistent with <IMAGE_1>. IF male / masculine: keep the orange jacket cut, tee, pants, and body proportions as in <IMAGE_0> (menswear / do not feminize). Never change Sam or the girl. Gender fit must NOT enlarge the LEFT head.',
  'JACKET COLOR (CRITICAL): LEFT jacket exact rust-orange / Bitcoin orange from <IMAGE_0> — gender fit may change cut/shape only, never hue.',
  'If unsure, change less — only the LEFT white mannequin regions. Prefer a slightly smaller head over any oversized head.',
].join(' ');

/**
 * Pass 2 — HEAD SIZE ONLY. <IMAGE_0> compose result, <IMAGE_1> original mannequin base.
 * Kept separate so iris/neck jobs cannot override scale.
 */
export const ALIEN_COMPOSE_HEAD_SIZE_FIX_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0>. ONLY job: fix LEFT head size. Change nothing else unless required for scale.',
  'HEAD SIZE (SOLE PRIORITY — CRITICAL): Compare LEFT orange-jacket head in <IMAGE_0> to the white mannequin head in <IMAGE_1>. If LEFT head (face + hair silhouette) is larger in width OR height vs shoulders/collar than the mannequin, SHRINK it now until it MATCHES <IMAGE_1> mannequin scale exactly. Keep identity and amber iris color while shrinking. Center on the same neck/collar as <IMAGE_1>.',
  'FORBIDDEN: leaving an oversized head, growing hair outside the mannequin bound, matching Sam’s head size instead of the mannequin.',
  'Do NOT change Sam or the girl. Do NOT change text, background, framing, or jacket color.',
].join(' ');

/**
 * Pass 3 — neck / hands / iris after head size is locked.
 * <IMAGE_0> sized result, <IMAGE_1> original base, <IMAGE_2> iris.
 */
export const ALIEN_COMPOSE_DETAIL_FIX_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0>. Change as little as possible. Do NOT enlarge the LEFT head — head size is already locked.',
  'IRIS FIX (LEFT ONLY — CRITICAL): LEFT BOTH irises MUST match <IMAGE_2> amber / burnt-orange hue AND radial fiber texture. Matte, NO glow. Sam + girl keep <IMAGE_1> eye colors.',
  'NECK FIX: If LEFT neck is white/mannequin, repaint jaw→collar to match face skin.',
  'HANDS: If any LEFT hand/wrist is still white, paint skin matching the face.',
  'SAM + GIRL EYE RESTORE: If Sam or girl eyes are blank/erased vs <IMAGE_1>, restore from <IMAGE_1>.',
  'NO GLOWING EYES. Do NOT enlarge LEFT head. Do NOT change text/background/framing.',
].join(' ');

/**
 * Wide 2:1 Personal Bitcoin Alien portrait.
 * <IMAGE_0> selfie identity, <IMAGE_1> iris style.
 */
export const ALIEN_PORTRAIT_PROMPT = [
  'PRIORITY ORDER (HIGHEST FIRST): (1) IRIS LOCK to <IMAGE_1>, (2) identity from <IMAGE_0>, (3) CREAM BACKGROUND, (4) soft even studio lighting, (5) front pose. Never sacrifice iris color for any other goal.',
  'Create a wide portrait (aspect 2:1) of the SAME person as <IMAGE_0> as their Personal Bitcoin Alien character.',
  'IRIS (MOST IMPORTANT — CRITICAL — LOCK TO <IMAGE_1>): BOTH irises MUST match <IMAGE_1> exactly — same amber / burnt-orange / Bitcoin-orange hue, saturation, brightness, and radial fiber texture/detail. Matte photorealistic, natural wetness OK. FORBIDDEN: brown, blue, green, hazel, black, gray, or any <IMAGE_0> eye color; glow; bloom; neon. If EITHER eye is not clearly amber/burnt-orange like <IMAGE_1>, the entire edit failed — fix the irises before anything else. Eye color + iris texture come ONLY from <IMAGE_1>.',
  'NO GLOWING EYES (CRITICAL): Eyes must be matte / natural photorealistic only. FORBIDDEN: glowing eyes, luminous pupils, light beams, bloom, neon, emissive/HDR eye glow, sci-fi shine.',
  'BACKGROUND (CRITICAL — CREAM): Plain solid cream background edge-to-edge behind the subject — warm cream / ivory / off-white cream (not pure white, not beige-tan wall, not orange). Soft even light on the cream field. FORBIDDEN: orange wash, #F88D00, gray, charcoal, busy scenes, outdoors, windows, textured walls that read beige/taupe instead of cream.',
  'IDENTITY ONLY FROM <IMAGE_0>: Use <IMAGE_0> ONLY for face identity (shape, features, skin tone, hair). Discard <IMAGE_0>\'s lighting, camera angle, pose, background, and eye color.',
  'POSE (CRITICAL — FACE FORWARD): Head and face straight-on / front view. Eyes into camera. FORBIDDEN: 3/4 turn, looking left/right, profile, chin-down selfie angle. If <IMAGE_0> is turned, straighten to full frontal.',
  'EXPRESSION (CRITICAL — NEUTRAL): Neutral / calm mouth. If <IMAGE_0> is expressive, convert to neutral while keeping identity.',
  'LIGHTING (CRITICAL — SOFT EVEN STUDIO): Ignore <IMAGE_0> photo lighting. Soft even indoor studio light on face/neck — flat gentle key + soft fill. FORBIDDEN: outdoor sun, golden-hour, cinematic drama, ring light, phone selfie flash, shiny plastic hotspots.',
  'MAKEUP: IF <IMAGE_0> appears female / already wears lipstick or eyeliner, Bitcoin-orange lipstick/eyeliner. IF male / bare-faced, do NOT add makeup.',
  'HATS (REQUIRED — REMOVE): Remove hats/caps/beanies; show natural hair.',
  'HEADWEAR (CRITICAL — DEFAULT NONE): Do NOT invent bandanas/wraps. Only keep if clearly in <IMAGE_0>, then recolor to jacket rust-orange.',
  'WARDROBE: rust-orange zip/button jacket over a light tee (no poster text, no other people, no necklace required).',
  'GENDER FIT: Feminine <IMAGE_0> → feminine orange jacket cut + proportions. Masculine → menswear jacket cut. Do not feminize males.',
  'JACKET COLOR (CRITICAL): Exact rust-orange / Bitcoin orange wardrobe hue.',
  'Head-and-shoulders framing, wide 2:1. No extra text, logos, or watermarks.',
].join(' ');

/** Second pass: iris + cream background + studio lighting + frontal pose on My Character portrait. */
export const ALIEN_PORTRAIT_STUDIO_FIX_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0>. Keep the same person and jacket.',
  'IRIS (MOST IMPORTANT): BOTH irises MUST match <IMAGE_1> amber/burnt-orange hue + radial texture — never brown/blue/green/selfie eye color. Matte, NO glow.',
  'NO GLOWING EYES (CRITICAL): Keep eyes matte — no glow, bloom, neon, luminous pupils, or emissive shine.',
  'BACKGROUND FIX (CRITICAL — CREAM): Replace any wrong background with a plain solid cream / ivory / off-white cream field edge-to-edge. FORBIDDEN: orange, gray, beige-tan wall, busy scene.',
  'LIGHTING FIX (CRITICAL — SOFT EVEN STUDIO): Relight face/neck with soft even indoor studio light. REMOVE outdoor sun, golden-hour, selfie-flash, cinematic lighting.',
  'POSE FIX (CRITICAL): Full front-facing — straight at camera, no 3/4 turn left or right. Eyes forward.',
  'EXPRESSION: Keep neutral / calm.',
].join(' ');

/**
 * Wide SEASON ONE banner — sole mannequin only (no other cast).
 * <IMAGE_0> SeasonOne banner, <IMAGE_1> selfie, <IMAGE_2> iris.
 */
export const ALIEN_SEASONONE_PROMPT = [
  'PRIORITY ORDER (HIGHEST FIRST): (1) IRIS LOCK to <IMAGE_2>, (2) locked canvas / sole figure, (3) identity from <IMAGE_1>, (4) everything else. Never sacrifice iris color or texture.',
  'EDIT TASK (not a new generation): Start from <IMAGE_0> and change as little as possible. Put <IMAGE_1>’s face on the sole center orange-jacket figure — NOT a new poster.',
  'LOCKED CANVAS from <IMAGE_0>: same ultra-wide banner, same beige wall, same “SEASON” (left) and “ONE” (right) lettering, same framing/aspect, same soft studio light. ONE figure only — the center orange-jacket person. Do NOT invent extra people.',
  'Keep gold triangular / “A” necklace, white tee, hands-in-pockets pose, jacket hue from <IMAGE_0>.',
  'IRIS (MOST IMPORTANT — CRITICAL — LOCK TO <IMAGE_2>): BOTH irises MUST match <IMAGE_2> exactly — same amber / burnt-orange / Bitcoin-orange hue, saturation, brightness, AND radial iris fiber texture/detail from the close-up. Matte photorealistic, natural wetness OK. Eye color + iris texture come ONLY from <IMAGE_2>. FORBIDDEN: brown, blue, green, hazel, black, gray, or any <IMAGE_1> natural eye color; glow; bloom; neon. If EITHER eye is not clearly amber/burnt-orange with <IMAGE_2> fiber texture, the entire edit FAILED — fix irises before anything else. Complete eyes required (pupil + iris + sclera) — never blank/erased.',
  'NO GLOWING EYES (CRITICAL): Matte eyes only. FORBIDDEN: glow, bloom, neon, luminous pupils, emissive/HDR eye shine, sci-fi shine.',
  'IDENTITY: Photorealistic likeness of <IMAGE_1> — face, hair, skin, age — on that sole figure only. Do NOT copy <IMAGE_1> eye color.',
  'EXPRESSION (CRITICAL — NEUTRAL): Neutral / calm face. If <IMAGE_1> is expressive, convert to neutral while keeping identity.',
  'LIGHTING: Soft even light matching <IMAGE_0>. No selfie flash, no plastic shine.',
  'HATS (REMOVE) / HEADWEAR DEFAULT NONE: No invented bandanas/wraps; natural hair from <IMAGE_1> unless <IMAGE_1> already wears headwear (then recolor to jacket rust-orange).',
  'MAKEUP: Female/lipstick in <IMAGE_1> → Bitcoin-orange lipstick/eyeliner. Male/bare → no makeup.',
  'BODY LOCK (CRITICAL — NO BODY RECOMPOSE): Keep jacket cut, shoulders, chest, waist, tee, pants/pose, and overall body proportions EXACTLY as in <IMAGE_0>. Do NOT feminize, masculinize, reshape, slim, widen, or restyle the body or jacket. Face/skin/hair/iris only — no mannequin head-size or neck rules (same as My Character portrait).',
  'JACKET COLOR (CRITICAL): Exact rust-orange / Bitcoin orange from <IMAGE_0> — never change hue or cut.',
  'FAILURE CHECK: If irises are not amber like <IMAGE_2> with matching fiber texture, OR eyes glow, OR body/jacket changed — FAILED; fix irises first, then the rest.',
].join(' ');

/**
 * Second-pass Season One: iris harden; keep sole-figure layout.
 * No head-size / neck mannequin locks (same freedom as My Character portrait).
 * <IMAGE_0> first compose result, <IMAGE_1> original seasonone-base, <IMAGE_2> iris.
 */
export const ALIEN_SEASONONE_FIX_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0>. Change as little as possible.',
  'IRIS FIX (MOST IMPORTANT — CRITICAL — HIGHEST PRIORITY): BOTH irises MUST match <IMAGE_2> exactly — amber / burnt-orange / Bitcoin-orange hue, saturation, brightness, AND radial fiber texture/detail. If either eye drifted to brown/blue/green/hazel/selfie color or looks blank, REPAINT both irises from <IMAGE_2> now before anything else. Matte photorealistic only — NO glow, bloom, neon, or emissive shine. Eye color + texture come ONLY from <IMAGE_2>.',
  'NO GLOWING EYES (CRITICAL): Matte only.',
  'SOLE FIGURE: Keep ONE person only — the center orange-jacket figure. Do NOT add other people. Keep “SEASON” / “ONE” and beige wall from <IMAGE_1>.',
  'BODY LOCK: Jacket cut and body proportions must match <IMAGE_1> — do not reshape the body.',
  'Do NOT apply mannequin head-size or white-neck rules — face/iris only, like My Character.',
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

  // Pass 2: head size ONLY vs original mannequin (no iris — scale must win).
  const firstJpeg = await toCleanJpeg(firstPass, 2048);
  const sizedPass = await grokImageEdit({
    prompt: ALIEN_COMPOSE_HEAD_SIZE_FIX_PROMPT,
    images: [
      { url: toDataUri(firstJpeg), type: 'image_url' },
      { url: toDataUri(baseJpeg), type: 'image_url' },
    ],
    aspectRatio: '1:1',
  });
  const sizedJpeg = await toCleanJpeg(sizedPass, 2048);

  // Pass 3: iris / neck / hands without touching head scale.
  return grokImageEdit({
    prompt: ALIEN_COMPOSE_DETAIL_FIX_PROMPT,
    images: [
      { url: toDataUri(sizedJpeg), type: 'image_url' },
      { url: toDataUri(baseJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
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
 * Order: selfie identity, iris ref.
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

  const firstJpeg = await toCleanJpeg(firstPass, 2048);
  return grokImageEdit({
    prompt: [
      ALIEN_PORTRAIT_STUDIO_FIX_PROMPT,
      'IRIS REF: Match BOTH irises to <IMAGE_1> amber/burnt-orange + texture exactly — highest priority. NO GLOWING EYES — matte only.',
    ].join(' '),
    images: [
      { url: toDataUri(firstJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
    ],
    aspectRatio: '2:1',
  });
}

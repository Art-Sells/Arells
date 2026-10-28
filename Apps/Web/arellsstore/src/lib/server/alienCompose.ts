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
  'EXPRESSION (CRITICAL — WARM SMILE): LEFT face must show a natural, friendly smile — soft open or closed-mouth smile with slight eye warmth (not a grimace, not a wide laugh, not teeth-bared cartoon grin). If <IMAGE_1> is frowning, scowling, or blank, convert to this warm smile while keeping identity. NOT a frown, scowl, surprise, or flat neutral mouth.',
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
 * <IMAGE_0> SeasonOne banner, <IMAGE_1> selfie, <IMAGE_2> iris-ref.jpg.
 */
export const ALIEN_SEASONONE_PROMPT = [
  'PRIORITY ORDER (ABSOLUTE): (1) BOTH irises MUST be painted from <IMAGE_2> iris-ref ONLY — amber/burnt-orange Bitcoin orange, never brown. (2) locked canvas / sole figure from <IMAGE_0>. (3) face identity from <IMAGE_1> EXCEPT eye color. (4) everything else.',
  'EDIT TASK (not a new generation): Start from <IMAGE_0>. Put <IMAGE_1>’s face on the sole center orange-jacket figure — NOT a new poster.',
  'LOCKED CANVAS from <IMAGE_0>: same ultra-wide banner, same beige wall, same “SEASON” (left) and “ONE” (right) lettering, same framing/aspect, same soft studio light. ONE figure only — the center orange-jacket person. Do NOT invent extra people.',
  'Keep gold triangular / “A” necklace, white tee, hands-in-pockets pose, jacket hue from <IMAGE_0>.',
  'IRIS LOCK TO <IMAGE_2> (CRITICAL — BANNER FAILS WITHOUT THIS): Paint BOTH left and right irises using ONLY <IMAGE_2>. Copy hue, saturation, brightness, AND radial iris fiber texture from <IMAGE_2> into the banner face. Eye color must read as clear amber / burnt-orange / #F88D00-family Bitcoin orange — the SAME orange as <IMAGE_2>, NOT dark brown, chocolate, hazel-brown, or selfie-brown from <IMAGE_1>. FORBIDDEN: brown irises, coffee irises, muddy irises, any <IMAGE_1> natural eye color, glow, bloom, neon. If eyes look brown at all, the edit FAILED — repaint irises from <IMAGE_2> before finishing. Complete eyes (pupil + iris + sclera) required.',
  'NO GLOWING EYES (CRITICAL): Matte photorealistic only.',
  'IDENTITY: Photorealistic likeness of <IMAGE_1> — face shape, hair, skin, age — on that sole figure only. NEVER transfer <IMAGE_1> eye color.',
  'EXPRESSION (CRITICAL — NEUTRAL): Neutral / calm face. If <IMAGE_1> is expressive, convert to neutral while keeping identity.',
  'LIGHTING: Soft even light matching <IMAGE_0>. No selfie flash, no plastic shine.',
  'HATS (REMOVE) / HEADWEAR DEFAULT NONE: No invented bandanas/wraps; natural hair from <IMAGE_1> unless <IMAGE_1> already wears headwear (then recolor to jacket rust-orange).',
  'MAKEUP: Female/lipstick in <IMAGE_1> → Bitcoin-orange lipstick/eyeliner. Male/bare → no makeup.',
  'BODY LOCK (CRITICAL — NO BODY RECOMPOSE): Keep jacket cut, shoulders, chest, waist, tee, pants/pose, and overall body proportions EXACTLY as in <IMAGE_0>. Face/skin/hair/iris only.',
  'JACKET COLOR (CRITICAL): Exact rust-orange / Bitcoin orange from <IMAGE_0>.',
  'FINAL GATE: Zoom the eyes — if either iris is brown instead of <IMAGE_2> amber/burnt-orange, FAILED; fix irises from <IMAGE_2> now.',
].join(' ');

/**
 * Second-pass Season One: layout + identity; iris still from <IMAGE_2>.
 * <IMAGE_0> first compose, <IMAGE_1> original seasonone-base, <IMAGE_2> iris-ref.
 */
export const ALIEN_SEASONONE_FIX_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0>. Change as little as possible except eyes.',
  'IRIS FIX FROM <IMAGE_2> (SOLE JOB IF EYES ARE WRONG): BOTH irises MUST match <IMAGE_2> iris-ref — amber / burnt-orange / Bitcoin-orange hue + radial fiber texture. Brown / selfie eye color from the upload is FORBIDDEN. If either iris is brown, hazel-brown, or not clearly orange like <IMAGE_2>, REPAINT both irises from <IMAGE_2> immediately. Matte only — NO glow.',
  'NO GLOWING EYES.',
  'SOLE FIGURE: Keep ONE person — center orange-jacket figure. Keep “SEASON” / “ONE” and beige wall from <IMAGE_1>.',
  'BODY LOCK: Jacket cut and body proportions must match <IMAGE_1>.',
].join(' ');

/**
 * Third-pass Season One: IRIS ONLY. Portrait-style harden — iris is <IMAGE_1> here.
 * <IMAGE_0> banner after fix, <IMAGE_1> iris-ref.jpg (only reference allowed for eye color).
 */
export const ALIEN_SEASONONE_IRIS_ONLY_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0> (Season One banner). Change NOTHING except the two irises on the center figure’s face.',
  'IRIS ONLY — LOCK TO <IMAGE_1>: Repaint BOTH irises to match <IMAGE_1> iris-ref exactly — amber / burnt-orange / Bitcoin-orange hue, saturation, brightness, radial fiber texture. This is the ONLY allowed eye color source.',
  'FORBIDDEN: brown, dark brown, chocolate, hazel, blue, green, gray, black, selfie eye color, glow, bloom, neon.',
  'Do NOT change face shape, hair, skin, jacket, necklace, hands, text “SEASON”/“ONE”, beige wall, framing, or expression beyond the iris paint.',
  'If the eyes still look brown after this pass, the edit failed — repaint again from <IMAGE_1> until they read unmistakably orange like <IMAGE_1>.',
].join(' ');

/**
 * Metaposter / guest metaloop — image-to-video from composed metaposter.
 * Fade in/out is applied in playback code, not here.
 */
export const ALIEN_METALOOP_VIDEO_PROMPT = [
  '15-second video starting from this exact original image. Critical motion: the figure on the LEFT walks straight FORWARD toward the camera only — zero left walk, zero right walk, no drifting sideways. From 0:00 to 0:04 it walks forward getting slightly closer; at 0:04 it stops and stays with only slight natural body movements until 0:15. Figure never leaves the frame. Keep the LEFT figure’s face identity and hair exactly as in the input. No duplicating anyone. Locked camera.',
  'TITLES / WORDS NEVER BLOCK THE FACE (CRITICAL — #1 DEPTH FAILURE TO AVOID): EVERY frame, the LEFT figure’s face, head, hair, and eyes MUST stay fully visible and unobstructed. The orange title stack (“THE BITCOIN ALIEN RACE”, “Season One”, “now playing”) is ALWAYS behind the LEFT figure in depth — never on top of the face, never cutting across eyes/nose/mouth/forehead, never floating over the head. If the figure overlaps lettering, the FIGURE covers the words (like a real person standing in front of a wall poster) — words NEVER cover the figure. FORBIDDEN: text over face, title burn-in on skin, letters sliding in front of the head, captions/overlays, any on-top typography. If any word blocks the LEFT face even slightly, the video FAILED.',
  'IRIS LOCK (LEFT FIGURE — CRITICAL): BOTH LEFT irises MUST stay the exact same amber / burnt-orange / Bitcoin-orange hue, saturation, brightness, AND radial iris fiber texture as in the input still — every frame from 0:00 to 0:15, including during blinks and smile. Copy the eye color FROM THE INPUT IMAGE ONLY. FORBIDDEN: brown, dark brown, chocolate, hazel, blue, green, gray, black, muddy, or any natural/selfie eye color; drifting toward brown as the face gets closer; desaturating orange to hazel; rewriting the irises. Matte photorealistic only — NO glow, bloom, neon, luminous pupils, light beams, or emissive/HDR eye shine. If either LEFT iris looks brown or not clearly amber/orange like the input still, the video FAILED. Bearded man and girl keep THEIR original non-orange eye colors from the input — never paint them amber.',
  'EXPRESSION (LEFT FIGURE): Keep a natural friendly smile the whole clip — soft warm smile matching the input still (or a gentle smile if the still is flat); slight smile variation OK, but never go blank/neutral, frown, or a huge laugh. Natural blinks throughout (occasional, realistic — not rapid fluttering, not staring without blinking). At the same time the man gently adjusts the girl and adjusts his sweater/jacket. Man always holds the girl at the same height.',
].join(' ');

/**
 * Season One banner loop — image-to-video from composed Season One still.
 * 1.5s fade out / 1.5s fade in (through black) are applied in playback code, not here.
 */
export const ALIEN_SEASONONE_VIDEO_PROMPT = [
  'IMAGE-TO-VIDEO: Animate ONLY the sole center figure from this exact input Season One banner. Pixel-lock EVERY frame to the input still’s framing — same ultra-wide canvas, beige wall, “SEASON” (left) and “ONE” (right) lettering fully readable, jacket, tee, necklace, hands-in-pockets pose.',
  'STAGNANT FRAME (CRITICAL — ABSOLUTE #1 — NEVER BREAK): The camera is FROZEN for the entire clip. Zero zoom in, zero zoom out, zero push-in, zero pull-back, zero dolly, zero pan, zero tilt, zero reframe, zero crop change, zero Ken Burns, zero slow drift. Frame 0 and the last frame MUST match the input still’s exact crop and scale. If the background, letters, or walls appear to grow, shrink, or slide at all, the video FAILED.',
  'STATION LOCK (CRITICAL): The person MUST stay exactly in the silhouette slot from the input — between “SEASON” and “ONE”, same scale, same vertical/horizontal position, same distance from camera. FORBIDDEN: recentering the body, walking forward/closer, drifting left/right, growing larger, or covering/obscuring any part of the “SEASON” or “ONE” letters. If shoulders/chest/head hide lettering that was visible in the input, the edit FAILED — keep the body smaller and parked in the original silhouette bound.',
  'No extra people. No text changes. No wardrobe changes. No morphing identity. Keep amber / burnt-orange irises matte (no glow).',
  'FACE / HEAD MOTION ONLY (subtle, photorealistic, SILENT — no speech, no laughter audio, no sound of any kind): Body below the neck stays still in the silhouette slot. Camera stays stagnant while ONLY the face moves — (1) glance left, (2) glance right, (3) return to camera and smile softly, (4) laugh (visible laughter only — mouth/eyes/shoulders, completely silent; shoulders may move slightly but must not enlarge or recenter the body or imply a camera move), (5) settle back to the original neutral expression facing camera. Natural blinks OK. No headwear changes.',
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

/**
 * Season One banners are ~4.18:1 — wider than Grok video's max (5:2 / 21:9).
 * Letterbox onto 5:2 with banner-beige so image-to-video is accepted; playback
 * object-fit:cover crops the pads back out in the ultra-wide frame.
 */
async function toSeasonOneVideoJpeg(buffer: Buffer): Promise<Buffer> {
  const MAX_W = 1920;
  const RATIO = 5 / 2;
  const base = sharp(buffer, { failOn: 'none' }).rotate();
  const meta = await base.metadata();
  const srcW = meta.width || 0;
  const srcH = meta.height || 0;
  if (srcW < 32 || srcH < 32) {
    return toCleanJpeg(buffer, MAX_W);
  }

  const fitted = await sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({
      width: MAX_W,
      height: Math.round(MAX_W / RATIO),
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toColorspace('srgb')
    .jpeg({ quality: 95, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  const fw = fitted.info.width;
  const fh = fitted.info.height;
  const outW = Math.max(fw, Math.round(fh * RATIO));
  const outH = Math.max(fh, Math.round(fw / RATIO));
  // Beige wall approx from Season One banner.
  const beige = { r: 214, g: 196, b: 168 };

  return sharp({
    create: {
      width: outW,
      height: outH,
      channels: 3,
      background: beige,
    },
  })
    .composite([
      {
        input: fitted.data,
        left: Math.max(0, Math.round((outW - fw) / 2)),
        top: Math.max(0, Math.round((outH - fh) / 2)),
      },
    ])
    .jpeg({ quality: 95, mozjpeg: true })
    .toBuffer();
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

/** Ultra-wide SEASON ONE banner with mannequin replaced + iris-ref locked. */
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

  // Second pass: layout harden + iris from iris-ref (<IMAGE_2>).
  const firstJpeg = await toCleanJpeg(firstPass, 4561);
  const secondPass = await grokImageEdit({
    prompt: ALIEN_SEASONONE_FIX_PROMPT,
    images: [
      { url: toDataUri(firstJpeg), type: 'image_url' },
      { url: toDataUri(baseJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
    ],
    aspectRatio: 'auto',
  });

  // Third pass: IRIS ONLY — iris-ref as <IMAGE_1> so it cannot be ignored on the wide banner.
  const secondJpeg = await toCleanJpeg(secondPass, 4561);
  return grokImageEdit({
    prompt: ALIEN_SEASONONE_IRIS_ONLY_PROMPT,
    images: [
      { url: toDataUri(secondJpeg), type: 'image_url' },
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

const VIDEO_POLL_MS = 5000;
const VIDEO_POLL_MAX_MS = 8 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Image-to-video via xAI Grok Imagine (async generations + poll).
 * Default 480p; launch metaloop uses 720p. GROK_VIDEO_RESOLUTION overrides all.
 */
export async function generateAlienImageToVideo(args: {
  imageJpeg: Buffer;
  prompt: string;
  durationSeconds: number;
  /** When true, send args.imageJpeg as-is (already prepared JPEG). */
  skipResize?: boolean;
  /** Grok resolution: 480p | 720p. Default 480p. */
  resolution?: '480p' | '720p';
}): Promise<Buffer> {
  const apiKey = grokApiKeyOrThrow();
  const model =
    process.env.GROK_VIDEO_MODEL?.trim() || 'grok-imagine-video-1.5-lite';
  const resolution =
    process.env.GROK_VIDEO_RESOLUTION?.trim() || args.resolution || '480p';
  const duration = Math.max(1, Math.min(15, Math.round(args.durationSeconds)));
  const imageJpeg = args.skipResize
    ? args.imageJpeg
    : await toCleanJpeg(args.imageJpeg, 2048);

  const startRes = await fetch('https://api.x.ai/v1/videos/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt: args.prompt,
      image: { url: toDataUri(imageJpeg) },
      duration,
      resolution,
    }),
  });

  const startRaw = await startRes.text();
  let startJson: { request_id?: string; error?: { message?: string }; message?: string };
  try {
    startJson = JSON.parse(startRaw) as typeof startJson;
  } catch {
    throw new Error(`Grok video start returned non-JSON (${startRes.status})`);
  }
  if (!startRes.ok || !startJson.request_id) {
    throw new Error(
      startJson.error?.message || startJson.message || `Grok video start failed (${startRes.status})`
    );
  }

  const requestId = startJson.request_id;
  const deadline = Date.now() + VIDEO_POLL_MAX_MS;
  while (Date.now() < deadline) {
    await sleep(VIDEO_POLL_MS);
    const pollRes = await fetch(`https://api.x.ai/v1/videos/${encodeURIComponent(requestId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const pollRaw = await pollRes.text();
    let pollJson: {
      status?: string;
      video?: { url?: string };
      error?: { message?: string };
      message?: string;
    };
    try {
      pollJson = JSON.parse(pollRaw) as typeof pollJson;
    } catch {
      throw new Error(`Grok video poll returned non-JSON (${pollRes.status})`);
    }
    if (!pollRes.ok) {
      throw new Error(
        pollJson.error?.message || pollJson.message || `Grok video poll failed (${pollRes.status})`
      );
    }
    const status = (pollJson.status || '').toLowerCase();
    if (status === 'done' || status === 'completed' || status === 'succeeded') {
      const url = pollJson.video?.url;
      if (!url) throw new Error('Grok video done but missing url');
      const vidRes = await fetch(url);
      if (!vidRes.ok) throw new Error(`Failed to download Grok video (${vidRes.status})`);
      return Buffer.from(await vidRes.arrayBuffer());
    }
    if (status === 'failed' || status === 'error' || status === 'cancelled') {
      throw new Error(pollJson.error?.message || pollJson.message || `Grok video ${status}`);
    }
  }
  throw new Error('Grok video generation timed out');
}

export async function generateAlienMetaloopVideo(composedJpeg: Buffer): Promise<Buffer> {
  return generateAlienImageToVideo({
    imageJpeg: composedJpeg,
    prompt: ALIEN_METALOOP_VIDEO_PROMPT,
    durationSeconds: 15,
    resolution: '720p',
  });
}

export async function generateAlienSeasonOneLoopVideo(seasonOneJpeg: Buffer): Promise<Buffer> {
  // Letterbox to a Grok-supported aspect before i2v (raw banner is too wide).
  const videoStill = await toSeasonOneVideoJpeg(seasonOneJpeg);
  return generateAlienImageToVideo({
    imageJpeg: videoStill,
    prompt: ALIEN_SEASONONE_VIDEO_PROMPT,
    durationSeconds: 10,
    skipResize: true,
  });
}

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

/**
 * Bundled under `src/server-data/` so Amplify/Next file tracing packs them into the
 * API Lambda. `public/...` alone is often missing at runtime (`ENOENT` under `/tmp/app/public`).
 */
const ALIEN_COMPOSE_DATA_DIR = path.join('src', 'server-data', 'alien-compose');

/** Launch / share metaposter base (white mannequin). */
export const ALIEN_COMPOSE_BASE_REL = path.join(ALIEN_COMPOSE_DATA_DIR, 'metaposter-base.jpg');
/** Wide SEASON ONE banner base (white mannequin between SEASON / ONE). */
export const ALIEN_SEASONONE_BASE_REL = path.join(ALIEN_COMPOSE_DATA_DIR, 'seasonone-base.jpg');
/** Permanent iris color/detail reference (not tmp). */
export const ALIEN_COMPOSE_IRIS_REL = path.join(ALIEN_COMPOSE_DATA_DIR, 'iris-ref.jpg');
/**
 * Default My Character profile plate — solid bright Bitcoin-orange field behind white mannequin.
 * Portrait wardrobe / iris HUE lock (not scene background).
 */
export const ALIEN_PORTRAIT_COLOR_REL = path.join(ALIEN_COMPOSE_DATA_DIR, 'portrait-color.jpg');

/** Legacy public/ paths — still tried if server-data is missing locally. */
const ALIEN_COMPOSE_PUBLIC_FALLBACKS: Record<string, string> = {
  [path.basename(ALIEN_COMPOSE_BASE_REL)]: path.join(
    'public',
    'images',
    'banners',
    'assets',
    'crypto',
    'Bitcoin',
    'AlienCompose',
    'metaposter-base.jpg'
  ),
  [path.basename(ALIEN_SEASONONE_BASE_REL)]: path.join(
    'public',
    'images',
    'banners',
    'assets',
    'crypto',
    'Bitcoin',
    'AlienCompose',
    'seasonone-base.jpg'
  ),
  [path.basename(ALIEN_COMPOSE_IRIS_REL)]: path.join(
    'public',
    'images',
    'banners',
    'assets',
    'crypto',
    'Bitcoin',
    'AlienCompose',
    'iris-ref.jpg'
  ),
  [path.basename(ALIEN_PORTRAIT_COLOR_REL)]: path.join(
  'public',
  'images',
  'banners',
  'assets',
  'crypto',
  'Bitcoin',
  'Posters',
  'personalalienplaceholder.jpg'
  ),
};

/**
 * Grok multi-image edit: <IMAGE_0> base poster, <IMAGE_1> selfie (identity/skin),
 * <IMAGE_2> My Character portrait face (LEFT iris color/texture/detail ONLY).
 * Sam + girl iris color/detail stay locked to <IMAGE_0>.
 */
export const ALIEN_COMPOSE_PROMPT = [
  'PRIORITY ORDER (ABSOLUTE — SINGLE PASS): (1) LEFT identity + skin albedo from <IMAGE_1>. (2) LEFT BOTH iris color/texture/detail LOCKED to <IMAGE_2> portrait face ONLY. (3) Sam + girl iris color/detail LOCKED to <IMAGE_0>. (4) Sam + girl otherwise untouched from <IMAGE_0>. (5) locked square launch canvas / titles from <IMAGE_0>. (6) everything else.',
  'EDIT TASK (not a new generation): Start from <IMAGE_0> and change as little as possible.',
  'OUTPUT MUST still be the same square Launch / “now playing” metaposter as <IMAGE_0> — same beige wall, same left-side orange title stack (“THE BITCOIN ALIEN RACE” / “Season One” / “now playing”), same framing, same lighting family, same rust-orange jacket / white tee / white pants on the LEFT white-mannequin figure (jacket cut may become feminine if <IMAGE_1> is female — see GENDER FIT), same gold A / triangular necklace.',
  'IDENTITY LOCK LEFT (CRITICAL — ABSOLUTE #1): The LEFT orange-jacket face MUST match <IMAGE_1> — same face shape, eyes spacing, nose, mouth, lips, brow, cheekbones, jaw, chin, skin tone, skin texture, age, hairline, hair style/color, facial hair. Clear likeness of the uploaded adult. Eye COLOR comes from <IMAGE_2>, not <IMAGE_1>. FORBIDDEN: inventing a different face, blending with anyone else, or replacing LEFT with the RIGHT bearded man’s (Sam’s) face, beard, hair, or bone structure. If LEFT is not clearly the same person as <IMAGE_1>, the edit FAILED — repaint LEFT from <IMAGE_1> before finishing.',
  'LEFT EYES (CRITICAL — IRIS LOCK TO <IMAGE_2> PORTRAIT): Paint BOTH LEFT irises using ONLY the eyes on <IMAGE_2> (Personal Bitcoin Alien portrait) — copy iris hue, saturation, brightness, AND radial iris fiber texture/detail from <IMAGE_2>. Typically clear amber / burnt-orange / Bitcoin-orange like the portrait. Complete eyes (pupil + iris + sclera). FORBIDDEN: <IMAGE_1> selfie/natural eye color; brown/hazel/blue/green selfie irises; inventing a new eye color; glow, bloom, neon. If LEFT irises do not match <IMAGE_2>, FAILED — repaint from <IMAGE_2>.',
  'SKIN ALBEDO LOCK (CRITICAL — LEFT FACE / NECK / HANDS — ABSOLUTE #2): LEFT skin matches <IMAGE_1> — same complexion, undertone, lightness/darkness, warmth/coolness, freckles/moles, pores, and surface texture. Face, neck, and hands = ONE continuous living complexion from <IMAGE_1> only. Compare LEFT face brightness side-by-side to <IMAGE_1>’s face: if LEFT looks lighter OR darker OR redder OR muddier than <IMAGE_1>, FAILED — repaint from <IMAGE_1>. FORBIDDEN: matching LEFT exposure to Sam / the companion / the beige wall; lightening OR darkening vs <IMAGE_1>; warming/cooling; plastic/mannequin skin; borrowing Sam’s or the companion’s complexion; crushing medium/deep/Black skin charcoal/muddy; face darker than neck (classic failure). Soft scene light may hit the jacket/wall — NEVER rewrite LEFT skin albedo to “fit” that light.',
  'IDENTITY LOCK RIGHT / SEPARATION (CRITICAL): LEFT = <IMAGE_1> only. RIGHT Sam + companion = <IMAGE_0> only. Two separate people always. NEVER clone Sam onto LEFT. NEVER clone <IMAGE_1> onto Sam. NEVER twin / mirror / average the two adults.',
  'SAM + COMPANION LOCK (CRITICAL — DO NOT TOUCH): The bearded man and the smaller companion figure already on the RIGHT in <IMAGE_0> must stay identical to <IMAGE_0> — faces, skin, hair, clothing, hands, lighting. Do not invent or replace them.',
  'SAM + COMPANION IRIS LOCK (CRITICAL — ABSOLUTE): Sam and the companion MUST keep their EXACT iris colors, saturation, brightness, and iris fiber/detail from <IMAGE_0> — do NOT recolor, orange-tint, amber-shift, brighten, or rewrite their eyes. Complete open living eyes — pupils, irises, sclera, eyelids, lashes as in <IMAGE_0>. FORBIDDEN: blank/white-out/missing/melted eyes; painting their irises amber/orange/glowing; transferring <IMAGE_1> eye color onto them. If their eyes drift vs <IMAGE_0>, FAILED — restore from <IMAGE_0>.',
  'TEXT: Copy on-image lettering from <IMAGE_0> exactly. Do NOT invent premiere dates or new words.',
  'Replace ONLY the featureless matte-white silhouette head (and any white neck/hands/skin) on the LEFT mannequin figure in the orange jacket with <IMAGE_1>’s locked identity. Do NOT replace the bearded man or the companion. Do NOT fill the white silhouette with Sam’s face from the RIGHT.',
  'HEAD SIZE (CRITICAL — #1 CONSTRAINT AFTER CANVAS): LEFT head + hair MUST be ~5% LARGER than the white mannequin head in <IMAGE_0> (≈1.05× mannequin width and chin-to-crown). Measure vs orange-jacket shoulders / collar. Target: slightly bigger than the mannequin — NOT 1:1, NOT dramatically oversized vs Sam. FORBIDDEN: matching mannequin 1:1 (too small), shrinking into the mannequin bound, OR growing far past ~5% (big hair that blows past the 1.05× target). Center on the same neck/collar as <IMAGE_0>. A LEFT head at mannequin size or much larger than ~5% = FAILED edit.',
  'IDENTITY (LEFT MANNEQUIN ONLY): Apply the IDENTITY LOCK LEFT above at the ~5% larger head-size target. <IMAGE_1> is the sole identity/skin source for LEFT; <IMAGE_2> is the sole iris source.',
  'EXPRESSION (CRITICAL — NEUTRAL): LEFT face must be neutral / calm — relaxed mouth, no smile, no frown. If <IMAGE_1> is smiling, laughing, frowning, scowling, or expressive, convert to this calm neutral while keeping identity. Smile is ONLY for the video loop, never this still. NOT a smile, grin, laugh, frown, scowl, or surprise.',
  'HEAD TILT (CRITICAL — LEFT — NO RIGHT TILT): LEFT head must be upright / level — ears even, chin centered over the collar, no lean. FORBIDDEN: tilting the head to the RIGHT (ear toward right shoulder), cocking, or rolling the face clockwise. If <IMAGE_1> is tilted right, straighten to upright while keeping identity. A RIGHT-tilted LEFT head = FAILED edit — straighten before finishing.',
  'LIGHTING (CRITICAL — MATCH THE SETTING): Light the LEFT character to match <IMAGE_0>’s scene lighting exactly — same soft even key/fill direction, intensity, color temperature, and shadow softness as Sam/girl and the beige wall already have in <IMAGE_0>. LEFT must look like they were photographed in that same room under the same lights. FORBIDDEN: selfie flash, outdoor sun, golden-hour, ring light, cinematic drama, plastic hotspots, or a differently lit “pasted-on” face. SKIN ALBEDO still locks to <IMAGE_1> while matching that scene light — do NOT bleach/crush complexion to match Sam/girl skin; only match the lighting, not their undertone.',
  'NECK (CRITICAL — NEVER WHITE — MUST MATCH FACE + <IMAGE_1>): The LEFT neck from jawline to collar MUST be living skin continuous with the LEFT face — same tone, undertone, lightness, pores/texture as <IMAGE_1> AND the face. FORBIDDEN: mannequin-white neck; porcelain neck under a darker face; lightening the neck while darkening the face (or the reverse). Face and neck must read as the same person as <IMAGE_1>. Mismatched face/neck brightness = FAILED — repaint entire neck column AND face from <IMAGE_1>.',
  'HANDS (CRITICAL — NEVER WHITE): Every LEFT hand/wrist/finger (including in pockets) MUST match the LEFT face / <IMAGE_1> skin tone, texture, AND lightness exactly. FORBIDDEN: mannequin-white, plaster, white gloves, white blobs into white pants/tee, lighter/darker hands than the face / <IMAGE_1>.',
  'HAIR: Match <IMAGE_1> hair style/color within the ~5% larger head silhouette — hair may fill that bound but must not grow far past the 1.05× target.',
  'HATS (REQUIRED — REMOVE): Remove hats/caps/beanies; show natural hair. Do not grow head past the ~5% target.',
  'HEADWEAR (CRITICAL — DEFAULT NONE): Do NOT add a bandana, wrap, durag, scarf, headband, or any headwear. Bare head / natural hair only UNLESS <IMAGE_1> clearly already wears a bandana/wrap/durag/scarf/headband — then keep that item only and recolor it to LEFT jacket rust-orange. NEVER invent headwear.',
  'NO GLOWING EYES (CRITICAL — ALL FIGURES): Eyes must be matte / natural photorealistic only. FORBIDDEN on anyone: glowing eyes, luminous pupils, light beams, bloom, neon, emissive/HDR eye glow, sci-fi shine.',
  'GLASSES (IF PRESENT — NO GLOW): If <IMAGE_1> wears glasses, keep the frames/lenses but REMOVE any glow, bloom, neon, luminous reflections, lens flare, or emissive shine on the glasses. Natural matte glass only — soft real-world reflections OK; glowing glasses = FAILED.',
  'NO ERASED EYES (CRITICAL — ALL FIGURES): Nobody may have blank, white, missing, or destroyed eyes. Sam + girl eyes = locked to <IMAGE_0>. LEFT eyes = full irises from <IMAGE_2> on <IMAGE_1>’s face.',
  'GENDER FIT (CRITICAL — LEFT FIGURE ONLY): Infer sex presentation from <IMAGE_1>. IF female / feminine: restyle the LEFT orange jacket to a feminine cut (softer shoulder, tailored/fitted waist, feminine collar/zipper proportions) and give feminine body proportions under the jacket (shoulders, chest, waist) consistent with <IMAGE_1>. IF male / masculine: keep the orange jacket cut, tee, pants, and body proportions as in <IMAGE_0> (menswear / do not feminize). Never change Sam or the girl. Gender fit must NOT change LEFT head away from the ~5% larger target.',
  'JACKET COLOR (CRITICAL): LEFT jacket exact rust-orange / Bitcoin orange from <IMAGE_0> — gender fit may change cut/shape only, never hue.',
  'If unsure, change less — only the LEFT white mannequin regions. Prefer the ~5% larger head target over a tiny mannequin-sized head or a dramatically oversized head.',
  'FINAL GATE: Confirm LEFT face/skin match <IMAGE_1>, LEFT irises match <IMAGE_2>, and Sam + girl iris colors still match <IMAGE_0>.',
].join(' ');

/**
 * Pass 2 — HEAD SIZE ONLY.
 * <IMAGE_0> compose result, <IMAGE_1> original mannequin base, <IMAGE_2> selfie (identity/skin stay locked while scaling).
 */
export const ALIEN_COMPOSE_HEAD_SIZE_FIX_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0>. ONLY job: fix LEFT head size. Change nothing else unless required for scale.',
  'HEAD SIZE (SOLE PRIORITY — CRITICAL): Compare LEFT orange-jacket head in <IMAGE_0> to the white mannequin head in <IMAGE_1>. Target = ~5% LARGER than <IMAGE_1> mannequin (≈1.05× width and chin-to-crown vs shoulders/collar). If LEFT head is smaller than ~1.05×, GROW it to that target. If LEFT head is larger than ~1.05×, SHRINK it to that target. Center on the same neck/collar as <IMAGE_1>. Keep head upright — no tilt to the right while scaling.',
  'IDENTITY + SKIN WHILE SCALING (CRITICAL — <IMAGE_2>): <IMAGE_2> is the uploaded person. While resizing, KEEP LEFT face identity AND skin albedo locked to <IMAGE_2> — same complexion, lightness/darkness, undertone, pores. FORBIDDEN: lightening/darkening LEFT skin, borrowing Sam/girl complexion, or inventing a new face while scaling. Keep amber iris color.',
  'FORBIDDEN: leaving a 1:1 mannequin-sized head (too small), leaving a head much larger than ~5%, growing hair far past the 1.05× bound, matching Sam’s head size instead of the 1.05× mannequin target, tilting LEFT head to the right.',
  'Do NOT change Sam or the girl. Do NOT change text, background, framing, or jacket color.',
].join(' ');

/**
 * Launch pass 2 — IRIS ONLY (Season One-style harden).
 * <IMAGE_0> first compose, <IMAGE_1> iris-ref, <IMAGE_2> selfie (do not drift skin/identity).
 */
export const ALIEN_COMPOSE_IRIS_ONLY_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0> (launch poster). Change NOTHING except the two irises on the LEFT orange-jacket figure.',
  'IRIS ONLY — LOCK TO <IMAGE_1> (CRITICAL): Repaint BOTH LEFT irises to match <IMAGE_1> iris-ref exactly — amber / burnt-orange / Bitcoin-orange hue, saturation, brightness, AND radial iris fiber texture. This is the ONLY allowed LEFT eye color source.',
  'FORBIDDEN: brown, dark brown, chocolate, hazel, blue, green, gray, black, selfie eye color, glow, bloom, neon. If either LEFT iris still looks brown or not clearly orange like <IMAGE_1>, FAILED — repaint again from <IMAGE_1>.',
  'LEFT ONLY: Do NOT change Sam or the girl eyes (keep whatever they already have in <IMAGE_0>).',
  'DO NOT TOUCH: LEFT face shape, hair, skin tone/texture, neck, hands, head size, jacket, text, background, framing, pose, or Sam/girl. <IMAGE_2> is the uploaded person — keep LEFT identity + skin locked to <IMAGE_2> while painting irises only.',
  'NO GLOWING EYES. GLASSES (IF PRESENT — NO GLOW): natural matte glass only.',
].join(' ');

/** @deprecated kept for any external imports — use ALIEN_COMPOSE_IRIS_ONLY_PROMPT */
export const ALIEN_COMPOSE_DETAIL_FIX_PROMPT = ALIEN_COMPOSE_IRIS_ONLY_PROMPT;

/**
 * Pass 4 — SKIN / FACE / NECK / HANDS ONLY (final gate).
 * Selfie stays in-context every pass now; this pass still FORCE-grafts complexion from the upload.
 * <IMAGE_0> poster after detail, <IMAGE_1> uploaded selfie identity.
 */
export const ALIEN_COMPOSE_SKIN_LOCK_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0> (launch poster). <IMAGE_1> is the uploaded person — the ONLY allowed source for LEFT face identity and LEFT skin albedo.',
  'SOLE JOB (CRITICAL — SKIN MATCH): Match <IMAGE_1>’s face complexion onto the LEFT orange-jacket face, neck, and hands. Match likeness + skin tone + texture + lightness/darkness + undertone. Face, neck, and hands = ONE continuous living complexion from <IMAGE_1> only — same brightness family as <IMAGE_1>’s face when compared side-by-side.',
  'WHITE NECK / CRUSHED OR DRIFTED FACE (MOST COMMON LAUNCH FAILURE): If the neck is white, porcelain, mannequin, or lighter than the face — REPAINT jaw→collar from <IMAGE_1>. If the face is lighter, darker, muddier, redder, or charcoalized vs <IMAGE_1> (especially Black / deep / rich brown skin) — REPAINT the whole face from <IMAGE_1>. FORBIDDEN: face darker than neck; neck white while face is dark; any brightness drift vs <IMAGE_1>; borrowing Sam’s or the companion’s complexion; “studio correcting” LEFT skin to match the right-side cast.',
  'Keep LEFT amber/orange iris color already on the eyes (do not change eye color). Soft scene light on jacket/wall is fine — do NOT rewrite LEFT skin albedo to match that light or Sam/girl.',
  'GLASSES (IF PRESENT — NO GLOW): If glasses are on, remove glow/bloom/neon/luminous lens shine — natural matte glass only.',
  'Do NOT change Sam or the girl. Do NOT change LEFT head size, text, background, framing, jacket color, or pose.',
  'FINAL GATE: Hold <IMAGE_1> next to LEFT face — if complexion/identity still do not clearly match, FAILED — repaint face+neck+hands from <IMAGE_1> again until they do.',
].join(' ');

/**
 * Wide 2:1 Personal Bitcoin Alien portrait.
 * <IMAGE_0> selfie identity, <IMAGE_1> iris-ref (fiber texture), <IMAGE_2> personalalienplaceholder (bright orange COLOR LOCK).
 */
export const ALIEN_PORTRAIT_PROMPT = [
  'PRIORITY ORDER (HIGHEST FIRST): (1) identity + skin tone/texture from <IMAGE_0>, (2) COLOR LOCK from <IMAGE_2> orange field for jacket / iris HUE, (3) iris fiber texture from <IMAGE_1>, (4) CREAM scene background, (5) soft even studio lighting, (6) front pose.',
  'Create a wide portrait (aspect 2:1) of the SAME person as <IMAGE_0> as their Personal Bitcoin Alien character.',
  'SKIN TONE / TEXTURE LOCK (CRITICAL): Face, neck, and any visible skin MUST match <IMAGE_0> exactly — same undertone, lightness/darkness, warmth/coolness, freckles/moles, pores, and surface texture. FORBIDDEN: lightening, darkening, warming, cooling, airbrushed plastic skin, or inventing a different complexion.',
  'NO EYESHADOW / NO DARK EYE RINGS (CRITICAL): Do NOT add eyeshadow, smoky lids, under-eye dark circles, contour bands, or heavy shading around the eyes that is not clearly in <IMAGE_0>. Keep the eye area clean like the photo — natural lids/lashes only.',
  'COLOR LOCK FROM <IMAGE_2> (CRITICAL — JACKET / IRIS HUE): <IMAGE_2> is the default My Character profile plate — a white mannequin on a solid BRIGHT Bitcoin-orange field (~#F07317 / #F88D00 family). Jacket and iris HUE MUST match that exact bright orange field — same hue, saturation, and brightness. FORBIDDEN: dark orange, burnt orange, rust, copper, brown-orange, muddy orange, desaturated orange. If jacket/eyes look darker or rustier than <IMAGE_2>’s background, the edit FAILED — recolor to match <IMAGE_2> before finishing.',
  'IRIS (CRITICAL): BOTH irises — HUE/saturation/brightness from <IMAGE_2>’s orange field; radial fiber TEXTURE/detail from <IMAGE_1>. Matte photorealistic, natural wetness OK. FORBIDDEN: brown, blue, green, hazel, black, gray, dark/burnt iris, any <IMAGE_0> eye color; glow; bloom; neon. Complete eyes (pupil + iris + sclera).',
  'NO GLOWING EYES (CRITICAL): Eyes must be matte / natural photorealistic only. FORBIDDEN: glowing eyes, luminous pupils, light beams, bloom, neon, emissive/HDR eye glow, sci-fi shine.',
  'GLASSES (IF PRESENT — NO GLOW): If <IMAGE_0> wears glasses, keep the frames/lenses but REMOVE any glow, bloom, neon, luminous reflections, lens flare, or emissive shine on the glasses. Natural matte glass only — soft real-world reflections OK; glowing glasses = FAILED.',
  'BACKGROUND (CRITICAL — CREAM SCENE — NOT <IMAGE_2>): Plain solid cream background edge-to-edge behind the subject — warm cream / ivory / off-white cream (not pure white, not beige-tan wall). Soft even light on the cream field. FORBIDDEN: filling the whole canvas with <IMAGE_2>’s orange (orange is for jacket/iris only), gray, charcoal, busy scenes, outdoors, windows.',
  'IDENTITY ONLY FROM <IMAGE_0>: Use <IMAGE_0> ONLY for face identity (shape, features, skin tone, skin texture, hair). Discard <IMAGE_0>\'s lighting, camera angle, pose, background, and eye color.',
  'POSE (CRITICAL — FACE FORWARD): Head and face straight-on / front view. Eyes into camera. FORBIDDEN: 3/4 turn, looking left/right, profile, chin-down selfie angle. If <IMAGE_0> is turned, straighten to full frontal.',
  'EXPRESSION (CRITICAL — NEUTRAL): Neutral / calm mouth. If <IMAGE_0> is expressive, convert to neutral while keeping identity.',
  'LIGHTING (CRITICAL — SOFT EVEN STUDIO): Ignore <IMAGE_0> photo lighting. Soft even indoor studio light on face/neck — flat gentle key + soft fill. Do NOT change the underlying skin tone/texture while relighting. FORBIDDEN: outdoor sun, golden-hour, cinematic drama, ring light, phone selfie flash, shiny plastic hotspots.',
  'HATS (REQUIRED — REMOVE): Remove hats/caps/beanies; show natural hair.',
  'HEADWEAR (CRITICAL — DEFAULT NONE): Do NOT invent bandanas/wraps. Only keep if clearly in <IMAGE_0>, then recolor to <IMAGE_2>’s bright orange.',
  'WARDROBE: zip/button jacket over a light tee (no poster text, no other people, no necklace required). Jacket hue MUST match <IMAGE_2>’s bright orange field — never rust/dark/burnt.',
  'GENDER FIT: Feminine <IMAGE_0> → feminine orange jacket cut + proportions. Masculine → menswear jacket cut. Do not feminize males.',
  'JACKET COLOR (CRITICAL): Exact match to <IMAGE_2> orange background field — bright Bitcoin orange, not rust.',
  'Head-and-shoulders framing, wide 2:1. No extra text, logos, or watermarks.',
].join(' ');

/** Second pass: color lock + iris + cream background + studio lighting + frontal pose. */
export const ALIEN_PORTRAIT_STUDIO_FIX_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0>. Keep the same person. <IMAGE_1> = iris-ref texture. <IMAGE_2> = My Character default orange field (COLOR LOCK).',
  'SKIN TONE / TEXTURE: Do NOT alter face/neck skin tone or texture — keep exact match to the person.',
  'NO EYESHADOW / NO DARK EYE RINGS: Remove any added eyeshadow, smoky lids, or under-eye dark rings that are not in the original person — clean lids like the photo.',
  'COLOR FIX FROM <IMAGE_2> (CRITICAL): Recolor jacket and iris HUE to match <IMAGE_2>’s solid bright Bitcoin-orange background exactly. FORBIDDEN: dark/burnt/rust/copper/muddy orange. If jacket/eyes read darker than <IMAGE_2>’s field, fix now.',
  'IRIS FIX: BOTH irises — hue from <IMAGE_2> orange field + radial texture from <IMAGE_1>. Never brown/blue/green/selfie eye color. Matte, NO glow.',
  'NO GLOWING EYES (CRITICAL): Keep eyes matte — no glow, bloom, neon, luminous pupils, or emissive shine.',
  'GLASSES (IF PRESENT — NO GLOW): If glasses are on, remove glow/bloom/neon/luminous lens shine — natural matte glass only.',
  'BACKGROUND FIX (CRITICAL — CREAM SCENE): Replace any wrong background with a plain solid cream / ivory / off-white cream field edge-to-edge. Do NOT use <IMAGE_2>’s orange as the scene background. FORBIDDEN: gray, beige-tan wall, busy scene.',
  'LIGHTING FIX (CRITICAL — SOFT EVEN STUDIO): Relight face/neck with soft even indoor studio light without changing skin tone/texture. REMOVE outdoor sun, golden-hour, selfie-flash, cinematic lighting.',
  'POSE FIX (CRITICAL): Full front-facing — straight at camera, no 3/4 turn left or right. Eyes forward.',
  'EXPRESSION: Keep neutral / calm.',
].join(' ');

/**
 * Wide SEASON ONE banner — sole mannequin only (no other cast).
 * <IMAGE_0> SeasonOne banner, <IMAGE_1> selfie, <IMAGE_2> My Character portrait (iris source).
 */
export const ALIEN_SEASONONE_PROMPT = [
  'PRIORITY ORDER (ABSOLUTE): (1) PIXEL-LOCK the head/shoulders CLOSE-UP crop from <IMAGE_0> — do not pull out. (2) BOTH irises from <IMAGE_2> portrait face ONLY — same iris color/texture/detail as the Personal Bitcoin Alien portrait. (3) locked ultra-wide canvas / “SEASON” / “ONE” from <IMAGE_0>. (4) face identity + skin tone/texture from <IMAGE_1> EXCEPT eye color. (5) everything else.',
  'EDIT TASK (not a new generation): Start from <IMAGE_0>. Put <IMAGE_1>’s face on the sole center orange-jacket figure — NOT a new poster.',
  'FRAMING LOCK (CRITICAL — MATCH <IMAGE_0> CLOSE-UP): <IMAGE_0> is already a head + neck + upper-shoulders / collar CLOSE-UP. Keep that EXACT crop and figure scale — face large between “SEASON” and “ONE”, same amount of shoulders/collar visible as the mannequin. FORBIDDEN: zooming out, revealing mid-torso, waist, arms, pockets, or hands; medium shot; making the person smaller in frame. If the result shows more body than <IMAGE_0>, the edit FAILED — restore <IMAGE_0>’s close-up crop.',
  'LOCKED CANVAS from <IMAGE_0>: same ultra-wide banner aspect, same beige wall, same “SEASON” (left) and “ONE” (right) lettering, same soft studio light, same close-up silhouette slot. ONE figure only — the center orange-jacket person. Do NOT invent extra people.',
  'Keep gold triangular / “A” necklace, white tee collar, and jacket hue/collar from <IMAGE_0> within the close-up only. FORBIDDEN: hands, pockets, arms below the crop, or any wider body pose.',
  'SKIN TONE / TEXTURE LOCK (CRITICAL): Face, neck, and any visible skin in the close-up MUST match <IMAGE_1> exactly — same undertone, lightness/darkness, warmth/coolness, freckles/moles, pores, and surface texture. FORBIDDEN: lightening, darkening, warming, cooling, airbrushed plastic skin, mannequin-white neck, or inventing a different complexion.',
  'IRIS LOCK TO <IMAGE_2> PORTRAIT (CRITICAL — BANNER FAILS WITHOUT THIS): Paint BOTH left and right irises using ONLY the eyes on <IMAGE_2> (Personal Bitcoin Alien portrait). Copy hue, saturation, brightness, AND radial iris fiber texture from <IMAGE_2> into the banner face. Typically clear amber / burnt-orange / #F88D00-family Bitcoin orange like the portrait — NOT dark brown, chocolate, hazel-brown, or selfie-brown from <IMAGE_1>. FORBIDDEN: brown irises, coffee irises, muddy irises, any <IMAGE_1> natural eye color, glow, bloom, neon. If eyes do not match <IMAGE_2>, the edit FAILED — repaint irises from <IMAGE_2> before finishing. Complete eyes (pupil + iris + sclera) required.',
  'NO GLOWING EYES (CRITICAL): Matte photorealistic only.',
  'GLASSES (IF PRESENT — NO GLOW): If <IMAGE_1> wears glasses, keep the frames/lenses but REMOVE any glow, bloom, neon, luminous reflections, lens flare, or emissive shine on the glasses. Natural matte glass only — soft real-world reflections OK; glowing glasses = FAILED.',
  'IDENTITY: Photorealistic likeness of <IMAGE_1> — face shape, hair, skin tone, skin texture, age — on that sole figure only. NEVER transfer <IMAGE_1> eye color.',
  'EXPRESSION (CRITICAL — NEUTRAL): Neutral / calm face. If <IMAGE_1> is expressive, convert to neutral while keeping identity.',
  'LIGHTING (CRITICAL — MATCH THE SETTING): Light the center figure to match <IMAGE_0>’s scene lighting exactly — same soft even key/fill direction, intensity, color temperature, and shadow softness as the beige wall / jacket already have in <IMAGE_0>. The person must look photographed in that same room under the same lights — not a pasted-on selfie. FORBIDDEN: selfie flash, outdoor sun, golden-hour, ring light, cinematic drama, plastic hotspots. SKIN ALBEDO still locks to <IMAGE_1> while matching that scene light — do NOT bleach/crush complexion; only match the lighting, not invent a new undertone.',
  'HATS (REMOVE) / HEADWEAR DEFAULT NONE: No invented bandanas/wraps; natural hair from <IMAGE_1> unless <IMAGE_1> already wears headwear (then recolor to jacket rust-orange).',
  'WARDROBE LOCK (CLOSE-UP ONLY): Keep orange jacket collar + white tee + gold necklace as in <IMAGE_0>. Face/skin/hair/iris only beyond that — do NOT recompose outfit or add lower body.',
  'LETTER CLEARANCE (CRITICAL — KEEP DISTANCE FROM “ONE”): The close-up head/shoulders stay centered in the open gap between “SEASON” (left) and “ONE” (right) with a clear empty margin of wall on BOTH sides — especially a comfortable gap from the “O” and “N” of “ONE” on the right (and from the end of “SEASON” on the left). FORBIDDEN: drifting so hair/shoulder/jacket crowds, touches, or overlaps the O or N.',
  'JACKET COLOR (CRITICAL): Exact rust-orange / Bitcoin orange from <IMAGE_0>.',
  'FINAL GATE: (a) crop matches <IMAGE_0> close-up — if more torso/arms/hands appear than in <IMAGE_0>, FAILED; (b) zoom the eyes — if either iris does not match <IMAGE_2> portrait irises, FAILED; fix irises from <IMAGE_2> now.',
].join(' ');

/**
 * Second-pass Season One: layout + identity; iris from <IMAGE_2> portrait.
 * <IMAGE_0> first compose, <IMAGE_1> original seasonone-base, <IMAGE_2> portrait.
 */
export const ALIEN_SEASONONE_FIX_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0>. Change as little as possible except eyes / framing if needed.',
  'FRAMING LOCK TO <IMAGE_1>: Keep the same head/shoulders CLOSE-UP crop and figure scale as <IMAGE_1> (the original Season One base). If the figure was zoomed out past that crop (extra torso/arms), restore <IMAGE_1>’s close-up. FORBIDDEN: hands, pockets, waist, medium shot.',
  'SKIN TONE / TEXTURE: Do NOT alter face/neck skin tone or texture — keep exact match to the locked identity.',
  'IRIS FIX FROM <IMAGE_2> PORTRAIT (SOLE JOB IF EYES ARE WRONG): BOTH irises MUST match the eyes on <IMAGE_2> (Personal Bitcoin Alien portrait) — hue + radial fiber texture. Brown / selfie eye color from the upload is FORBIDDEN. If either iris does not match <IMAGE_2>, REPAINT both irises from <IMAGE_2> immediately. Matte only — NO glow.',
  'NO GLOWING EYES.',
  'GLASSES (IF PRESENT — NO GLOW): If glasses are on, remove glow/bloom/neon/luminous lens shine — natural matte glass only.',
  'SOLE FIGURE: Keep ONE person — center orange-jacket figure. Keep “SEASON” / “ONE” and beige wall from <IMAGE_1>.',
  'LETTER CLEARANCE: Keep a clear gap from the “O” and “N” of “ONE” (and from “SEASON”) — do not crowd the letters.',
].join(' ');

/**
 * Third-pass Season One: IRIS ONLY from portrait face.
 * <IMAGE_0> banner after fix, <IMAGE_1> My Character portrait (iris source).
 */
export const ALIEN_SEASONONE_IRIS_ONLY_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0> (Season One banner). Change NOTHING except the two irises on the center figure’s face.',
  'IRIS ONLY — LOCK TO <IMAGE_1> PORTRAIT: Repaint BOTH irises to match the eyes on <IMAGE_1> (Personal Bitcoin Alien portrait) exactly — hue, saturation, brightness, radial fiber texture. This is the ONLY allowed eye color source.',
  'FORBIDDEN: brown, dark brown, chocolate, hazel, blue, green, gray, black, selfie eye color, glow, bloom, neon.',
  'Do NOT change face shape, hair, skin tone, skin texture, jacket, necklace, text “SEASON”/“ONE”, beige wall, close-up framing/crop, or expression beyond the iris paint. Do NOT introduce hands, arms, or a wider body crop.',
  'If the eyes still do not match <IMAGE_1> after this pass, the edit failed — repaint again from <IMAGE_1> until they match.',
].join(' ');

/**
 * Metaposter / guest metaloop — image-to-video from composed metaposter.
 * Fade in/out is applied in playback code, not here.
 */
/**
 * Image-to-video rule: NEVER narrate what is already visible in the input still
 * (cast poses, who holds whom, wardrobe, wall, lettering, iris color, etc.).
 * Only instruct NEW motion + what must NOT drift/appear.
 */
export const ALIEN_METALOOP_VIDEO_PROMPT = [
  'IMAGE-TO-VIDEO from this exact input still. Only add the motion below.',
  'PEOPLE COUNT LOCK (HARD FAIL IF BROKEN): The still has EXACTLY three people — (1) LEFT = the orange-jacket figure already in the still, (2) Sam (bearded man), (3) the little girl. Keep EXACTLY those three for the entire clip. FORBIDDEN: a 4th person, a new floating stranger, a cream/beige hoodie duplicate, cloning LEFT into a second body, or any extra human entering frame.',
  'LEVITATION LOCK (HARD FAIL IF BROKEN): The ONLY person who leaves the ground is LEFT — the same orange-jacket body already on the left of the still. That orange-jacket person RISES; they do NOT stay grounded while someone else flies. FORBIDDEN: inventing a separate flying person while the orange-jacket LEFT stays on the ground looking up; swapping who flies; levitating Sam or the girl.',
  'HEIGHT / PROXIMITY LOCK (HARD FAIL IF BROKEN): LEFT only rises a SHORT distance — hover close to Sam and the little girl, still in the same group. Feet stay roughly near Sam’s head / upper chest height — NOT high into the sky, NOT tiny/distant, NOT drifting away. Keep LEFT large in frame at roughly the same scale as in the still. FORBIDDEN: shooting into the clouds, shrinking into the distance, leaving the group, or floating far above everyone.',
  'FACING LOCK (HARD FAIL IF BROKEN): LEFT stays forward-facing for the entire clip — torso, shoulders, and hips face the camera like the still. Eyes/chin may tip UP slightly into the sky, but the body does NOT turn/rotate/yaw to the RIGHT (or left). FORBIDDEN: turning RIGHT toward Sam/girl, 3/4 profile, side view, twisting away from camera.',
  'LOCKS: LEFT face + orange jacket + white shirt locked to the still — no crossfade / dissolve / identity swap. Irises matte / locked to the still — NO iris glow, NO eye glow, NO glow from the figure (no aura, bloom, emissive light). Sam + girl stay the same people as in the still (no crossfade / identity swap). The man (Sam) never touches the LEFT figure — his hand NEVER EXTENDS toward LEFT (no reach, grab, hold, point, or arm stretch toward her). Titles / on-image words / wall lettering stay LOCKED in frame for the entire clip exactly as in the still — NEVER fade out, NEVER dissolve, NEVER move, NEVER erase. NO NEW WORDS ALSO — do not invent, add, or spawn any new text/lettering. FORBIDDEN UNDER LEFT FEET / SHOES (HARD FAIL IF PRESENT): NO wind trails, NO motion trails, NO speed lines, NO dust streaks, NO sand streaks, NO vapor wisps, NO smoke ribbons, NO particle streams, NO afterimages under or behind LEFT’s feet/shoes — clean ground/air only, same as the still.',
  'BEAT: From 0:00, the orange-jacket LEFT figure (the same person already on the left in the still — NOT a new person) lifts only a little way off the ground — a gentle hover close beside Sam and the little girl — remains forward-facing (no turn to the right) and looks UP — clean levitation with ZERO trail FX under the feet/shoes. As that orange-jacket LEFT rises slightly, Sam and the little girl (still on the ground) turn their heads / gaze to look UP at that same orange-jacket LEFT — never at a different floating stranger. At 0:00, Sam’s free hand adjusts his own jacket and stays on his jacket for the rest of the clip (never reaches toward LEFT). Evening sky has soft clouds tinted the same colors as LEFT’s jacket and white shirt from the still. Camera stays on the group — orange-jacket LEFT stays large and nearby (do not cut off feet; do not pull away into a distant sky shot). No wardrobe change, no lighting effects, no new props.',
].join(' ');

/**
 * Season One banner loop — image-to-video from composed Season One still.
 * 1.5s fade out / 1.5s fade in (through black) are applied in playback code, not here.
 * Do NOT narrate wardrobe/letters/crop already in the still — only motion + anti-drift.
 */
export const ALIEN_SEASONONE_VIDEO_PROMPT = [
  'IMAGE-TO-VIDEO from this exact input still. Do NOT restate framing, letters, wardrobe, or pose already in the image — only add the face motion below.',
  'CAMERA (CRITICAL): Frozen / locked for the entire clip — no zoom, dolly, pan, tilt, Ken Burns, drift, or shake. Frame 0 and last frame match the input crop/scale. ONLY the face may move.',
  'STATION (CRITICAL): Do not move the person in frame — no walk-closer, no left/right drift, no scale change, no crowding/covering lettering that is already clear in the input.',
  'KEEP AS-IS (anti-drift only): no extra people, no text/wardrobe/identity morph, irises stay matte (no glow).',
  'NO NEW EYE / FACE LINES: Do not add crow’s feet, under-eye creases, tear troughs, contour rings, or wrinkles not in the input while smiling/laughing.',
  'MOTION — FACE ONLY (silent, no audio): Body below neck still — zero shoulder bounce. (1) glance left, (2) glance right, (3) return to camera + soft smile, (4) soft silent laugh with mouth/eyes only (no shoulder heave / body bob), (5) settle to original neutral facing camera. Natural blinks (~every 2–4s).',
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

/**
 * Load a compose reference JPEG.
 * Prefer `src/server-data/alien-compose` (file-traced into Amplify Lambda). Fall back to
 * legacy `public/...` paths for local/dev.
 */
export async function readAlienComposeRef(
  relPath: string
): Promise<{ buffer: Buffer; mime: 'image/jpeg' }> {
  const candidates = [relPath];
  const fallback = ALIEN_COMPOSE_PUBLIC_FALLBACKS[path.basename(relPath)];
  if (fallback && fallback !== relPath) candidates.push(fallback);

  const tried: string[] = [];
  let raw: Buffer | null = null;
  for (const rel of candidates) {
    const abs = path.join(process.cwd(), rel);
    tried.push(abs);
    try {
      raw = await fs.readFile(abs);
      break;
    } catch {
      /* try next */
    }
  }
  if (!raw) {
    throw new Error(
      `Missing compose ref ${path.basename(relPath)} (tried: ${tried.join(' | ')})`
    );
  }
  const buffer = await toCleanJpeg(raw);
  return { buffer, mime: 'image/jpeg' };
}

function normalizeGrokApiKey(raw: string | undefined | null): string {
  if (!raw) return '';
  let key = String(raw).trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  if (/^bearer\s+/i.test(key)) {
    key = key.replace(/^bearer\s+/i, '').trim();
  }
  return key;
}

export function grokApiKeyOrThrow(): string {
  /*
   * Prefer live env (Amplify Console / local .env). Bracket access avoids webpack
   * accidentally replacing these. Build-time fallback is ARELLS_GROK_API_KEY_BUILD only.
   */
  const key =
    normalizeGrokApiKey(process.env['GROK_API_KEY']) ||
    normalizeGrokApiKey(process.env['XAI_API_KEY']) ||
    normalizeGrokApiKey(process.env['ARELLS_GROK_API_KEY_BUILD']);
  if (!key) {
    throw new Error('GROK_API_KEY is not set');
  }
  return key;
}

/** Prompt constants are string[]; xAI requires a single string (array → 4xx). */
function grokPromptText(prompt: string | readonly string[]): string {
  return typeof prompt === 'string' ? prompt : prompt.join(' ');
}

function isGrokContentModerationDetail(detail: string): boolean {
  return /content moderation|moderation|safety|rejected by content/i.test(detail);
}

function formatGrokImageEditError(status: number, detail: string): string {
  if (isGrokContentModerationDetail(detail)) {
    /* Selfie is usually fine — Grok’s output filter flakes on face→poster edits. */
    return 'Grok blocked this edit (content filter) — your photo is fine; tap Try Again';
  }
  return `Grok image edit failed (${status}): ${detail}`;
}

async function grokImageEditOnce(args: {
  prompt: string;
  images: Array<{ url: string; type: string }>;
  aspectRatio: string;
  apiKey: string;
}): Promise<Buffer> {
  const res = await fetch('https://api.x.ai/v1/images/edits', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
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
    error?: { message?: string } | string;
    message?: string;
  };
  try {
    json = JSON.parse(raw) as typeof json;
  } catch {
    throw new Error(
      raw.trim()
        ? formatGrokImageEditError(res.status, raw.trim().slice(0, 280))
        : `Grok image edit returned non-JSON (${res.status})`
    );
  }

  if (!res.ok) {
    const detail =
      (typeof json.error === 'string' ? json.error : json.error?.message) ||
      json.message ||
      raw.trim().slice(0, 280) ||
      `status ${res.status}`;
    throw new Error(formatGrokImageEditError(res.status, detail));
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
 * xAI content moderation often flakes on face→poster edits even with a clean selfie.
 * Retry a couple times before surfacing the error to the user.
 */
async function grokImageEdit(args: {
  prompt: string | readonly string[];
  images: Array<{ url: string; type: string }>;
  aspectRatio: string;
}): Promise<Buffer> {
  const apiKey = grokApiKeyOrThrow();
  const prompt = grokPromptText(args.prompt);
  const maxAttempts = 3;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await grokImageEditOnce({
        prompt,
        images: args.images,
        aspectRatio: args.aspectRatio,
        apiKey,
      });
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      const moderation = isGrokContentModerationDetail(message);
      if (!moderation || attempt >= maxAttempts) break;
      console.warn(`grokImageEdit moderation retry ${attempt}/${maxAttempts}`, message);
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error('Grok image edit failed');
}

/**
 * Multi-image edit via xAI Grok Imagine (JSON edits API).
 * Order: base poster, selfie identity/skin, portrait face for LEFT iris lock.
 */
export async function composePersonalBitcoinAlien(args: {
  selfie: Buffer;
  selfieMime: string;
  base: Buffer;
  baseMime: string;
  /** My Character portrait — LEFT iris color/texture/detail source. */
  portrait: Buffer;
}): Promise<Buffer> {
  const [baseJpeg, identityJpeg, portraitIrisJpeg] = await Promise.all([
    toCleanJpeg(args.base, 2048),
    toIdentityJpeg(args.selfie),
    toIdentityJpeg(args.portrait),
  ]);

  return grokImageEdit({
    prompt: ALIEN_COMPOSE_PROMPT,
    images: [
      { url: toDataUri(baseJpeg), type: 'image_url' },
      { url: toDataUri(identityJpeg), type: 'image_url' },
      { url: toDataUri(portraitIrisJpeg), type: 'image_url' },
    ],
    // LaunchPoster(metaposter) is square 2000×2000 — keep 1:1 so Grok does not recompose Sam/girl.
    aspectRatio: '1:1',
  });
}

/** Season One pass 1 — one Grok call (Amplify ~30s). `iris` = portrait face. */
export async function composePersonalBitcoinAlienSeasonOnePass1(args: {
  selfie: Buffer;
  base: Buffer;
  iris: Buffer;
}): Promise<Buffer> {
  const [baseJpeg, identityJpeg, irisJpeg] = await Promise.all([
    toCleanJpeg(args.base, 4561),
    toIdentityJpeg(args.selfie),
    toIdentityJpeg(args.iris),
  ]);
  return grokImageEdit({
    prompt: ALIEN_SEASONONE_PROMPT,
    images: [
      { url: toDataUri(baseJpeg), type: 'image_url' },
      { url: toDataUri(identityJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
    ],
    aspectRatio: 'auto',
  });
}

/** Season One pass 2 — layout harden. `iris` = portrait face. */
export async function composePersonalBitcoinAlienSeasonOnePass2(args: {
  previous: Buffer;
  base: Buffer;
  iris: Buffer;
}): Promise<Buffer> {
  const [prevJpeg, baseJpeg, irisJpeg] = await Promise.all([
    toCleanJpeg(args.previous, 4561),
    toCleanJpeg(args.base, 4561),
    toIdentityJpeg(args.iris),
  ]);
  return grokImageEdit({
    prompt: ALIEN_SEASONONE_FIX_PROMPT,
    images: [
      { url: toDataUri(prevJpeg), type: 'image_url' },
      { url: toDataUri(baseJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
    ],
    aspectRatio: 'auto',
  });
}

/** Season One pass 3 — iris only from portrait face. */
export async function composePersonalBitcoinAlienSeasonOnePass3(args: {
  previous: Buffer;
  iris: Buffer;
}): Promise<Buffer> {
  const [prevJpeg, irisJpeg] = await Promise.all([
    toCleanJpeg(args.previous, 4561),
    toIdentityJpeg(args.iris),
  ]);
  return grokImageEdit({
    prompt: ALIEN_SEASONONE_IRIS_ONLY_PROMPT,
    images: [
      { url: toDataUri(prevJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
    ],
    aspectRatio: 'auto',
  });
}

/** Ultra-wide SEASON ONE banner — all passes (local/dev; too slow for one Amplify request). */
export async function composePersonalBitcoinAlienSeasonOne(args: {
  selfie: Buffer;
  base: Buffer;
  iris: Buffer;
}): Promise<Buffer> {
  const firstPass = await composePersonalBitcoinAlienSeasonOnePass1(args);
  const secondPass = await composePersonalBitcoinAlienSeasonOnePass2({
    previous: firstPass,
    base: args.base,
    iris: args.iris,
  });
  return composePersonalBitcoinAlienSeasonOnePass3({
    previous: secondPass,
    iris: args.iris,
  });
}

/** Portrait pass 1 — one Grok call (Amplify ~30s). */
export async function composePersonalBitcoinAlienPortraitPass1(args: {
  selfie: Buffer;
  iris: Buffer;
  colorRef: Buffer;
}): Promise<Buffer> {
  const [identityJpeg, irisJpeg, colorJpeg] = await Promise.all([
    toIdentityJpeg(args.selfie),
    toCleanJpeg(args.iris),
    toCleanJpeg(args.colorRef, 2048),
  ]);
  return grokImageEdit({
    prompt: ALIEN_PORTRAIT_PROMPT,
    images: [
      { url: toDataUri(identityJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
      { url: toDataUri(colorJpeg), type: 'image_url' },
    ],
    aspectRatio: '2:1',
  });
}

/** Portrait pass 2 — studio / color fix. */
export async function composePersonalBitcoinAlienPortraitPass2(args: {
  previous: Buffer;
  iris: Buffer;
  colorRef: Buffer;
}): Promise<Buffer> {
  const [prevJpeg, irisJpeg, colorJpeg] = await Promise.all([
    toCleanJpeg(args.previous, 2048),
    toCleanJpeg(args.iris),
    toCleanJpeg(args.colorRef, 2048),
  ]);
  return grokImageEdit({
    prompt: [
      ALIEN_PORTRAIT_STUDIO_FIX_PROMPT,
      'COLOR + IRIS: Jacket/iris HUE = <IMAGE_2> bright orange field; iris texture = <IMAGE_1>. NO dark/rust orange. NO GLOWING EYES — matte only.',
    ].join(' '),
    images: [
      { url: toDataUri(prevJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
      { url: toDataUri(colorJpeg), type: 'image_url' },
    ],
    aspectRatio: '2:1',
  });
}

/**
 * Wide 2:1 Personal Bitcoin Alien portrait — both passes (local/dev).
 * Order: selfie identity, iris-ref texture, personalalienplaceholder orange COLOR LOCK.
 */
export async function composePersonalBitcoinAlienPortrait(args: {
  selfie: Buffer;
  iris: Buffer;
  /** Default My Character plate — bright orange field for jacket / iris hue. */
  colorRef: Buffer;
}): Promise<Buffer> {
  const firstPass = await composePersonalBitcoinAlienPortraitPass1(args);
  return composePersonalBitcoinAlienPortraitPass2({
    previous: firstPass,
    iris: args.iris,
    colorRef: args.colorRef,
  });
}

const VIDEO_POLL_MS = 5000;
const VIDEO_POLL_MAX_MS = 8 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Image-to-video via xAI Grok Imagine (async generations + poll).
 * Default 480p; metaloop + Season One loop use 720p. GROK_VIDEO_RESOLUTION overrides all.
 */
export async function generateAlienImageToVideo(args: {
  imageJpeg: Buffer;
  prompt: string | readonly string[];
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
      prompt: grokPromptText(args.prompt),
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
    resolution: '720p',
  });
}

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
 * Default My Character profile plate — solid bright Bitcoin-orange field behind white mannequin.
 * Portrait wardrobe / iris HUE lock (not scene background).
 */
export const ALIEN_PORTRAIT_COLOR_REL = path.join(
  'public',
  'images',
  'banners',
  'assets',
  'crypto',
  'Bitcoin',
  'Posters',
  'personalalienplaceholder.jpg'
);

/**
 * Grok multi-image edit: <IMAGE_0> base poster (canvas first), <IMAGE_1> selfie, <IMAGE_2> iris.
 * Base must be first — Grok follows the first image for layout/aspect.
 */
export const ALIEN_COMPOSE_PROMPT = [
  'EDIT TASK (not a new generation): Start from <IMAGE_0> and change as little as possible.',
  'OUTPUT MUST still be the same square Launch / “now playing” metaposter as <IMAGE_0> — same beige wall, same left-side orange title stack (“THE BITCOIN ALIEN RACE” / “Season One” / “now playing”), same framing, same lighting family, same rust-orange jacket / white tee / white pants on the LEFT white-mannequin figure (jacket cut may become feminine if <IMAGE_1> is female — see GENDER FIT), same gold A / triangular necklace.',
  'IDENTITY LOCK LEFT (CRITICAL — ABSOLUTE #1): The LEFT orange-jacket face MUST be an exact photorealistic identity lock to <IMAGE_1> — same face shape, eyes spacing, nose, mouth, lips, brow, cheekbones, jaw, chin, skin tone, skin texture, age, hairline, hair style/color, and facial hair as <IMAGE_1>. Pixel-faithful likeness of the uploaded person. FORBIDDEN: inventing a different face, blending with anyone else, or replacing LEFT with the RIGHT bearded man’s (Sam’s) face, beard, hair, or bone structure. If LEFT is not clearly the same person as <IMAGE_1>, the edit FAILED — repaint LEFT from <IMAGE_1> before finishing.',
  'SKIN TONE / TEXTURE LOCK (CRITICAL — LEFT FACE / NECK / HANDS): LEFT skin MUST match <IMAGE_1> exactly — same undertone, lightness/darkness, warmth/coolness, freckles/moles, pores, and surface texture. FORBIDDEN: lightening, darkening, warming, cooling, smoothing away pores, plastic/mannequin skin, or borrowing Sam’s / girl skin tone. Neck and hands must match that same <IMAGE_1> skin — continuous with the face.',
  'IDENTITY LOCK RIGHT / SEPARATION (CRITICAL): LEFT = <IMAGE_1> only. RIGHT Sam + girl = <IMAGE_0> only. Two separate people always. NEVER clone Sam onto LEFT. NEVER clone <IMAGE_1> onto Sam. NEVER twin / mirror / average the two men.',
  'SAM + GIRL LOCK (CRITICAL — DO NOT TOUCH): The bearded man and young girl on the RIGHT must stay identical to <IMAGE_0> — faces, skin, hair, eyes, iris color (NOT amber/orange from <IMAGE_2>), clothing, hands, lighting. Do NOT apply <IMAGE_1> or <IMAGE_2> to them. If their eyes become orange/amber/glowing, the edit failed.',
  'SAM + GIRL EYES (CRITICAL — NEVER ERASE): Sam and the girl MUST keep complete, open, living eyes exactly as in <IMAGE_0> — pupils, irises, sclera, eyelids, lashes. FORBIDDEN: blank eyes, white-out eyes, missing irises, closed/melted eye sockets, smeared eye regions, featureless faces, painted-over eyes. If their eyes are erased or damaged vs <IMAGE_0>, the edit FAILED — restore eyes from <IMAGE_0> before finishing.',
  'TEXT: Copy on-image lettering from <IMAGE_0> exactly. Do NOT invent premiere dates or new words.',
  'Replace ONLY the featureless matte-white silhouette head (and any white neck/hands/skin) on the LEFT mannequin figure in the orange jacket with <IMAGE_1>’s locked identity. Do NOT replace the bearded man or the girl. Do NOT fill the white silhouette with Sam’s face from the RIGHT.',
  'HEAD SIZE (CRITICAL — #1 CONSTRAINT AFTER CANVAS): LEFT head + hair MUST be ~10% LARGER than the white mannequin head in <IMAGE_0> (≈1.10× mannequin width and chin-to-crown). Measure vs orange-jacket shoulders / collar. Target: slightly bigger than the mannequin — NOT 1:1, NOT dramatically oversized vs Sam. FORBIDDEN: matching mannequin 1:1 (too small), shrinking into the mannequin bound, OR growing far past ~10% (big hair that blows past the 1.10× target). Center on the same neck/collar as <IMAGE_0>. A LEFT head at mannequin size or much larger than ~10% = FAILED edit.',
  'IDENTITY (LEFT MANNEQUIN ONLY): Apply the IDENTITY LOCK LEFT above at the ~10% larger head-size target. <IMAGE_1> is the sole face source for LEFT.',
  'EXPRESSION (CRITICAL — NEUTRAL): LEFT face must be neutral / calm — relaxed mouth, no smile, no frown. If <IMAGE_1> is smiling, laughing, frowning, scowling, or expressive, convert to this calm neutral while keeping identity. Smile is ONLY for the video loop, never this still. NOT a smile, grin, laugh, frown, scowl, or surprise.',
  'HEAD TILT (CRITICAL — LEFT — NO RIGHT TILT): LEFT head must be upright / level — ears even, chin centered over the collar, no lean. FORBIDDEN: tilting the head to the RIGHT (ear toward right shoulder), cocking, or rolling the face clockwise. If <IMAGE_1> is tilted right, straighten to upright while keeping identity. A RIGHT-tilted LEFT head = FAILED edit — straighten before finishing.',
  'LIGHTING (CRITICAL — EVEN STUDIO MATCH): LEFT face/neck/hands: soft even studio-like light matching the bearded man / girl in <IMAGE_0>. Match light only — do NOT change skin undertone, lightness/darkness, or texture from <IMAGE_1>. FORBIDDEN: harsh split lighting, blown white forehead/nose hotspots, shiny plastic skin, selfie flash. Skin must look like real living skin matching <IMAGE_1>.',
  'NECK (CRITICAL — MOST COMMON FAILURE — NEVER WHITE): The LEFT neck from jawline to collar MUST be living skin continuous with the LEFT face — same tone, undertone, pores/texture as <IMAGE_1>. FORBIDDEN: leaving the original mannequin neck white, porcelain, plaster, or tee-white under the chin; lightening/darkening the neck vs the face. A face with a white or mismatched neck is a FAILED edit — repaint the entire neck column before finishing.',
  'HANDS (CRITICAL — NEVER WHITE): Every LEFT hand/wrist/finger (including in pockets) MUST match the LEFT face / <IMAGE_1> skin tone and texture exactly. FORBIDDEN: mannequin-white, plaster, white gloves, white blobs into white pants/tee, lighter/darker hands than the face.',
  'HAIR: Match <IMAGE_1> hair style/color within the ~10% larger head silhouette — hair may fill that bound but must not grow far past the 1.10× target.',
  'HATS (REQUIRED — REMOVE): Remove hats/caps/beanies; show natural hair. Do not grow head past the ~10% target.',
  'HEADWEAR (CRITICAL — DEFAULT NONE): Do NOT add a bandana, wrap, durag, scarf, headband, or any headwear. Bare head / natural hair only UNLESS <IMAGE_1> clearly already wears a bandana/wrap/durag/scarf/headband — then keep that item only and recolor it to LEFT jacket rust-orange. NEVER invent headwear.',
  'IRIS (LEFT FIGURE ONLY — CRITICAL — LOCK TO <IMAGE_2>): LEFT BOTH irises MUST match <IMAGE_2> exactly — same amber / burnt-orange / Bitcoin-orange hue, saturation, brightness, AND radial iris fiber texture/detail from the close-up. Matte photorealistic, natural wetness OK. Eye color + iris texture come ONLY from <IMAGE_2> — never from <IMAGE_1> natural eye color. LEFT eyes must be complete (pupil + iris + sclera) — never blank/erased. Bearded man and girl keep ORIGINAL eye colors from <IMAGE_0> — never orange from <IMAGE_2>.',
  'NO GLOWING EYES (CRITICAL — ALL FIGURES): Eyes must be matte / natural photorealistic only. FORBIDDEN on anyone: glowing eyes, luminous pupils, light beams, bloom, neon, emissive/HDR eye glow, sci-fi shine.',
  'NO ERASED EYES (CRITICAL — ALL FIGURES): Nobody may have blank, white, missing, or destroyed eyes. Sam + girl eyes = <IMAGE_0>. LEFT eyes = full eyes with <IMAGE_2> iris color + texture.',
  'GENDER FIT (CRITICAL — LEFT FIGURE ONLY): Infer sex presentation from <IMAGE_1>. IF female / feminine: restyle the LEFT orange jacket to a feminine cut (softer shoulder, tailored/fitted waist, feminine collar/zipper proportions) and give feminine body proportions under the jacket (shoulders, chest, waist) consistent with <IMAGE_1>. IF male / masculine: keep the orange jacket cut, tee, pants, and body proportions as in <IMAGE_0> (menswear / do not feminize). Never change Sam or the girl. Gender fit must NOT change LEFT head away from the ~10% larger target.',
  'JACKET COLOR (CRITICAL): LEFT jacket exact rust-orange / Bitcoin orange from <IMAGE_0> — gender fit may change cut/shape only, never hue.',
  'If unsure, change less — only the LEFT white mannequin regions. Prefer the ~10% larger head target over a tiny mannequin-sized head or a dramatically oversized head.',
].join(' ');

/**
 * Pass 2 — HEAD SIZE ONLY. <IMAGE_0> compose result, <IMAGE_1> original mannequin base.
 * Kept separate so iris/neck jobs cannot override scale.
 */
export const ALIEN_COMPOSE_HEAD_SIZE_FIX_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0>. ONLY job: fix LEFT head size. Change nothing else unless required for scale.',
  'HEAD SIZE (SOLE PRIORITY — CRITICAL): Compare LEFT orange-jacket head in <IMAGE_0> to the white mannequin head in <IMAGE_1>. Target = ~10% LARGER than <IMAGE_1> mannequin (≈1.10× width and chin-to-crown vs shoulders/collar). If LEFT head is smaller than ~1.10×, GROW it to that target. If LEFT head is larger than ~1.10×, SHRINK it to that target. Keep LEFT identity locked and amber iris color while scaling. Center on the same neck/collar as <IMAGE_1>. Keep head upright — no tilt to the right while scaling.',
  'FORBIDDEN: leaving a 1:1 mannequin-sized head (too small), leaving a head much larger than ~10%, growing hair far past the 1.10× bound, matching Sam’s head size instead of the 1.10× mannequin target, tilting LEFT head to the right.',
  'Do NOT change Sam or the girl. Do NOT change LEFT identity. Do NOT change text, background, framing, or jacket color.',
].join(' ');

/**
 * Pass 3 — neck / hands / iris after head size is locked.
 * <IMAGE_0> sized result, <IMAGE_1> original base, <IMAGE_2> iris.
 */
export const ALIEN_COMPOSE_DETAIL_FIX_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0>. Change as little as possible. Do NOT change the LEFT head size — it is already locked at ~10% larger than the mannequin.',
  'IDENTITY LOCK LEFT: Keep LEFT face identity unchanged. Do NOT rewrite LEFT toward Sam.',
  'HEAD TILT: Keep LEFT head upright — FORBIDDEN tilting to the right.',
  'SKIN TONE / TEXTURE LOCK (CRITICAL — LEFT): Do NOT lighten, darken, warm, cool, or smooth LEFT face/neck/hands. Keep the exact undertone, lightness, pores, freckles/moles from the locked identity. FORBIDDEN: plastic/mannequin skin or borrowing Sam/girl complexion.',
  'IRIS FIX (LEFT ONLY — CRITICAL): LEFT BOTH irises MUST match <IMAGE_2> amber / burnt-orange hue AND radial fiber texture. Matte, NO glow. Sam + girl keep <IMAGE_1> eye colors.',
  'NECK FIX: If LEFT neck is white/mannequin, repaint jaw→collar to match LEFT face skin tone/texture from the locked identity.',
  'HANDS: If any LEFT hand/wrist is still white, paint skin matching the LEFT face tone/texture exactly.',
  'SAM + GIRL EYE RESTORE: If Sam or girl eyes are blank/erased vs <IMAGE_1>, restore from <IMAGE_1>.',
  'NO GLOWING EYES. Do NOT change LEFT head size. Do NOT change text/background/framing.',
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
  'BACKGROUND FIX (CRITICAL — CREAM SCENE): Replace any wrong background with a plain solid cream / ivory / off-white cream field edge-to-edge. Do NOT use <IMAGE_2>’s orange as the scene background. FORBIDDEN: gray, beige-tan wall, busy scene.',
  'LIGHTING FIX (CRITICAL — SOFT EVEN STUDIO): Relight face/neck with soft even indoor studio light without changing skin tone/texture. REMOVE outdoor sun, golden-hour, selfie-flash, cinematic lighting.',
  'POSE FIX (CRITICAL): Full front-facing — straight at camera, no 3/4 turn left or right. Eyes forward.',
  'EXPRESSION: Keep neutral / calm.',
].join(' ');

/**
 * Wide SEASON ONE banner — sole mannequin only (no other cast).
 * <IMAGE_0> SeasonOne banner, <IMAGE_1> selfie, <IMAGE_2> iris-ref.jpg.
 */
export const ALIEN_SEASONONE_PROMPT = [
  'PRIORITY ORDER (ABSOLUTE): (1) BOTH irises MUST be painted from <IMAGE_2> iris-ref ONLY — amber/burnt-orange Bitcoin orange, never brown. (2) locked canvas / sole figure from <IMAGE_0>. (3) face identity + skin tone/texture from <IMAGE_1> EXCEPT eye color. (4) everything else.',
  'EDIT TASK (not a new generation): Start from <IMAGE_0>. Put <IMAGE_1>’s face on the sole center orange-jacket figure — NOT a new poster.',
  'LOCKED CANVAS from <IMAGE_0>: same ultra-wide banner, same beige wall, same “SEASON” (left) and “ONE” (right) lettering, same framing/aspect, same soft studio light. ONE figure only — the center orange-jacket person. Do NOT invent extra people.',
  'Keep gold triangular / “A” necklace, white tee, hands-in-pockets pose, jacket hue from <IMAGE_0>.',
  'SKIN TONE / TEXTURE LOCK (CRITICAL): Face, neck, and any visible skin MUST match <IMAGE_1> exactly — same undertone, lightness/darkness, warmth/coolness, freckles/moles, pores, and surface texture. FORBIDDEN: lightening, darkening, warming, cooling, airbrushed plastic skin, mannequin-white neck/hands, or inventing a different complexion.',
  'IRIS LOCK TO <IMAGE_2> (CRITICAL — BANNER FAILS WITHOUT THIS): Paint BOTH left and right irises using ONLY <IMAGE_2>. Copy hue, saturation, brightness, AND radial iris fiber texture from <IMAGE_2> into the banner face. Eye color must read as clear amber / burnt-orange / #F88D00-family Bitcoin orange — the SAME orange as <IMAGE_2>, NOT dark brown, chocolate, hazel-brown, or selfie-brown from <IMAGE_1>. FORBIDDEN: brown irises, coffee irises, muddy irises, any <IMAGE_1> natural eye color, glow, bloom, neon. If eyes look brown at all, the edit FAILED — repaint irises from <IMAGE_2> before finishing. Complete eyes (pupil + iris + sclera) required.',
  'NO GLOWING EYES (CRITICAL): Matte photorealistic only.',
  'IDENTITY: Photorealistic likeness of <IMAGE_1> — face shape, hair, skin tone, skin texture, age — on that sole figure only. NEVER transfer <IMAGE_1> eye color.',
  'EXPRESSION (CRITICAL — NEUTRAL): Neutral / calm face. If <IMAGE_1> is expressive, convert to neutral while keeping identity.',
  'LIGHTING: Soft even light matching <IMAGE_0>. Do NOT change underlying skin tone/texture while relighting. No selfie flash, no plastic shine.',
  'HATS (REMOVE) / HEADWEAR DEFAULT NONE: No invented bandanas/wraps; natural hair from <IMAGE_1> unless <IMAGE_1> already wears headwear (then recolor to jacket rust-orange).',
  'BODY LOCK (CRITICAL — NO BODY RECOMPOSE): Keep jacket cut, shoulders, chest, waist, tee, pants/pose, and overall body proportions EXACTLY as in <IMAGE_0>. Face/skin/hair/iris only.',
  'LETTER CLEARANCE (CRITICAL — KEEP DISTANCE FROM “ONE”): The figure must stay centered in the open gap between “SEASON” (left) and “ONE” (right) with a clear empty margin of wall on BOTH sides — especially a comfortable gap from the “O” and “N” of “ONE” on the right (and from the end of “SEASON” on the left). FORBIDDEN: drifting right so hair/shoulder/jacket crowds, touches, overlaps, or sits too close to the O or N; enlarging the head/body so it eats into that gap. If the character looks too close to the O/N vs <IMAGE_0>, FAILED — keep the same silhouette distance as the mannequin.',
  'JACKET COLOR (CRITICAL): Exact rust-orange / Bitcoin orange from <IMAGE_0>.',
  'FINAL GATE: Zoom the eyes — if either iris is brown instead of <IMAGE_2> amber/burnt-orange, FAILED; fix irises from <IMAGE_2> now.',
].join(' ');

/**
 * Second-pass Season One: layout + identity; iris still from <IMAGE_2>.
 * <IMAGE_0> first compose, <IMAGE_1> original seasonone-base, <IMAGE_2> iris-ref.
 */
export const ALIEN_SEASONONE_FIX_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0>. Change as little as possible except eyes.',
  'SKIN TONE / TEXTURE: Do NOT alter face/neck/hands skin tone or texture — keep exact match to the locked identity.',
  'IRIS FIX FROM <IMAGE_2> (SOLE JOB IF EYES ARE WRONG): BOTH irises MUST match <IMAGE_2> iris-ref — amber / burnt-orange / Bitcoin-orange hue + radial fiber texture. Brown / selfie eye color from the upload is FORBIDDEN. If either iris is brown, hazel-brown, or not clearly orange like <IMAGE_2>, REPAINT both irises from <IMAGE_2> immediately. Matte only — NO glow.',
  'NO GLOWING EYES.',
  'SOLE FIGURE: Keep ONE person — center orange-jacket figure. Keep “SEASON” / “ONE” and beige wall from <IMAGE_1>.',
  'BODY LOCK: Jacket cut and body proportions must match <IMAGE_1>.',
  'LETTER CLEARANCE: Keep a clear gap from the “O” and “N” of “ONE” (and from “SEASON”) — do not crowd the letters.',
].join(' ');

/**
 * Third-pass Season One: IRIS ONLY. Portrait-style harden — iris is <IMAGE_1> here.
 * <IMAGE_0> banner after fix, <IMAGE_1> iris-ref.jpg (only reference allowed for eye color).
 */
export const ALIEN_SEASONONE_IRIS_ONLY_PROMPT = [
  'EDIT TASK: Start from <IMAGE_0> (Season One banner). Change NOTHING except the two irises on the center figure’s face.',
  'IRIS ONLY — LOCK TO <IMAGE_1>: Repaint BOTH irises to match <IMAGE_1> iris-ref exactly — amber / burnt-orange / Bitcoin-orange hue, saturation, brightness, radial fiber texture. This is the ONLY allowed eye color source.',
  'FORBIDDEN: brown, dark brown, chocolate, hazel, blue, green, gray, black, selfie eye color, glow, bloom, neon.',
  'Do NOT change face shape, hair, skin tone, skin texture, jacket, necklace, hands, text “SEASON”/“ONE”, beige wall, framing, or expression beyond the iris paint.',
  'If the eyes still look brown after this pass, the edit failed — repaint again from <IMAGE_1> until they read unmistakably orange like <IMAGE_1>.',
].join(' ');

/**
 * Metaposter / guest metaloop — image-to-video from composed metaposter.
 * Fade in/out is applied in playback code, not here.
 */
export const ALIEN_METALOOP_VIDEO_PROMPT = [
  'PRIORITY ORDER (ABSOLUTE — LAUNCH VIDEO): (1) PIXEL-LOCK LEFT face skin / lighting / cleanliness to the input still — NO new face lines, NO lighting drift. (2) NO GLOWING EYES / matte irises. (3) FADE OUT ALL on-image words as soon as motion starts. (4) gentle walk + soft mouth smile. (5) everything else.',
  '15-second video starting from this exact original image. Critical motion: the figure on the LEFT walks straight FORWARD toward the camera only — zero left walk, zero right walk, no drifting sideways. From 0:00 to 0:04 it walks forward getting slightly closer; at 0:04 it stops and stays with only slight natural body movements until 0:15. Figure never leaves the frame. Keep the LEFT figure’s face identity and hair exactly as in the input. No duplicating anyone. Locked camera.',
  'SKIN TONE + LIGHTING LOCK (CRITICAL — LEFT FACE / NECK / HANDS — EVERY FRAME): LEFT skin MUST match the input still exactly — same undertone, lightness/darkness, warmth/coolness, freckles/moles, pores, and surface texture. Keep the SAME soft even studio lighting family as the still — do NOT relight the face while walking closer or smiling. FORBIDDEN: darkening the face, warming/cooling the complexion, adding dramatic cheek/jaw shadows, rim light, contrast boost, HDR skin, shiny plastic hotspots, or any lighting drift away from the still. If LEFT skin looks darker, redder, or more shadowed than the still, the video FAILED.',
  'NO NEW FACE / EYE LINES (CRITICAL — LAUNCH VIDEO — EVERY FRAME — #1 ARTIFACT TO AVOID): Do NOT etch, draw, or morph ANY new lines onto the LEFT face that are not clearly in the input still. FORBIDDEN around eyes: crow’s feet, under-eye creases, eyelid etch lines, tear-trough contours, dark-circle rings, eyeshadow-like bands, contour rings. FORBIDDEN elsewhere: jaw contour lines, cheek crease lines, nasolabial deepening, forehead wrinkles, temple etch, mouth corner etch, neck lines, or any dark outline / edge-enhance / temporal morph “stroke” around the face or eyes. Keep skin smooth and clean like the still — natural lids/lashes only. Smiling must NOT invent wrinkles or contour strokes.',
  'NO GLOWING EYES (CRITICAL — LAUNCH VIDEO — EVERY FRAME — ALL FIGURES): Eyes must stay matte / natural photorealistic like the input still. FORBIDDEN: glowing irises, luminous / emissive orange, bloom, neon, light beams, HDR eye shine, sci-fi pupil glow, brightening the iris into a glow while smiling or walking closer. If LEFT eyes look lit-from-within or glowing vs the input still, the video FAILED.',
  'FADE OUT ALL WORDS (CRITICAL — AS SOON AS VIDEO STARTS): At the very start of motion (within the first ~0.3–0.5s), smoothly FADE OUT / dissolve away EVERY on-image title and word from the input still — “THE BITCOIN ALIEN RACE”, “Season One”, “now playing”, and any other lettering — until the wall is clean of text for the rest of the clip. Do NOT keep titles visible while walking. Do NOT leave ghost letters, half-faded burns, or text sliding over the face. After the fade, NO typography for the remaining duration.',
  'IRIS LOCK (LEFT FIGURE — CRITICAL): BOTH LEFT irises MUST stay the exact same amber / burnt-orange / Bitcoin-orange hue, saturation, brightness, AND radial iris fiber texture as in the input still — every frame — MATTE only. Copy FROM THE INPUT IMAGE ONLY. FORBIDDEN: brown/hazel drift; rewriting irises; making orange brighter/glowier than the still. Bearded man and girl keep THEIR original non-orange eye colors from the input.',
  'NATURAL BLINKS (CRITICAL — REQUIRED): LEFT figure MUST blink naturally throughout the full clip — occasional, realistic, soft lid closes (about every 2–4 seconds). FORBIDDEN: staring without blinking, rapid fluttering, twitchy lids, holding eyes locked open. Bearded man and girl may blink naturally too.',
  'EXPRESSION (LEFT FIGURE — SOFT MOUTH SMILE ONLY): Give the LEFT figure a very soft closed-mouth smile. Animate the mouth corners only — do NOT deepen eye sockets, do NOT add cheek/eye wrinkles, do NOT add face contour lines, do NOT change lighting to “sell” the smile. Never blank/neutral forever, frown, or a big laugh. At the same time the man gently adjusts the girl and adjusts his sweater/jacket. Man always holds the girl at the same height.',
].join(' ');

/**
 * Season One banner loop — image-to-video from composed Season One still.
 * 1.5s fade out / 1.5s fade in (through black) are applied in playback code, not here.
 */
export const ALIEN_SEASONONE_VIDEO_PROMPT = [
  'IMAGE-TO-VIDEO: Animate ONLY the sole center figure from this exact input Season One banner. Pixel-lock EVERY frame to the input still’s framing — same ultra-wide canvas, beige wall, “SEASON” (left) and “ONE” (right) lettering fully readable, jacket, tee, necklace, hands-in-pockets pose.',
  'STAGNANT FRAME (CRITICAL — ABSOLUTE #1 — NEVER BREAK): The camera is FROZEN / LOCKED OFF for the entire clip — NO camera movements of any kind. FORBIDDEN: zoom in, zoom out, push-in, pull-back, dolly, truck, pan, tilt, roll, reframe, crop change, Ken Burns, slow drift, orbit, or any camera move. NO CAMERA SHAKE — FORBIDDEN: handheld shake, jitter, vibration, micro-tremor, bounce, wiggle, or any unstable camera motion. ONLY the face may move; the lens stays put. Frame 0 and the last frame MUST match the input still’s exact crop and scale. If the background, letters, or walls appear to grow, shrink, slide, zoom, or shake at all, the video FAILED.',
  'STATION LOCK (CRITICAL): The person MUST stay exactly in the silhouette slot from the input — between “SEASON” and “ONE”, same scale, same vertical/horizontal position, same distance from camera. Keep a clear empty margin from the letters every frame — especially do NOT drift toward or crowd the “O” or “N” of “ONE” on the right (or the end of “SEASON” on the left). FORBIDDEN: recentering the body, walking forward/closer, drifting left/right, growing larger, covering/obscuring any part of “SEASON” or “ONE”, or sitting too close to the O/N. If shoulders/chest/head hide lettering or close the gap that was visible in the input, the edit FAILED — keep the body smaller and parked in the original silhouette bound with the same letter clearance.',
  'No extra people. No text changes. No wardrobe changes. No morphing identity. Keep amber / burnt-orange irises matte (no glow).',
  'NO EXTRA LINES AROUND THE EYES (CRITICAL — EVERY FRAME): Do NOT add crow’s feet, under-eye creases, eyelid crease lines, tear troughs, dark circles drawn as lines, contour rings, or any new wrinkles/lines around the eyes that are not clearly present in the input still. Keep the eye sockets clean like the input — natural lids/lashes only. FORBIDDEN: etching extra lines into the skin around the eyes while smiling or laughing.',
  'NATURAL BLINKS (CRITICAL — REQUIRED): The center figure MUST blink naturally throughout the full clip — occasional, realistic, soft lid closes (about every 2–4 seconds), including while glancing, smiling, and laughing. FORBIDDEN: staring without blinking, rapid fluttering, twitchy lids, holding eyes locked open.',
  'FACE / HEAD MOTION ONLY (subtle, photorealistic, SILENT — no speech, no laughter audio, no sound of any kind): Body below the neck stays STILL — locked silhouette, zero shoulder bounce. Camera stays stagnant / rock-steady while ONLY the face moves — (1) glance left, (2) glance right, (3) return to camera and smile softly, (4) soft silent laugh with mouth/eyes ONLY (no shoulder heave, no body bob — those make the model invent camera shake), (5) settle back to the original neutral expression facing camera. FORBIDDEN: any camera shake, jitter, or zoom while laughing. No headwear changes.',
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
 * Order: selfie identity, iris-ref texture, personalalienplaceholder orange COLOR LOCK.
 */
export async function composePersonalBitcoinAlienPortrait(args: {
  selfie: Buffer;
  iris: Buffer;
  /** Default My Character plate — bright orange field for jacket / iris hue. */
  colorRef: Buffer;
}): Promise<Buffer> {
  const [identityJpeg, irisJpeg, colorJpeg] = await Promise.all([
    toIdentityJpeg(args.selfie),
    toCleanJpeg(args.iris),
    toCleanJpeg(args.colorRef, 2048),
  ]);

  const firstPass = await grokImageEdit({
    prompt: ALIEN_PORTRAIT_PROMPT,
    images: [
      { url: toDataUri(identityJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
      { url: toDataUri(colorJpeg), type: 'image_url' },
    ],
    aspectRatio: '2:1',
  });

  const firstJpeg = await toCleanJpeg(firstPass, 2048);
  return grokImageEdit({
    prompt: [
      ALIEN_PORTRAIT_STUDIO_FIX_PROMPT,
      'COLOR + IRIS: Jacket/iris HUE = <IMAGE_2> bright orange field; iris texture = <IMAGE_1>. NO dark/rust orange. NO GLOWING EYES — matte only.',
    ].join(' '),
    images: [
      { url: toDataUri(firstJpeg), type: 'image_url' },
      { url: toDataUri(irisJpeg), type: 'image_url' },
      { url: toDataUri(colorJpeg), type: 'image_url' },
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

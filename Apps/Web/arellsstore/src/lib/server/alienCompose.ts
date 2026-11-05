import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

/**
 * Bundled under `src/server-data/` so Amplify/Next file tracing packs them into the
 * API Lambda. `public/...` alone is often missing at runtime (`ENOENT` under `/tmp/app/public`).
 */
const ALIEN_COMPOSE_DATA_DIR = path.join('src', 'server-data', 'alien-compose');

/** Launch / share character poster base (white mannequin in orange wind-blown robe). */
export const ALIEN_COMPOSE_BASE_REL = path.join(
  ALIEN_COMPOSE_DATA_DIR,
  'Character-Poster-Base.jpg'
);
/** Wide SEASON ONE banner base (white mannequin between SEASON / ONE). */
export const ALIEN_SEASONONE_BASE_REL = path.join(ALIEN_COMPOSE_DATA_DIR, 'seasonone-base.jpg');
/** Permanent iris color/detail reference (not tmp). */
export const ALIEN_COMPOSE_IRIS_REL = path.join(ALIEN_COMPOSE_DATA_DIR, 'iris-ref.jpg');
/**
 * Default My Character profile plate — solid bright Bitcoin-orange field behind white mannequin.
 * Portrait jacket / iris HUE lock (not scene background).
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
    'Character-Poster-Base.jpg'
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
  'PRIORITY ORDER (ABSOLUTE — SINGLE PASS): (1) LEFT identity + skin albedo from <IMAGE_1>. (2) LEFT BOTH iris color/texture/detail LOCKED to <IMAGE_2> portrait face ONLY. (3) Sam + girl iris color/detail LOCKED to <IMAGE_0>. (4) Sam + girl otherwise untouched from <IMAGE_0>. (5) locked square launch canvas / titles / orange robe wardrobe from <IMAGE_0>. (6) everything else.',
  'EDIT TASK (not a new generation): Start from <IMAGE_0> (Character Poster Base) and change as little as possible.',
  'OUTPUT MUST still be the same square Launch / “now playing” character poster as <IMAGE_0> — same beige wall, same left-side orange title stack (“THE BITCOIN ALIEN RACE” / “Season One” / “now playing”), same framing, same lighting family, same long bright-orange hooded robe with white embroidery + wind-billowed silhouette + white tee + white pants on the LEFT white-mannequin figure (body proportions may become feminine if <IMAGE_1> is female — see GENDER FIT; keep the robe cut/embroidery/billow from <IMAGE_0>), same gold A / triangular necklace.',
  'IDENTITY LOCK LEFT (CRITICAL — ABSOLUTE #1): The LEFT orange-robe face MUST match <IMAGE_1> — same face shape, eyes spacing, nose, mouth, lips, brow, cheekbones, jaw, chin, skin tone, skin texture, age, hairline, hair style/color, facial hair. Clear likeness of the uploaded adult. Eye COLOR comes from <IMAGE_2>, not <IMAGE_1>. FORBIDDEN: inventing a different face, blending with anyone else, or replacing LEFT with the RIGHT bearded man’s (Sam’s) face, beard, hair, or bone structure. If LEFT is not clearly the same person as <IMAGE_1>, the edit FAILED — repaint LEFT from <IMAGE_1> before finishing.',
  'LEFT EYES (CRITICAL — IRIS LOCK TO <IMAGE_2> PORTRAIT): Paint BOTH LEFT irises using ONLY the eyes on <IMAGE_2> (Personal Bitcoin Alien portrait) — copy iris hue, saturation, brightness, AND radial iris fiber texture/detail from <IMAGE_2>. Typically clear amber / burnt-orange / Bitcoin-orange like the portrait. Complete eyes (pupil + iris + sclera). FORBIDDEN: <IMAGE_1> selfie/natural eye color; brown/hazel/blue/green selfie irises; inventing a new eye color; glow, bloom, neon. If LEFT irises do not match <IMAGE_2>, FAILED — repaint from <IMAGE_2>.',
  'LEFT IRIS GEOMETRY (CRITICAL — NO LOPSIDED EYES): BOTH LEFT irises must be round circles of EQUAL size, level with each other, centered in each eye opening. EACH pupil must sit in the EXACT center of its iris (not high, low, nasal, or temporal). Equal sclera visible on left and right of each iris. Gaze straight forward, parallel — same direction in both eyes. FORBIDDEN: oval/squashed/egg-shaped irises; one iris larger or higher than the other; pupils drifting toward the nose/inner corner; cross-eyed / wall-eyed look; drooping iris; cut-off iris at the eyelid. Lopsided or off-center pupils = FAILED — redraw both eyes symmetrically before finishing.',
  'SKIN ALBEDO LOCK (CRITICAL — LEFT FACE / NECK / HANDS — ABSOLUTE #2): LEFT skin matches <IMAGE_1> — same complexion, undertone, lightness/darkness, warmth/coolness, freckles/moles, pores, and surface texture. Face, neck, and hands = ONE continuous living complexion from <IMAGE_1> only. Albedo = the underlying skin COLOR only; scene shading on top of it comes from the LIGHTING lock below. If LEFT’s underlying complexion reads lighter OR darker OR redder OR muddier than <IMAGE_1>, FAILED — repaint from <IMAGE_1>. FORBIDDEN: changing LEFT’s complexion/undertone to Sam’s / the companion’s / the beige wall’s; warming/cooling the base skin color; plastic/mannequin skin; borrowing Sam’s or the companion’s complexion; crushing medium/deep/Black skin charcoal/muddy; face darker than neck (classic failure).',
  'IDENTITY LOCK RIGHT / SEPARATION (CRITICAL): LEFT = <IMAGE_1> only. RIGHT Sam + companion = <IMAGE_0> only. Two separate people always. NEVER clone Sam onto LEFT. NEVER clone <IMAGE_1> onto Sam. NEVER twin / mirror / average the two adults.',
  'SAM + COMPANION LOCK (CRITICAL — DO NOT TOUCH): The bearded man and the smaller companion figure already on the RIGHT in <IMAGE_0> must stay identical to <IMAGE_0> — faces, skin, hair, clothing, hands, lighting. Do not invent or replace them.',
  'SAM + COMPANION IRIS LOCK (CRITICAL — ABSOLUTE): Sam and the companion MUST keep their EXACT iris colors, saturation, brightness, and iris fiber/detail from <IMAGE_0> — do NOT recolor, orange-tint, amber-shift, brighten, or rewrite their eyes. Complete open living eyes — pupils, irises, sclera, eyelids, lashes as in <IMAGE_0>. FORBIDDEN: blank/white-out/missing/melted eyes; painting their irises amber/orange/glowing; transferring <IMAGE_1> eye color onto them. If their eyes drift vs <IMAGE_0>, FAILED — restore from <IMAGE_0>.',
  'SAM + COMPANION IRIS GEOMETRY (CRITICAL — NO LOPSIDED EYES): Sam and the companion keep the SAME iris/pupil geometry as <IMAGE_0> — round irises of equal size per face, pupils centered in each iris, level gaze, equal sclera. Do NOT reshape, squash, oval, drop, or offset their irises/pupils while editing LEFT. FORBIDDEN: oval/squashed/egg-shaped irises; off-center/nasal/high/low pupils; one iris larger or higher; cross-eyed / wall-eyed drift; cut-off iris at the eyelid; any geometry change vs <IMAGE_0>. Lopsided Sam/girl eyes = FAILED — restore both faces’ eyes pixel-faithfully from <IMAGE_0> before finishing.',
  'TEXT: Copy on-image lettering from <IMAGE_0> exactly. Do NOT invent premiere dates or new words.',
  'Replace ONLY the featureless matte-white silhouette head (and any white neck/hands/skin) on the LEFT mannequin figure in the orange robe with <IMAGE_1>’s locked identity. Do NOT replace the bearded man or the companion. Do NOT fill the white silhouette with Sam’s face from the RIGHT.',
  'HEAD SIZE (CRITICAL — #1 CONSTRAINT AFTER CANVAS): LEFT head + hair MUST be ~5% LARGER than the white mannequin head in <IMAGE_0> (≈1.05× mannequin width and chin-to-crown). Measure vs orange-robe shoulders / neckline. Target: slightly bigger than the mannequin — NOT 1:1, NOT dramatically oversized vs Sam. FORBIDDEN: matching mannequin 1:1 (too small), shrinking into the mannequin bound, OR growing far past ~5% (big hair that blows past the 1.05× target). Center on the same neck as <IMAGE_0>. A LEFT head at mannequin size or much larger than ~5% = FAILED edit.',
  'IDENTITY (LEFT MANNEQUIN ONLY): Apply the IDENTITY LOCK LEFT above at the ~5% larger head-size target. <IMAGE_1> is the sole identity/skin source for LEFT; <IMAGE_2> is the sole iris source.',
  'EXPRESSION (CRITICAL — NEUTRAL): LEFT face must be neutral / calm — relaxed mouth, no smile, no frown. If <IMAGE_1> is smiling, laughing, frowning, scowling, or expressive, convert to this calm neutral while keeping identity. Smile is ONLY for the video loop, never this still. NOT a smile, grin, laugh, frown, scowl, or surprise.',
  'HEAD TILT (CRITICAL — LEFT — NO RIGHT TILT): LEFT head must be upright / level — ears even, chin centered, no lean. FORBIDDEN: tilting the head to the RIGHT (ear toward right shoulder), cocking, or rolling the face clockwise. If <IMAGE_1> is tilted right, straighten to upright while keeping identity. A RIGHT-tilted LEFT head = FAILED edit — straighten before finishing.',
  'LIGHTING (CRITICAL — LOCKED TO SAM’S FACE — NOT A COPY-PASTE): <IMAGE_1> and <IMAGE_2> are IDENTITY / IRIS references only — DISCARD their lighting, exposure, contrast, flatness, white balance, and studio look completely. RE-LIGHT the LEFT face, neck, and hands from scratch with the SAME light that falls on Sam’s face in <IMAGE_0>: same key-light direction, same side of the face in shadow, same shadow depth and softness under the brow, nose, cheekbones, and jaw, same highlight placement and strength on forehead/nose/cheeks, same contrast between lit and shadow sides, same color temperature, same overall exposure level relative to the beige wall. Hold LEFT’s face next to Sam’s face: they must read as photographed in the SAME shot, same moment, same lights. FORBIDDEN: a flat, evenly front-lit, shadowless face; a brighter/cleaner/studio-lit face than Sam’s; a face that looks pasted in from the My Character portrait or the selfie; selfie flash, ring light, outdoor sun, golden-hour, cinematic drama, plastic hotspots. Only the SHADING matches Sam — LEFT keeps <IMAGE_1>’s own skin color/undertone (SKIN ALBEDO LOCK). If LEFT’s face lighting does not match Sam’s face lighting, FAILED — re-light LEFT before finishing.',
  'NECK (CRITICAL — NEVER WHITE — MUST MATCH FACE + <IMAGE_1>): The LEFT neck from jawline into the robe neckline MUST be living skin continuous with the LEFT face — same tone, undertone, base lightness, pores/texture as <IMAGE_1> AND the face, under the same scene light as the face (natural shadow under the jaw like Sam). FORBIDDEN: mannequin-white neck; porcelain neck under a darker face; lightening the neck while darkening the face (or the reverse). Face and neck must read as the same person as <IMAGE_1>. Mismatched face/neck brightness = FAILED — repaint entire neck column AND face from <IMAGE_1>.',
  'HANDS (CRITICAL — NEVER WHITE): Every LEFT hand/wrist/finger visible in <IMAGE_0> MUST match the LEFT face / <IMAGE_1> skin tone, texture, AND base lightness exactly, shaded by the same scene light as the LEFT face. FORBIDDEN: mannequin-white, plaster, white gloves, white blobs into white pants/tee, lighter/darker hands than the face / <IMAGE_1>.',
  'HANDS VISIBLE (CRITICAL — LOCKED — ALWAYS SHOW): BOTH LEFT hands MUST stay visible in the output, in the SAME positions, poses, size, and finger layout as the mannequin hands in <IMAGE_0> (hanging at the sides out of the orange robe sleeves). FORBIDDEN: hiding hands inside the robe/sleeves/pockets, behind the body or robe billow, cropping them out of frame, covering them, removing them, or merging them into the robe/pants. Missing, hidden, or cropped LEFT hands = FAILED — restore both hands from <IMAGE_0> positions before finishing.',
  'HAIR: Match <IMAGE_1> hair style/color within the ~5% larger head silhouette — hair may fill that bound but must not grow far past the 1.05× target.',
  'HATS (REQUIRED — REMOVE): Remove hats/caps/beanies; show natural hair. Do not grow head past the ~5% target. Keep the robe’s own hood as in <IMAGE_0> (hood is wardrobe, not a hat).',
  'HEADWEAR (CRITICAL — DEFAULT NONE): Do NOT add a bandana, wrap, durag, scarf, or headband. Bare head / natural hair only UNLESS <IMAGE_1> clearly already wears a bandana/wrap/durag/scarf/headband — then keep that item only and recolor it to LEFT robe orange. NEVER invent headwear. Do NOT remove or reinvent the orange robe hood from <IMAGE_0>.',
  'NO GLOWING EYES (CRITICAL — ALL FIGURES): Eyes must be matte / natural photorealistic only. FORBIDDEN on anyone: glowing eyes, luminous pupils, light beams, bloom, neon, emissive/HDR eye glow, sci-fi shine.',
  'GLASSES (IF PRESENT — NO GLOW): If <IMAGE_1> wears glasses, keep the frames/lenses but REMOVE any glow, bloom, neon, luminous reflections, lens flare, or emissive shine on the glasses. Natural matte glass only — soft real-world reflections OK; glowing glasses = FAILED.',
  'NO ERASED EYES (CRITICAL — ALL FIGURES): Nobody may have blank, white, missing, or destroyed eyes. Sam + girl eyes = locked to <IMAGE_0>. LEFT eyes = full irises from <IMAGE_2> on <IMAGE_1>’s face.',
  'GENDER FIT (CRITICAL — LEFT FIGURE ONLY): Infer sex presentation from <IMAGE_1>. IF female / feminine: give feminine body proportions under the orange robe (shoulders, chest, waist) consistent with <IMAGE_1> while KEEPING the robe cut, embroidery, hood, length, and wind-billow silhouette from <IMAGE_0>. IF male / masculine: keep robe + tee + pants + body proportions as in <IMAGE_0> (do not feminize). Never change Sam or the girl. Gender fit must NOT change LEFT head away from the ~5% larger target.',
  'ROBE LOCK (CRITICAL): LEFT wardrobe = the long bright-orange hooded robe with white embroidery from <IMAGE_0> — same hue, same embroidery, same length, same wind-billowed shape. FORBIDDEN: replacing the robe with a short jacket, trenchcoat, or cape; changing robe orange hue.',
  'If unsure, change less — only the LEFT white mannequin regions. Prefer the ~5% larger head target over a tiny mannequin-sized head or a dramatically oversized head.',
  'FINAL GATE: Confirm BOTH LEFT hands are visible in the <IMAGE_0> positions; LEFT face lighting (key direction, shadow side, shadow depth, contrast, exposure) matches Sam’s face in <IMAGE_0> — not flat, not pasted-in; LEFT face/skin color match <IMAGE_1>; LEFT irises match <IMAGE_2> in color AND geometry (round, equal, centered pupils — not lopsided); Sam + girl iris colors AND geometry still match <IMAGE_0> (not lopsided, not rewritten).',
].join(' ');

/**
 * Wide 2:1 Personal Bitcoin Alien portrait.
 * <IMAGE_0> selfie identity/skin, <IMAGE_1> iris-ref (fiber texture), <IMAGE_2> personalalienplaceholder (bright orange COLOR LOCK).
 */
export const ALIEN_PORTRAIT_PROMPT = [
  'PRIORITY ORDER (ABSOLUTE): (1) identity + SKIN ALBEDO from <IMAGE_0> selfie. (2) COLOR LOCK from <IMAGE_2> orange field for jacket / iris HUE. (3) iris fiber texture from <IMAGE_1>. (4) CREAM scene background. (5) soft even studio lighting. (6) front pose.',
  'Create a wide portrait (aspect 2:1) of the SAME person as <IMAGE_0> as their Personal Bitcoin Alien character.',
  'SKIN ALBEDO LOCK (CRITICAL — ABSOLUTE #1 — FACE / NECK / HANDS): Face, neck, and any visible skin MUST match <IMAGE_0> exactly — same complexion, undertone, lightness/darkness, warmth/coolness, freckles/moles, pores, and surface texture. Compare side-by-side to <IMAGE_0>: if the portrait looks lighter OR darker OR redder OR muddier OR charcoalized vs <IMAGE_0> (especially Black / deep / rich brown skin), FAILED — repaint skin from <IMAGE_0>. FORBIDDEN: lightening, darkening, warming, cooling, “beauty” bleach, airbrushed plastic skin, inventing a different complexion, or rewriting albedo to “fit” the cream studio light.',
  'NO EYESHADOW / NO DARK EYE RINGS (CRITICAL): Do NOT add eyeshadow, smoky lids, under-eye dark circles, contour bands, or heavy shading around the eyes that is not clearly in <IMAGE_0>. Keep the eye area clean like the photo — natural lids/lashes only.',
  'COLOR LOCK FROM <IMAGE_2> (CRITICAL — JACKET / IRIS HUE): <IMAGE_2> is the default My Character profile plate — a white mannequin on a solid BRIGHT Bitcoin-orange field (~#F07317 / #F88D00 family). Jacket and iris HUE MUST match that exact bright orange field — same hue, saturation, and brightness. FORBIDDEN: dark orange, burnt orange, rust, copper, brown-orange, muddy orange, desaturated orange. If jacket/eyes look darker or rustier than <IMAGE_2>’s background, the edit FAILED — recolor to match <IMAGE_2> before finishing.',
  'IRIS (CRITICAL): BOTH irises — HUE/saturation/brightness from <IMAGE_2>’s orange field; radial fiber TEXTURE/detail from <IMAGE_1>. Matte photorealistic, natural wetness OK. FORBIDDEN: brown, blue, green, hazel, black, gray, dark/burnt iris, any <IMAGE_0> eye color; glow; bloom; neon. Complete eyes (pupil + iris + sclera).',
  'NO GLOWING EYES (CRITICAL): Eyes must be matte / natural photorealistic only. FORBIDDEN: glowing eyes, luminous pupils, light beams, bloom, neon, emissive/HDR eye glow, sci-fi shine.',
  'GLASSES (IF PRESENT — NO GLOW): If <IMAGE_0> wears glasses, keep the frames/lenses but REMOVE any glow, bloom, neon, luminous reflections, lens flare, or emissive shine on the glasses. Natural matte glass only — soft real-world reflections OK; glowing glasses = FAILED.',
  'BACKGROUND (CRITICAL — CREAM SCENE — NOT <IMAGE_2>): Plain solid cream background edge-to-edge behind the subject — warm cream / ivory / off-white cream (not pure white, not beige-tan wall). Soft even light on the cream field. FORBIDDEN: filling the whole canvas with <IMAGE_2>’s orange (orange is for jacket/iris only), gray, charcoal, busy scenes, outdoors, windows.',
  'IDENTITY ONLY FROM <IMAGE_0>: Use <IMAGE_0> ONLY for face identity (shape, features, skin albedo, skin texture, hair). Discard <IMAGE_0>\'s lighting, camera angle, pose, background, and eye color — but NEVER discard or “correct” <IMAGE_0>’s skin color.',
  'POSE (CRITICAL — FACE FORWARD): Head and face straight-on / front view. Eyes into camera. FORBIDDEN: 3/4 turn, looking left/right, profile, chin-down selfie angle. If <IMAGE_0> is turned, straighten to full frontal.',
  'EXPRESSION (CRITICAL — NEUTRAL): Neutral / calm mouth. If <IMAGE_0> is expressive, convert to neutral while keeping identity.',
  'LIGHTING (CRITICAL — SOFT EVEN STUDIO): Ignore <IMAGE_0> photo lighting. Soft even indoor studio light on face/neck — flat gentle key + soft fill. SKIN ALBEDO still locks to <IMAGE_0> while matching that studio light — do NOT bleach/crush complexion. FORBIDDEN: outdoor sun, golden-hour, cinematic drama, ring light, phone selfie flash, shiny plastic hotspots.',
  'HATS (REQUIRED — REMOVE): Remove hats/caps/beanies; show natural hair.',
  'HEADWEAR (CRITICAL — DEFAULT NONE): Do NOT invent bandanas/wraps. Only keep if clearly in <IMAGE_0>, then recolor to <IMAGE_2>’s bright orange.',
  'WARDROBE: zip/button jacket over a light tee (no poster text, no other people, no necklace required). Jacket hue MUST match <IMAGE_2>’s bright orange field — never rust/dark/burnt.',
  'GENDER FIT: Feminine <IMAGE_0> → feminine orange jacket cut + proportions. Masculine → menswear jacket cut. Do not feminize males.',
  'JACKET COLOR (CRITICAL): Exact match to <IMAGE_2> orange background field — bright Bitcoin orange, not rust.',
  'Head-and-shoulders framing, wide 2:1. No extra text, logos, or watermarks.',
  'FINAL GATE: Hold <IMAGE_0> next to the portrait face — if complexion/identity do not clearly match, FAILED — repaint face+neck from <IMAGE_0> until they do.',
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
  'PEOPLE COUNT LOCK (HARD FAIL IF BROKEN): EXACTLY three people for the entire clip — (1) LEFT = the orange-robe figure already in the still, (2) Sam (bearded man), (3) the little girl. FORBIDDEN: a 4th person, a new floating stranger, a cream/beige hoodie duplicate, cloning LEFT into a second body.',
  'LEVITATION LOCK (HARD FAIL IF BROKEN): ONLY LEFT leaves the ground and RISES. FORBIDDEN: inventing a separate flying person; swapping who flies; levitating Sam or the girl.',
  'HEIGHT LOCK (HARD FAIL IF BROKEN): LEFT rises only a few feet — not high in the sky. Keep LEFT large in frame at roughly the same scale as the still. FORBIDDEN: shooting into the clouds, shrinking into the distance, floating far above everyone, cutting off LEFT’s feet.',
  'HEAD IN FRAME (HARD FAIL IF BROKEN): LEFT’s head stays fully visible — never cropped or cut off. FORBIDDEN: head leaving frame; camera tilting so LEFT’s face exits frame.',
  'GAZE LOCK (HARD FAIL IF BROKEN): LEFT’s eyes stay SHUT / closed for the entire clip. Sam and the little girl look UP at LEFT. FORBIDDEN: LEFT opening eyes.',
  'FACING LOCK (HARD FAIL IF BROKEN): LEFT always faces straight at the camera — face, torso, shoulders, and hips forward like the still. FORBIDDEN: turning left/right, 3/4 profile, side view, chin tip up/down away from camera, twisting toward Sam/girl, spinning or revolving in the air while rising (no rotation of the body at any point — LEFT rises straight up, facing the camera the whole time).',
  'SHOT LOCK (HARD FAIL IF BROKEN): ONE continuous shot only — no crossfade, dissolve, cut, wipe, or morph between two shots/angles. Do NOT transpose or blend two different shots.',
  'IDENTITY LOCKS: LEFT face + clothing locked to the still — no identity swap. Outfit stays orange robe + white shirt. NO HOOD OVER HEAD. NO iris/eye/figure glow (no aura, bloom, emissive light). Sam + girl stay the same people — no identity swap.',
  'SILENT (HARD FAIL IF BROKEN): NO talking, lip-sync, or mouth movement — mouths closed / neutral. Sam never touches LEFT and his hand NEVER EXTENDS toward LEFT.',
  'FOOTWEAR LOCK (HARD FAIL IF BROKEN): LEFT keeps white shoes matching the white pants on while levitating. FORBIDDEN: bare feet, socks-only, dark/mismatched shoes. FORBIDDEN under LEFT’s feet/shoes: motion trails, speed lines, dust/sand/vapor/smoke/particles, afterimages — clean ground/air only.',
  'WALL FADE (CRITICAL — FROM 0:00): Plain wall behind the people fades out, revealing evening sky with soft clouds tinted like LEFT’s robe and white shirt. Titles / wall lettering stay locked visible — NEVER fade, move, or erase; do NOT add new text. FORBIDDEN: fading people, robe, or titles.',
  'BEAT: From 0:00, wall fades while LEFT rises. Sam and the little girl (on the ground) turn to look UP at LEFT. At 0:00, Sam’s free hand adjusts his own jacket and stays on it. Camera stays on LEFT. No lighting effects, no new props.',
].join(' ');

/**
 * Season One banner loop — image-to-video from composed Season One still.
 * 1.5s fade out / 1.5s fade in (through black) are applied in playback code, not here.
 * Do NOT narrate wardrobe/letters/crop already in the still — only motion + anti-drift.
 */
export const ALIEN_SEASONONE_VIDEO_PROMPT = [
  'IMAGE-TO-VIDEO from this exact input still. Do NOT restate framing, letters, wardrobe, crop, banner size, or pose already in the image — only add the face motion below.',
  'CAMERA (CRITICAL): Frozen / locked for the entire clip — no zoom, dolly, pan, tilt, Ken Burns, drift, or shake. ONLY the face may move.',
  'STATION (CRITICAL): Do not move the person in frame — no walk-closer, no left/right drift, no crowding/covering lettering that is already clear in the input.',
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
  return /content moderation|moderation|safety|rejected by content|rejected by moderation/i.test(
    detail
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * xAI content filter flakes often — keep retrying moderation rejects until success
 * or the wall-clock budget runs out (Lambda / create window).
 */
async function withGrokModerationRetries<T>(label: string, run: () => Promise<T>): Promise<T> {
  const budgetMs = (() => {
    const raw = process.env.GROK_MODERATION_RETRY_MS?.trim();
    if (raw && Number.isFinite(Number(raw))) return Math.max(60_000, Number(raw));
    /* Default: leave a little headroom under the 15m create / Lambda window. */
    return 14 * 60 * 1000;
  })();
  const deadline = Date.now() + budgetMs;
  let attempt = 0;
  let lastErr: unknown;

  while (Date.now() < deadline) {
    attempt += 1;
    try {
      return await run();
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      if (!isGrokContentModerationDetail(message)) throw err;
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      const wait = Math.min(30_000, Math.max(800, 400 * attempt), remaining);
      console.warn(
        `${label} content moderation reject — retry ${attempt}, wait ${wait}ms`,
        message
      );
      await sleep(wait);
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error(`${label} failed after content moderation retries`);
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
 * Keep retrying moderation rejects until success (or retry budget expires).
 */
async function grokImageEdit(args: {
  prompt: string | readonly string[];
  images: Array<{ url: string; type: string }>;
  aspectRatio: string;
}): Promise<Buffer> {
  const apiKey = grokApiKeyOrThrow();
  const prompt = grokPromptText(args.prompt);
  return withGrokModerationRetries('grokImageEdit', () =>
    grokImageEditOnce({
      prompt,
      images: args.images,
      aspectRatio: args.aspectRatio,
      apiKey,
    })
  );
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

/**
 * Ultra-wide SEASON ONE banner — single Grok edit.
 * `iris` = My Character portrait face (iris color/texture source).
 */
export async function composePersonalBitcoinAlienSeasonOne(args: {
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

/**
 * Wide 2:1 Personal Bitcoin Alien portrait — single Grok edit.
 * Order: selfie identity/skin, iris-ref texture, portrait-color hue plate.
 */
export async function composePersonalBitcoinAlienPortrait(args: {
  selfie: Buffer;
  iris: Buffer;
  /** Solid orange plate — jacket + iris HUE lock only (not scene background). */
  colorRef: Buffer;
}): Promise<Buffer> {
  const [identityJpeg, irisJpeg, colorJpeg] = await Promise.all([
    toIdentityJpeg(args.selfie),
    toCleanJpeg(args.iris),
    toCleanJpeg(args.colorRef, 1024),
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

const VIDEO_POLL_MS = 5000;
const VIDEO_POLL_MAX_MS = 8 * 60 * 1000;

function grokVideoErrorMessage(
  payload: {
    error?: { message?: string; code?: string } | string;
    message?: string;
  },
  fallback: string
): string {
  if (typeof payload.error === 'string' && payload.error.trim()) return payload.error.trim();
  if (payload.error && typeof payload.error === 'object') {
    const msg = payload.error.message?.trim();
    const code = payload.error.code?.trim();
    if (msg && code) return `${msg} (${code})`;
    if (msg) return msg;
    if (code) return code;
  }
  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message.trim();
  }
  return fallback;
}

/**
 * Image-to-video via xAI Grok Imagine (async generations + poll).
 * Default 480p; metaloop + Season One loop use 720p. GROK_VIDEO_RESOLUTION overrides all.
 */
async function generateAlienImageToVideoOnce(args: {
  imageJpeg: Buffer;
  prompt: string;
  durationSeconds: number;
  resolution: string;
  apiKey: string;
}): Promise<Buffer> {
  const startRes = await fetch('https://api.x.ai/v1/videos/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROK_VIDEO_MODEL?.trim() || 'grok-imagine-video-1.5-lite',
      prompt: args.prompt,
      image: { url: toDataUri(args.imageJpeg) },
      duration: args.durationSeconds,
      resolution: args.resolution,
    }),
  });

  const startRaw = await startRes.text();
  let startJson: {
    request_id?: string;
    error?: { message?: string; code?: string } | string;
    message?: string;
  };
  try {
    startJson = JSON.parse(startRaw) as typeof startJson;
  } catch {
    throw new Error(`Grok video start returned non-JSON (${startRes.status})`);
  }
  if (!startRes.ok || !startJson.request_id) {
    throw new Error(
      grokVideoErrorMessage(startJson, `Grok video start failed (${startRes.status})`)
    );
  }

  const requestId = startJson.request_id;
  const deadline = Date.now() + VIDEO_POLL_MAX_MS;
  let transientPollFails = 0;
  while (Date.now() < deadline) {
    await sleep(VIDEO_POLL_MS);
    let pollRes: Response;
    try {
      pollRes = await fetch(`https://api.x.ai/v1/videos/${encodeURIComponent(requestId)}`, {
        headers: { Authorization: `Bearer ${args.apiKey}` },
      });
    } catch (err) {
      transientPollFails += 1;
      if (transientPollFails >= 5) {
        const why = err instanceof Error ? err.message : 'network error';
        throw new Error(`Grok video poll connection failed — ${why}`);
      }
      continue;
    }
    const pollRaw = await pollRes.text();
    let pollJson: {
      status?: string;
      video?: { url?: string };
      error?: { message?: string; code?: string } | string;
      message?: string;
    };
    try {
      pollJson = JSON.parse(pollRaw) as typeof pollJson;
    } catch {
      transientPollFails += 1;
      if (transientPollFails >= 5) {
        throw new Error(`Grok video poll returned non-JSON (${pollRes.status})`);
      }
      continue;
    }
    /* Rate limit / overload — keep polling the same request_id. */
    if (!pollRes.ok) {
      if (
        pollRes.status === 429 ||
        pollRes.status === 502 ||
        pollRes.status === 503 ||
        pollRes.status === 504
      ) {
        transientPollFails += 1;
        if (transientPollFails >= 8) {
          throw new Error(
            grokVideoErrorMessage(pollJson, `Grok video poll failed (${pollRes.status})`)
          );
        }
        continue;
      }
      throw new Error(
        grokVideoErrorMessage(pollJson, `Grok video poll failed (${pollRes.status})`)
      );
    }
    transientPollFails = 0;
    const status = (pollJson.status || '').toLowerCase();
    if (status === 'done' || status === 'completed' || status === 'succeeded') {
      const url = pollJson.video?.url;
      if (!url) throw new Error('Grok video done but missing url');
      const vidRes = await fetch(url);
      if (!vidRes.ok) throw new Error(`Failed to download Grok video (${vidRes.status})`);
      return Buffer.from(await vidRes.arrayBuffer());
    }
    if (status === 'failed' || status === 'error' || status === 'cancelled') {
      throw new Error(grokVideoErrorMessage(pollJson, `Grok video ${status}`));
    }
  }
  throw new Error('Grok video generation timed out');
}

/**
 * Image-to-video via xAI Grok Imagine (async generations + poll).
 * Default 480p; metaloop + Season One loop use 720p. GROK_VIDEO_RESOLUTION overrides all.
 * Content-moderation rejects start a fresh generation until success (retry budget).
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
  const resolution =
    process.env.GROK_VIDEO_RESOLUTION?.trim() || args.resolution || '480p';
  const duration = Math.max(1, Math.min(15, Math.round(args.durationSeconds)));
  const imageJpeg = args.skipResize
    ? args.imageJpeg
    : await toCleanJpeg(args.imageJpeg, 2048);
  const prompt = grokPromptText(args.prompt);

  return withGrokModerationRetries('grokImageToVideo', () =>
    generateAlienImageToVideoOnce({
      imageJpeg,
      prompt,
      durationSeconds: duration,
      resolution,
      apiKey,
    })
  );
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
  // Banner as-is — Grok i2v keeps source aspect; do not crop/letterbox or narrate size in the prompt.
  return generateAlienImageToVideo({
    imageJpeg: seasonOneJpeg,
    prompt: ALIEN_SEASONONE_VIDEO_PROMPT,
    durationSeconds: 10,
    resolution: '720p',
  });
}

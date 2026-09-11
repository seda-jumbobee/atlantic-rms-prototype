/* ============================================================================
   Avatar image pipeline.

   A picked file is validated, decoded, centre-cropped to a square and scaled
   down before it is ever stored. The crop is what keeps the avatar from
   stretching, and the downscale is what keeps a 5 MB photo from blowing the
   origin's storage budget once it is encoded as a data URL.

   Every failure here is a real one — a rejected MIME type, a file over the
   limit, a decode that throws on a truncated or mislabelled file. None of the
   states are simulated.
   ========================================================================= */

export const AVATAR_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const AVATAR_ACCEPT_ATTR = "image/jpeg,image/png,image/webp";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const AVATAR_MAX_LABEL = "5 MB";
/** Stored edge length. Twice the largest place it renders (96px), for retina. */
export const AVATAR_EDGE = 256;

export type AvatarError =
  | { code: "type"; message: string }
  | { code: "size"; message: string }
  | { code: "decode"; message: string }
  | { code: "encode"; message: string };

export type AvatarResult = { ok: true; dataUrl: string } | { ok: false; error: AvatarError };

/** Type and size, checked before the file is read into memory. */
export function validateAvatarFile(file: File): AvatarError | null {
  if (!(AVATAR_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return { code: "type", message: "Unsupported file type. Upload a JPG, PNG, or WebP image." };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return {
      code: "size",
      message: `Image is too large. Upload an image smaller than ${AVATAR_MAX_LABEL}.`,
    };
  }
  return null;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });
}

/**
 * Validate → decode → centre-crop square → scale to AVATAR_EDGE → data URL.
 *
 * No minimum dimension is enforced: nothing downstream requires one, and
 * rejecting a small but perfectly valid photo would be an invented rule. A
 * source smaller than the target is left at its own size rather than being
 * upscaled into a blurry square.
 */
export async function prepareAvatar(file: File): Promise<AvatarResult> {
  const invalid = validateAvatarFile(file);
  if (invalid) return { ok: false, error: invalid };

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return {
      ok: false,
      error: { code: "decode", message: "We couldn’t use this image. Try uploading a different file." },
    };
  }

  const side = Math.min(img.naturalWidth, img.naturalHeight);
  if (!side) {
    return {
      ok: false,
      error: { code: "decode", message: "We couldn’t use this image. Try uploading a different file." },
    };
  }

  const edge = Math.min(AVATAR_EDGE, side);
  const canvas = document.createElement("canvas");
  canvas.width = edge;
  canvas.height = edge;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { ok: false, error: { code: "encode", message: "We couldn’t process this image. Please try again." } };
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    (img.naturalWidth - side) / 2, // centre crop
    (img.naturalHeight - side) / 2,
    side,
    side,
    0,
    0,
    edge,
    edge
  );

  try {
    // JPEG keeps the encoded string small; the avatar is always opaque and
    // square by this point, so transparency is not being discarded.
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    if (!dataUrl.startsWith("data:image/")) throw new Error("encode");
    return { ok: true, dataUrl };
  } catch {
    return { ok: false, error: { code: "encode", message: "We couldn’t process this image. Please try again." } };
  }
}

/* ============================================================================
   Driver photos.

   Same validation as an avatar — type first, then size, both before the file
   is read into memory — but no crop: a photo of a loaded vehicle is evidence,
   and cropping it to a square would throw away the part that matters. It is
   only scaled down, and only when it is larger than the target.

   The downscale is not cosmetic. These are stored as data URLs in the browser,
   which has a few megabytes to spend for the whole origin, so a 4 MB phone
   photo has to become ~150 KB before it is kept.
   ========================================================================= */

export const PHOTO_ACCEPTED_TYPES = AVATAR_ACCEPTED_TYPES;
export const PHOTO_ACCEPT_ATTR = AVATAR_ACCEPT_ATTR;
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024; // 10 MB — a phone photo, uncompressed
export const PHOTO_MAX_LABEL = "10 MB";
/** Longest stored edge. Large enough to read a plate or a lashing point. */
export const PHOTO_MAX_EDGE = 1024;

export type PhotoError = AvatarError;
export type PhotoResult =
  | { ok: true; dataUrl: string; width: number; height: number }
  | { ok: false; error: PhotoError };

export function validatePhotoFile(file: File): PhotoError | null {
  if (!(PHOTO_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return { code: "type", message: "Unsupported file type. Upload a JPG, PNG, or WebP image." };
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return {
      code: "size",
      message: `Photo is too large. Upload an image smaller than ${PHOTO_MAX_LABEL}.`,
    };
  }
  return null;
}

/** Validate → decode → scale the long edge to PHOTO_MAX_EDGE → JPEG data URL. */
export async function preparePhoto(file: File): Promise<PhotoResult> {
  const invalid = validatePhotoFile(file);
  if (invalid) return { ok: false, error: invalid };

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return { ok: false, error: { code: "decode", message: "That image couldn’t be read. Try another file." } };
  }

  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  // Never upscale: a small photo stays its own size rather than becoming a
  // blurry large one.
  const scale = longest > PHOTO_MAX_EDGE ? PHOTO_MAX_EDGE / longest : 1;
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { ok: false, error: { code: "encode", message: "We couldn’t process that image. Please try again." } };
  ctx.drawImage(img, 0, 0, w, h);

  try {
    return { ok: true, dataUrl: canvas.toDataURL("image/jpeg", 0.75), width: w, height: h };
  } catch {
    return { ok: false, error: { code: "encode", message: "We couldn’t process that image. Please try again." } };
  }
}

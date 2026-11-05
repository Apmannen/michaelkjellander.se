export const IMAGE_BUCKET = 'cms-images';

// Same limit as the bucket, see db/005_cms_images.sql.
export const MAX_IMAGE_SIZE = 1024 * 1024;

export type Image = {
  // Relative to the bucket.
  path: string;
  alt: string;
  width: number;
  height: number;
};

// An image that has been uploaded but not yet described.
export type UploadedImage = Omit<Image, 'alt'>;

type ImageFormat = {
  extension: string;
  contentType: string;
  matches: (bytes: Uint8Array) => boolean;
};

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.subarray(start, end));

// Recognized by their file signatures, so the stored type doesn't depend on
// what the browser claims.
const IMAGE_FORMATS: ImageFormat[] = [
  {
    extension: 'jpg',
    contentType: 'image/jpeg',
    matches: (bytes) =>
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  {
    extension: 'png',
    contentType: 'image/png',
    matches: (bytes) => ascii(bytes, 0, 8) === '\x89PNG\r\n\x1a\n',
  },
  {
    extension: 'webp',
    contentType: 'image/webp',
    matches: (bytes) =>
      ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP',
  },
  {
    extension: 'gif',
    contentType: 'image/gif',
    matches: (bytes) => ascii(bytes, 0, 4) === 'GIF8',
  },
];

// For <input type="file" accept>.
export const IMAGE_ACCEPT = IMAGE_FORMATS.map(
  (format) => format.contentType,
).join(',');

export const detectImageFormat = (bytes: Uint8Array) =>
  IMAGE_FORMATS.find((format) => format.matches(bytes));

// Uploads are named <uuid>.<extension>.
const IMAGE_PATH_PATTERN = new RegExp(
  `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(${IMAGE_FORMATS.map((format) => format.extension).join('|')})$`,
);

// NEXT_PUBLIC_SUPABASE_URL is set from SUPABASE_URL in next.config.ts, so the
// browser can build image URLs too.
export const imageUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;

const isDimension = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

// Sanitizes untrusted input. Undefined if it isn't an uploaded image.
export const parseImage = (raw: unknown): Image | undefined => {
  if (typeof raw !== 'object' || !raw) {
    return undefined;
  }

  const { path, alt, width, height } = raw as Record<string, unknown>;
  if (
    typeof path !== 'string' ||
    !IMAGE_PATH_PATTERN.test(path) ||
    !isDimension(width) ||
    !isDimension(height)
  ) {
    return undefined;
  }

  return {
    path,
    alt: typeof alt === 'string' ? alt.trim() : '',
    width,
    height,
  };
};

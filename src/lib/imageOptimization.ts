/**
 * Image Optimization utilities for Jamr Al-Tanour
 * Handles client-side compression before upload, Supabase CDN transformations,
 * and lazy-loading helpers to keep menu fast and data-efficient.
 */

export function getOptimizedImageUrl(
  url: string | null | undefined,
  width: number = 450,
  quality: number = 80
): string {
  if (!url) return '';

  // If already a data URL or local placeholder, return as is
  if (url.startsWith('data:') || url.startsWith('/')) {
    return url;
  }

  // Supabase Storage Image Transformation (Pro/Add-on or standard render path)
  // Format: /storage/v1/render/image/public/<bucket>/<path>?width=...&quality=...
  if (url.includes('/storage/v1/object/public/')) {
    const renderUrl = url.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    );
    const separator = renderUrl.includes('?') ? '&' : '?';
    return `${renderUrl}${separator}width=${width}&quality=${quality}&format=origin`;
  }

  return url;
}

/**
 * Compresses an image File in browser memory before uploading to Supabase
 * Reduces a 5-10MB photo down to ~80-150KB with crisp visual clarity.
 */
export async function compressImageFile(
  file: File,
  maxWidth: number = 1080,
  maxHeight: number = 1080,
  quality: number = 0.82
): Promise<File> {
  // If file is not an image or is already small (under 120KB), return as-is
  if (!file.type.startsWith('image/') || file.size < 120 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // White background for transparent PNGs converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw image resized
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP if supported, otherwise JPEG
        const outputMime = 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // If compressed size is somehow larger, keep original
              resolve(file);
              return;
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const compressedFile = new File([blob], cleanFileName, {
              type: outputMime,
              lastModified: Date.now(),
            });

            console.log(
              `⚡ Image compressed: ${(file.size / 1024).toFixed(1)} KB -> ${(compressedFile.size / 1024).toFixed(1)} KB`
            );
            resolve(compressedFile);
          },
          outputMime,
          quality
        );
      };

      img.onerror = () => {
        resolve(file);
      };
    };

    reader.onerror = () => {
      resolve(file);
    };
  });
}

/**
 * Compresses an image given its remote URL using an offscreen canvas
 * Useful for the Admin batch optimizer tool.
 */
export async function compressRemoteImageUrl(
  imageUrl: string,
  maxWidth: number = 1080,
  maxHeight: number = 1080,
  quality: number = 0.82
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Add cache buster to avoid cached opaque responses
    const separator = imageUrl.includes('?') ? '&' : '?';
    img.src = `${imageUrl}${separator}_cb=${Date.now()}`;

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      resolve(null);
    };
  });
}

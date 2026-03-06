import { get, set, del } from 'idb-keyval';

const STORE_KEY = 'malerdoku-projects';

export async function loadProjects() {
  try {
    const data = await get(STORE_KEY);
    return data || [];
  } catch (e) {
    console.error('Load error:', e);
    return [];
  }
}

export async function saveProjects(projects) {
  try {
    await set(STORE_KEY, projects);
  } catch (e) {
    console.error('Save error:', e);
  }
}

// Compress image to reduce storage size
export function compressImage(dataUrl, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxWidth) {
        h = (maxWidth / w) * h;
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

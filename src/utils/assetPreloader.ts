// Asset preloader utility to handle asset loading without console errors
export const preloadAsset = (src: string, type: 'image' | 'font' = 'image'): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (type === 'image') {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => {
        // Silently handle asset loading errors to prevent console spam
        console.debug(`Asset not found: ${src}`);
        resolve(); // Don't reject to prevent breaking the app
      };
      img.src = src;
    } else {
      // Handle other asset types if needed
      resolve();
    }
  });
};

export const preloadAssets = async (assets: string[]): Promise<void> => {
  try {
    await Promise.allSettled(assets.map(asset => preloadAsset(asset)));
  } catch (error) {
    console.debug('Some assets failed to preload:', error);
  }
};
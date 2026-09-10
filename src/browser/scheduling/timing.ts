// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function once<T extends (...args: any[]) => unknown>(func: T) {
  let executed = false;
  return function (...args: Parameters<T>) {
    if (executed) {
      return undefined;
    }
    executed = true;
    return func(...args);
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(func: T, delay: number, mustRunDelay = Infinity) {
  let timer: number | null = null;
  let startTime: number | null = null;

  return function (...args: Parameters<T>) {
    const currentTime = Date.now();

    if (timer) {
      clearTimeout(timer);
    }

    if (!startTime) {
      startTime = currentTime;
    }

    if (currentTime - startTime >= mustRunDelay) {
      func(...args);
      startTime = currentTime;
    } else {
      timer = window.setTimeout(() => {
        func(...args);
      }, delay);
    }
  };
}

export function waitForVideosToLoad(delayMs: number, onLoaded: () => void) {
  // Wait for videos to load before spacing to avoid layout shifts
  // See: https://github.com/vinta/pangu.js/issues/117
  // A hidden player (closed lightbox, no src) never fires loadeddata and cannot be disturbed by spacing, so only visible videos gate the page pass
  // TODO: we could also use checkVisibility()
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility
  const videos = Array.from(document.getElementsByTagName('video')).filter((video) => video.getClientRects().length > 0);

  if (videos.length === 0) {
    // No videos, proceed with normal delay
    setTimeout(onLoaded, delayMs);
  } else {
    // Check if all videos are already loaded
    const allVideosLoaded = videos.every((video) => video.readyState >= 3);

    if (allVideosLoaded) {
      // All videos loaded, proceed with normal delay
      setTimeout(onLoaded, delayMs);
    } else {
      // Wait for all videos to load
      let loadedCount = 0;
      const videoCount = videos.length;

      const checkAllLoaded = () => {
        loadedCount++;
        if (loadedCount >= videoCount) {
          setTimeout(onLoaded, delayMs);
        }
      };

      for (const video of videos) {
        if (video.readyState >= 3) {
          checkAllLoaded();
        } else {
          video.addEventListener('loadeddata', checkAllLoaded, { once: true });
        }
      }

      // Fallback timeout in case videos never load
      setTimeout(onLoaded, delayMs + 5000);
    }
  }
}

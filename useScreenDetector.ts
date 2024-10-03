import { useState, useEffect } from 'react';

const SCREEN_TYPE_MAP = {
  INIT: 0,
  MOBILE: 1,
  WEB_BROWSER: 2,
};
function useScreenDetector() {
  const [screenType, setScreenType] = useState(SCREEN_TYPE_MAP.INIT);

  useEffect(() => {
    const UA = navigator.userAgent;
    const hasTouchScreen =
      /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
      /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA);
    setScreenType(hasTouchScreen ? SCREEN_TYPE_MAP.MOBILE : SCREEN_TYPE_MAP.WEB_BROWSER);
    return () => {
      setScreenType(SCREEN_TYPE_MAP.INIT);
    };
  }, []);

  return { screenType, SCREEN_TYPE_MAP };
}

export default useScreenDetector;

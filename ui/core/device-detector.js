export const DeviceDetector = {
    isMobile: () => {
        const mobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (mobileUA) return true;

        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const smallScreen = window.innerWidth <= 768;
        return hasTouch && smallScreen;
    },

    isTablet: () => {
        if (/iPad/i.test(navigator.userAgent)) return true;
        if (/Android(?!.*Mobile)/i.test(navigator.userAgent) && window.innerWidth >= 768) return true;
        return false;
    },

    isTouchDevice: () => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    getDeviceType: () => {
        if (/iPhone|iPod|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            return 'mobile';
        }
        if (/iPad|Android(?!.*Mobile)/i.test(navigator.userAgent)) {
            return 'tablet';
        }

        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (window.innerWidth <= 768 && hasTouch) {
            return 'mobile';
        }
        if (window.innerWidth > 768 && window.innerWidth <= 1024 && hasTouch) {
            return 'tablet';
        }

        return 'desktop';
    },
};

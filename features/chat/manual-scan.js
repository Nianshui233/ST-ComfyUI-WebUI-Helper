export function createManualScanController() {
    let controls = null;
    let enabled = false;

    return {
        setControls(nextControls) {
            controls = nextControls;
        },
        hasControls() {
            return Boolean(controls);
        },
        isEnabled() {
            return enabled;
        },
        start() {
            if (!controls) return false;
            enabled = true;
            controls.start?.();
            return true;
        },
        stop() {
            enabled = false;
            controls?.stop?.();
        },
        async scanNow() {
            if (!controls) return false;
            enabled = true;
            await controls.scanNow?.();
            return true;
        },
    };
}

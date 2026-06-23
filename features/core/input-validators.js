export const InputValidators = {
    dimension: (val) => {
        const num = parseInt(val);
        return !isNaN(num) && num >= 64 && num <= 8192 && num % 8 === 0;
    },

    cfg: (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 1 && num <= 30;
    },

    steps: (val) => {
        const num = parseInt(val);
        return !isNaN(num) && num >= 1 && num <= 150;
    },

    url: (val) => {
        try {
            const normalized = /^https?:\/\//i.test(val) ? val : `http://${val}`;
            new URL(normalized);
            return true;
        } catch {
            return false;
        }
    },
};

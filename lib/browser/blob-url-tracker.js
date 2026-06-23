// Keeps object URLs grouped so cache refreshes do not revoke images still shown in chat.
export const BlobURLTracker = {
    urls: new Map(),

    create(blob, tag = 'default') {
        const url = URL.createObjectURL(blob);
        this.urls.set(url, tag);
        return url;
    },

    revoke(url) {
        if (!this.urls.has(url)) return;
        URL.revokeObjectURL(url);
        this.urls.delete(url);
    },

    revokeAll(tag = null) {
        for (const [url, urlTag] of this.urls) {
            if (tag !== null && urlTag !== tag) continue;
            URL.revokeObjectURL(url);
            this.urls.delete(url);
        }
    },
};

import { GM_addStyle, GM_getValue, GM_setValue, GM_xmlhttpRequest } from './lib/browser/tampermonkey-compat.js';
import * as SillyTavernScript from '../../../../script.js';
import { getContext } from '../../../extensions.js';
import { createComfyWebuiHelperApp } from './features/app/app-composition.js';

const {
    generateQuietPrompt,
    generateRaw,
    saveChatConditional,
} = SillyTavernScript;

const app = createComfyWebuiHelperApp({
    addStyle: GM_addStyle,
    getValue: GM_getValue,
    setValue: GM_setValue,
    request: GM_xmlhttpRequest,
    generateQuietPrompt,
    generateRaw,
    saveChatConditional,
    getContext,
});

export function init() {
    app.init();
}

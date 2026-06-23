import { getPanelFoundationStyles } from '../styles/panel-foundation-styles.js';
import { getPanelControlStyles } from '../styles/panel-control-styles.js';
import { getPanelWorkflowStyles } from '../styles/panel-workflow-styles.js';
import { getPanelLoraCacheStyles } from '../styles/panel-lora-cache-styles.js';
import { getChatImageStyles } from '../styles/chat-image-styles.js';
import { getAiPromptPanelStyles } from '../styles/ai-prompt-panel-styles.js';

export function getPanelStyles({ panelId, buttonId }) {
    return [
        getPanelFoundationStyles({ panelId, buttonId }),
        getPanelControlStyles({ panelId, buttonId }),
        getPanelWorkflowStyles({ panelId, buttonId }),
        getPanelLoraCacheStyles({ panelId, buttonId }),
        getChatImageStyles({ panelId, buttonId }),
        getAiPromptPanelStyles({ panelId, buttonId }),
    ].join('');
}

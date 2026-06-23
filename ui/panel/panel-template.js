import { getPanelShellTemplate } from '../templates/panel-shell-template.js';
import { getPanelGeneralTemplate } from '../templates/panel-general-template.js';
import { getPanelGenerationTemplate } from '../templates/panel-generation-template.js';
import { getPanelPromptTemplate } from '../templates/panel-prompt-template.js';
import { getPanelWorkflowLoraTemplate } from '../templates/panel-workflow-lora-template.js';
import { getPanelLogTemplate } from '../templates/panel-log-template.js';
import { getPanelCacheModalTemplate } from '../templates/panel-cache-modal-template.js';

export function getPanelHtml({ panelId, modes }) {
    return [
        getPanelShellTemplate({ panelId, modes }),
        getPanelGeneralTemplate({ panelId, modes }),
        getPanelGenerationTemplate({ panelId, modes }),
        getPanelPromptTemplate({ panelId, modes }),
        getPanelWorkflowLoraTemplate({ panelId, modes }),
        getPanelLogTemplate({ panelId, modes }),
        getPanelCacheModalTemplate({ panelId, modes }),
    ].join('');
}

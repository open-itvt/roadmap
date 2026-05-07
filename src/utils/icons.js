"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_ICON_COMPONENTS = void 0;
exports.normalizeProjectIconInput = normalizeProjectIconInput;
exports.renderProjectIcon = renderProjectIcon;
exports.renderStageIcon = renderStageIcon;
const fa_1 = require("react-icons/fa");
const EMOJI_ICON_KEY_MAP = {
    '🚀': 'rocket',
    '⚙️': 'cogs',
    '📱': 'mobile',
    '☁️': 'cloud',
    '🔒': 'lock',
    '🗄️': 'database',
    '📊': 'chart',
    '🎨': 'design',
    '🌍': 'globe',
};
const PROJECT_ICON_COMPONENTS = {
    rocket: fa_1.FaRocket,
    cogs: fa_1.FaCogs,
    mobile: fa_1.FaMobileAlt,
    cloud: fa_1.FaCloud,
    lock: fa_1.FaLock,
    database: fa_1.FaDatabase,
    chart: fa_1.FaChartLine,
    design: fa_1.FaPaintBrush,
    globe: fa_1.FaGlobe,
};
exports.PROJECT_ICON_COMPONENTS = PROJECT_ICON_COMPONENTS;
function normalizeProjectIconInput(value) {
    const trimmed = value.trim();
    if (!trimmed)
        return '';
    return EMOJI_ICON_KEY_MAP[trimmed] || trimmed;
}
function renderProjectIcon(value) {
    const trimmed = value?.trim() || '';
    if (!trimmed)
        return <fa_1.FaFolderOpen />;
    const Icon = PROJECT_ICON_COMPONENTS[trimmed.toLowerCase()];
    if (Icon)
        return <Icon />;
    return trimmed;
}
function renderStageIcon(value) {
    const trimmed = value?.trim() || '';
    if (!trimmed)
        return <fa_1.FaCode />;
    if (trimmed === 'check')
        return <fa_1.FaCheckCircle />;
    if (trimmed === 'dot')
        return <fa_1.FaClock />;
    if (/^\d+$/.test(trimmed))
        return trimmed;
    return trimmed.length <= 2 ? trimmed : <fa_1.FaCode />;
}

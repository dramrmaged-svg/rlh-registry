"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESUMABLE_FROM_DEFERRED = exports.EPISODE_TRANSITIONS = exports.EPISODE_STATUSES = void 0;
exports.isValidEpisodeTransition = isValidEpisodeTransition;
exports.computeEpisodeAvailableActions = computeEpisodeAvailableActions;
exports.EPISODE_STATUSES = [
    'REFERRED',
    'AWAITING_MDT',
    'MDT_APPROVED',
    'CLINIC_ASSESSMENT_COMPLETED',
    'AWAITING_MAPPING',
    'MAPPING_COMPLETED',
    'AWAITING_DOSIMETRY',
    'TREATMENT_APPROVED',
    'AWAITING_TREATMENT',
    'TREATMENT_COMPLETED',
    'EARLY_FOLLOW_UP',
    'IMAGING_FOLLOW_UP',
    'COMPLETED',
    'CANCELLED',
    'DEFERRED',
    'NOT_SUITABLE',
    'LOST_TO_FOLLOW_UP',
];
/**
 * The episode status workflow graph. DEFERRED is reachable from most
 * "in-progress" states (captured explicitly below) but is left via the
 * dedicated `/resume` action back to `deferredFromStatus`, not via this
 * graph — that avoids a combinatorial explosion of "deferred-from-X" edges.
 */
exports.EPISODE_TRANSITIONS = {
    REFERRED: ['AWAITING_MDT', 'CANCELLED', 'NOT_SUITABLE', 'DEFERRED'],
    AWAITING_MDT: ['MDT_APPROVED', 'NOT_SUITABLE', 'DEFERRED', 'CANCELLED'],
    MDT_APPROVED: ['CLINIC_ASSESSMENT_COMPLETED', 'NOT_SUITABLE', 'DEFERRED', 'CANCELLED'],
    CLINIC_ASSESSMENT_COMPLETED: ['AWAITING_MAPPING', 'NOT_SUITABLE', 'DEFERRED', 'CANCELLED'],
    AWAITING_MAPPING: ['MAPPING_COMPLETED', 'NOT_SUITABLE', 'DEFERRED', 'CANCELLED'],
    MAPPING_COMPLETED: ['AWAITING_DOSIMETRY', 'NOT_SUITABLE', 'DEFERRED', 'CANCELLED'],
    AWAITING_DOSIMETRY: ['TREATMENT_APPROVED', 'NOT_SUITABLE', 'DEFERRED', 'CANCELLED'],
    TREATMENT_APPROVED: ['AWAITING_TREATMENT', 'NOT_SUITABLE', 'DEFERRED', 'CANCELLED'],
    AWAITING_TREATMENT: ['TREATMENT_COMPLETED', 'CANCELLED', 'DEFERRED'],
    TREATMENT_COMPLETED: ['EARLY_FOLLOW_UP'],
    EARLY_FOLLOW_UP: ['IMAGING_FOLLOW_UP', 'LOST_TO_FOLLOW_UP'],
    IMAGING_FOLLOW_UP: ['COMPLETED', 'LOST_TO_FOLLOW_UP'],
    COMPLETED: [],
    CANCELLED: [],
    NOT_SUITABLE: [],
    LOST_TO_FOLLOW_UP: [],
    DEFERRED: [],
};
/** Statuses DEFERRED may be resumed back into via POST /episodes/:id/resume. */
exports.RESUMABLE_FROM_DEFERRED = [
    'REFERRED',
    'AWAITING_MDT',
    'MDT_APPROVED',
    'CLINIC_ASSESSMENT_COMPLETED',
    'AWAITING_MAPPING',
    'MAPPING_COMPLETED',
    'AWAITING_DOSIMETRY',
    'TREATMENT_APPROVED',
    'AWAITING_TREATMENT',
];
function isValidEpisodeTransition(from, to) {
    return exports.EPISODE_TRANSITIONS[from]?.includes(to) ?? false;
}
/**
 * Which actions the UI should offer for the current status. Mirrors
 * `computeMdtAvailableActions` in mdt.service.ts.
 */
function computeEpisodeAvailableActions(status) {
    const actions = [];
    if (status === 'DEFERRED') {
        actions.push('resume');
    }
    else if (exports.EPISODE_TRANSITIONS[status].length > 0) {
        actions.push('transition');
    }
    actions.push('duplicate');
    return actions;
}

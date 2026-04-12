"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alreadyInState = alreadyInState;
exports.transitioned = transitioned;
function alreadyInState(record) {
    return { record, alreadyInState: true };
}
function transitioned(record) {
    return { record, alreadyInState: false };
}

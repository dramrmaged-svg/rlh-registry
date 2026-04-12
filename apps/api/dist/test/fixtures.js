"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedUser = seedUser;
exports.seedPatient = seedPatient;
exports.seedMdtSession = seedMdtSession;
exports.seedMdtRecord = seedMdtRecord;
const bcrypt = __importStar(require("bcrypt"));
const ROUNDS = 4;
async function seedUser(client, opts = {}) {
    return client.user.create({
        data: {
            email: opts.email ?? `test-${Date.now()}@nhs.net`,
            passwordHash: await bcrypt.hash('TestPass123!', ROUNDS),
            firstName: 'Test',
            lastName: 'User',
            role: (opts.role ?? 'CONSULTANT_IR'),
            isActive: opts.isActive ?? true,
        },
    });
}
async function seedPatient(client, createdById, opts = {}) {
    return client.patient.create({
        data: {
            firstName: opts.firstName ?? 'James',
            lastName: opts.lastName ?? 'Miller',
            dateOfBirth: new Date('1965-04-12'),
            sex: 'MALE',
            createdById,
            updatedById: createdById,
        },
    });
}
async function seedMdtSession(client, createdById) {
    return client.mdtSession.create({
        data: { sessionDate: new Date('2024-03-20'), createdById },
    });
}
async function seedMdtRecord(client, opts) {
    return client.mdtRecord.create({
        data: {
            patientId: opts.patientId,
            mdtSessionId: opts.mdtSessionId,
            lockStatus: (opts.lockStatus ?? 'DRAFT'),
            createdById: opts.createdById,
            updatedById: opts.createdById,
        },
    });
}

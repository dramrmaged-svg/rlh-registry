export interface PatientSummary {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  isActive: boolean;
  primaryIdentifier: { identifierType: string; value: string; isActive: boolean } | null;
  primaryDiagnosis: { tumourType: string; bclcStage: string | null } | null;
}

export interface PatientDetail extends PatientSummary {
  ethnicity: string | null;
  gpPractice: string | null;
  referringHospital: string | null;
  version: number;
  identifiers: Array<{ id: string; identifierType: string; value: string }>;
}

export interface EpisodeSummary {
  id: string;
  patientId: string;
  episodeNumber: number;
  firstOrRepeat: string;
  previousEpisodeId: string | null;
  status: string;
  deferredFromStatus: string | null;
  availableActions: string[];
  referralDate: string | null;
  referralSource: string | null;
  version: number;
  createdAt: string;
}

export interface EpisodeDetail extends EpisodeSummary {
  referringClinicianOverride: string | null;
  diagnosis: { id: string; tumourType: string; aetiology: string | null; confirmedBclcStage: string | null; confirmedCpGrade: string | null } | null;
  completeness: {
    hasDiagnosis: boolean;
    mdtRecordCount: number;
    lesionCount: number;
    mappingSessionCount: number;
    dosimetryPlanCount: number;
    treatmentSessionCount: number;
    followUpCount: number;
    toxicityEventCount: number;
  };
}

export interface TimelineEvent {
  type: string;
  label: string;
  date: string | null;
  entityId: string | null;
}

export interface ReadinessFinding {
  code: string;
  severity: 'BLOCK' | 'WARNING';
  message: string;
  field?: string;
}

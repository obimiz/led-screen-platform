export const maintenanceRequestStatuses=["new","contacted","inspection-scheduled","diagnosing","awaiting-quotation","quoted","awaiting-approval","approved","repair-scheduled","in-progress","testing","completed","cancelled","closed"] as const;
export const maintenanceJobStatuses=["scheduled","inspection","diagnosis","awaiting-approval","approved","repair-in-progress","testing","completed","cancelled","closed"] as const;
export const maintenanceServiceTypes=["repair","preventive-maintenance","inspection","troubleshooting","emergency-service","screen-calibration","configuration","module-replacement","power-system-service","controller-service","structural-inspection","cleaning","other"] as const;
export const maintenanceIssueCategories=["no-display","partial-display","dead-modules","flickering","color-problem","brightness-problem","power-failure","controller-problem","receiving-card","sending-card","processor-problem","cable-connection","software-configuration","physical-damage","water-damage","overheating","mounting-structure","intermittent-fault","unknown","other"] as const;
export const maintenanceOperationalStatuses=["working-with-issues","partially-working","completely-down","intermittent","unknown"] as const;
export const maintenanceUrgencies=["normal","high","urgent","emergency"] as const;
export const equipmentSources=["our-installation","external-installation","unknown"] as const;
export const warrantyStatuses=["unknown","not-applicable","potentially-covered","active","expired","manually-approved","manually-denied"] as const;

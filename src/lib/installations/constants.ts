export const installationRequestStatuses = ["new","contacted","assessment-required","assessment-scheduled","assessed","reviewing","quoted","accepted","declined","converted","closed"] as const;
export const installationTypes = ["indoor-wall","outdoor-wall","freestanding","rooftop","billboard","stage","church","auditorium","conference-room","commercial-display","custom"] as const;
export const intendedUses = ["church","auditorium","advertising","corporate","retail","hotel","school","event-centre","stadium","conference","broadcast","entertainment","other"] as const;
export const assessmentStatuses = ["scheduled","in-progress","completed","cancelled"] as const;
export const projectStatuses = ["planning","scheduled","materials-preparation","site-preparation","installation-in-progress","configuration","testing","commissioning","completed","on-hold","cancelled"] as const;
export const taskStatuses = ["pending","in-progress","completed","skipped"] as const;

export const domainEventTypes=["contact.enquiry.created","order.created","payment.successful","payment.failed","inventory.low-stock","system.general"] as const;
export type DomainEventType=(typeof domainEventTypes)[number];
export type DomainEvent={type:DomainEventType;payload:Record<string,unknown>};

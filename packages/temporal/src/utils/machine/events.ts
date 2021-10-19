import type { EventObject } from 'xstate';

export function assertEventType<
    TE extends EventObject,
    TType extends TE['type'],
>(event: TE, eventType: TType): asserts event is TE & { type: TType } {
    if (event.type !== eventType) {
        throw new Error(
            `Invalid event: expected "${eventType}", got "${event.type}"`,
        );
    }
}

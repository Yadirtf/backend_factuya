import { v4 as uuidv4 } from 'uuid';

export enum WebhookEvent {
    INVOICE_CREATED = 'INVOICE_CREATED',
    INVOICE_SENT_TO_DIAN = 'INVOICE_SENT_TO_DIAN',
    INVOICE_ACCEPTED = 'INVOICE_ACCEPTED',
    INVOICE_REJECTED = 'INVOICE_REJECTED',
}

export interface WebhookProps {
    id: string;
    companyId: string;
    url: string;
    events: WebhookEvent[];
    secret: string; // For HMAC signature
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class Webhook {
    private constructor(private readonly props: WebhookProps) { }

    get id(): string { return this.props.id; }
    get companyId(): string { return this.props.companyId; }
    get url(): string { return this.props.url; }
    get events(): WebhookEvent[] { return this.props.events; }
    get secret(): string { return this.props.secret; }
    get isActive(): boolean { return this.props.isActive; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }

    static create(props: {
        companyId: string;
        url: string;
        events?: WebhookEvent[];
    }): Webhook {
        return new Webhook({
            id: uuidv4(),
            companyId: props.companyId,
            url: props.url,
            events: props.events || [WebhookEvent.INVOICE_ACCEPTED, WebhookEvent.INVOICE_REJECTED],
            secret: `whsec_${uuidv4().replace(/-/g, '')}`,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    static reconstruct(props: WebhookProps): Webhook {
        return new Webhook(props);
    }

    update(props: Partial<Pick<WebhookProps, 'url' | 'events' | 'isActive'>>): void {
        Object.assign(this.props, props);
        this.props.updatedAt = new Date();
    }

    toJSON() {
        return {
            id: this.id,
            companyId: this.companyId,
            url: this.url,
            events: this.events,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

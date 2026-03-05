import { DomainException } from './domain.exception';

export class NotFoundException extends DomainException {
    constructor(resource: string) {
        super(`${resource} not found`);
        this.name = 'NotFoundException';
    }
}

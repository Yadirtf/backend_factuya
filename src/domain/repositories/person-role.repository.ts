import { Role } from '../entities/role.entity';
import { Person } from '../entities/person.entity';

export interface RoleRepository {
    create(role: Role): Promise<Role>;
    findById(id: string, companyId: string): Promise<Role | null>;
    findByCode(code: string, companyId: string): Promise<Role | null>;
    findAll(companyId: string): Promise<Role[]>;
    update(role: Role): Promise<Role>;
}

export interface PersonRepository {
    create(person: Person): Promise<Person>;
    findById(id: string, companyId: string): Promise<Person | null>;
    findAll(companyId: string): Promise<Person[]>;
    update(person: Person): Promise<Person>;
}

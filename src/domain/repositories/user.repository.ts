import { User } from '../entities/user.entity';

export interface UserRepository {
    create(user: User): Promise<User>;
    findById(id: string, companyId: string): Promise<User | null>;
    findByEmail(email: string, companyId: string): Promise<User | null>;
    findByEmailGlobal(email: string): Promise<User | null>;
    findAll(companyId: string): Promise<User[]>;
    update(user: User): Promise<User>;
    updateRefreshToken(userId: string, token: string | null): Promise<void>;
    countAdmins(): Promise<number>;
}

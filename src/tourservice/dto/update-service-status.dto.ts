import { IsEnum, IsNotEmpty } from 'class-validator';

// Define the allowed status types so bad values can't slip through
export enum ServiceStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    ACTIVE = 'active',
}

export class UpdateServiceStatusDto {
    @IsEnum(ServiceStatus, { message: 'Invalid status value provided' })
    @IsNotEmpty()
    status!: ServiceStatus;
}
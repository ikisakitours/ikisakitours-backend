import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BookingStatus, PaymentStatus } from './booking-status.enum';

export class UpdateBookingStatusDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  paymentTransactionId?: string;
}
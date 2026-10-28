import { IsEnum } from 'class-validator';
import { BookingStatus } from './booking-status.enum';

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}
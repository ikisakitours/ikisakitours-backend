import { Injectable, NotFoundException } from '@nestjs/common';
import { TourServiceResponseDto } from './dto/tour-service-response.dto';

@Injectable()
export class TourServicesService {
  // Mock dataset matching your UI card fields
  private readonly mockServices: TourServiceResponseDto[] = [
    {
      id: 'srv_01',
      serviceType: 'Full Package (Guide + Vehicle)',
      status: 'Pending Review',
      clientName: 'David Miller',
      clientEmail: 'david.m@example.com',
      clientPhone: '+1 (555) 019-2834',
      dates: 'Aug 12 - Aug 18, 2026',
      groupSize: 4,
      notes:
        'We need an SUV with air conditioning. Prefer an English-speaking guide.',
    },
    {
      id: 'srv_02',
      serviceType: 'Vehicle Only',
      status: 'Confirmed',
      clientName: 'Emma Watson',
      clientEmail: 'emma.w@example.com',
      clientPhone: '+44 20 7946 0192',
      dates: 'Sep 05 - Sep 10, 2026',
      groupSize: 2,
      notes: 'Luxury sedan preferred for city travel.',
    },
  ];

  async findAll(): Promise<TourServiceResponseDto[]> {
    return this.mockServices;
  }

  async findOne(id: string): Promise<TourServiceResponseDto> {
    const service = this.mockServices.find((item) => item.id === id);

    if (!service) {
      throw new NotFoundException(`Service request with ID "${id}" not found`);
    }

    return service;
  }
}
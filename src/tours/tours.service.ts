import { Injectable, NotFoundException } from '@nestjs/common';
import { TourResponseDto } from './dto/tour-response.dto';

@Injectable()
export class ToursService {
  // Mock dataset matching your UI card fields
  private readonly mockTourRequests: TourResponseDto[] = [
    {
      id: 'req_01',
      tourType: 'One-Day Tour',
      status: 'Pending Review',
      clientName: 'Michael Chang',
      clientEmail: 'michael.c@example.com',
      clientPhone: '+1 415 555 2671',
      travelDate: 'Aug 15, 2026',
      groupSize: 2,
      packageName: 'Sigiriya & Dambulla Day Excursion Special',
      clientNotes: 'Vegetarian lunch options preferred.',
    },
    {
      id: 'req_02',
      tourType: 'Multi-Day Tour',
      status: 'Confirmed',
      clientName: 'Sophia Turner',
      clientEmail: 'sophia.t@example.com',
      clientPhone: '+44 20 7946 0912',
      travelDate: 'Sep 01, 2026',
      groupSize: 4,
      packageName: 'Grand Cultural Heritage & Wildlife Safari',
      clientNotes: 'Airport pickup requested at CMB at 06:00 AM.',
    },
  ];

  async findAll(): Promise<TourResponseDto[]> {
    return this.mockTourRequests;
  }

  async findOne(id: string): Promise<TourResponseDto> {
    const request = this.mockTourRequests.find((item) => item.id === id);

    if (!request) {
      throw new NotFoundException(`Tour request with ID "${id}" not found`);
    }

    return request;
  }
}
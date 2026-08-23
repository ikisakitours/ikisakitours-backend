import { Injectable } from '@nestjs/common';
import { CreateAddPackageDto } from './dto/create-addpackage.dto';
import { AddPackageResponseDto } from './dto/addpackage-response.dto';

@Injectable()
export class AddpackagesService {
  private readonly mockPackages: AddPackageResponseDto[] = [];

  async create(dto: CreateAddPackageDto): Promise<AddPackageResponseDto> {
    const newPackage: AddPackageResponseDto = {
      id: `pkg_${Date.now()}`,
      ...dto,
      createdAt: new Date().toISOString(),
    };

    this.mockPackages.push(newPackage);
    return newPackage;
  }
}
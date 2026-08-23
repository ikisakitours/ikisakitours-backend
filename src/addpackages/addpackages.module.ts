import { Module } from '@nestjs/common';
import { AddpackagesController } from './addpackages.controller';
import { AddpackagesService } from './addpackages.service';

@Module({
  controllers: [AddpackagesController],
  providers: [AddpackagesService]
})
export class AddpackagesModule {}

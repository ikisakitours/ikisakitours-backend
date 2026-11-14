import { Module } from '@nestjs/common';
import { LegalDocsController } from './legaldocs.controller';
import { LegalDocsService } from './legaldocs.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LegalDocsController],
  providers: [LegalDocsService],
  exports: [LegalDocsService],
})
export class LegalDocsModule {}

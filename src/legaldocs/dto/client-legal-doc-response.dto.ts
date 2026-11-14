export interface ClientLegalSubItemDto {
  id: string;
  title?: string;
  body?: string;
  icon?: string;
}

export interface ClientLegalSectionDto {
  id: string;
  heading: string;
  sectionIcon?: string;
  type: string;
  content?: string;
  subItems?: ClientLegalSubItemDto[];
  expanded?: boolean;
}

export class ClientLegalDocResponseDto {
  id!: string;
  language!: string;
  title!: string;
  eyebrow?: string;
  accent?: string;
  lastUpdated!: string;
  sections!: ClientLegalSectionDto[];
  createdAt!: Date;
  updatedAt!: Date;
}

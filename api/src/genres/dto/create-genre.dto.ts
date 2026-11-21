import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateGenreDto {
  @IsString()
  @IsNotEmpty() 
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

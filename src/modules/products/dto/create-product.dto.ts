import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  rating: string;

  @IsString()
  @IsNotEmpty()
  price: string;

  @IsString()
  @IsNotEmpty()
  size: string;

  @IsOptional()
  attributes?: any;

  @IsString()
  @IsNotEmpty()
  categoryId?:string;
}

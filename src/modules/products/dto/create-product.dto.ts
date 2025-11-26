import { IsNotEmpty, IsString } from 'class-validator';

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

  @IsString()
  attributes?: {key: string; value: string}[];

  @IsString()
  @IsNotEmpty()
  categoryId?:string;
}

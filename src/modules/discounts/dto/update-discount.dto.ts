import { CreateDiscountDto } from './create-discount.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateDiscountDto extends CreateDiscountDto {
    @IsNumber()
    @IsOptional()
    declare productId: number; // Add 'declare' keyword
}

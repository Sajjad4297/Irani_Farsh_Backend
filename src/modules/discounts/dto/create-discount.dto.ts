import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateDiscountDto {

    @IsNumber()
    @IsNotEmpty()
    productId: number;

    @IsNumber()
    @IsNotEmpty()
    days: number;

    @IsNumber()
    @IsNotEmpty()
    amount: number;
}

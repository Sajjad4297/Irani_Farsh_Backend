import { IsInt, IsNotEmpty, IsNumber, Max, Min } from "class-validator";

export class CreateDiscountDto {

    @IsNumber()
    @IsNotEmpty()
    productId: number;

    @IsInt()
    @Min(1)
    @Max(3650)
    @IsNotEmpty()
    days: number;

    @IsNumber()
    @Min(0)
    @Max(99999999.99)
    @IsNotEmpty()
    amount: number;
}

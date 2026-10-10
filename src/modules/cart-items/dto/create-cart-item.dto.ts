import { IsInt, IsNotEmpty, IsNumber, Max, Min } from "class-validator";

export class CreateCartItemDto {
    @IsNumber()
    @IsNotEmpty()
    productId : number;

    @IsInt()
    @Min(1)
    @Max(1000)
    @IsNotEmpty()
    quantity:number;
}

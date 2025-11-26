import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateCartItemDto {
    @IsNumber()
    @IsNotEmpty()
    productId : number;

    @IsNumber()
    @IsNotEmpty()
    quantity:number;
}

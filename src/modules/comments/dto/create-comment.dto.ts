import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    content : string

    @IsNumber()
    @IsNotEmpty()
    rating : number

    @IsNumber()
    @IsNotEmpty()
    product : number
}

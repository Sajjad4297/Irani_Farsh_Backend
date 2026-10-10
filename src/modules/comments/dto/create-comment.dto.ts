import { IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    content : string

    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    @Max(5)
    rating : number

    @IsNumber()
    @IsNotEmpty()
    product : number
}

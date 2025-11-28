import { BadRequestException, Injectable } from "@nestjs/common";
import { loginAdminDto } from "./app.controller";
import { generateAdminToken, verifyAdminToken } from "./common/utils/token";

@Injectable()
export class AppService {
    login(body: loginAdminDto) {
        const { userName, password } = body;
        const admins = [
            {
                userName: "sajy",
                password: "@Sajjad2005"
            },
            {
                userName: "sjad002",
                password: "Sajjad1384@@"
            },
            {
                userName: "mahdi-m84",
                password: "Mahdi1384"
            },
        ]
        const admin = admins.find(a => a.userName === userName && a.password === password);

        if (admin) {
            const token = generateAdminToken(admin.userName);
            console.log(verifyAdminToken(token));
            return { success: true, message: "Admin logged in successfully", sajy: token };
        }

        throw new BadRequestException("Invalid username or password");

    }
}

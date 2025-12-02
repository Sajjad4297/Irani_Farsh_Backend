import { BadRequestException, Injectable } from "@nestjs/common";
import { loginAdminDto } from "./app.controller";
import { generateAdminToken, verifyAdminToken } from "./common/utils/token";
import { FastifyReply } from "fastify";
import { MailService } from "./common/utils/mail.service";

@Injectable()
export class AppService {
    constructor(private readonly mailService: MailService) { }
    login(body: loginAdminDto, reply: FastifyReply) {
        const { username, password } = body;
        const admins = [
            {
                name: "سجاد عزیز",
                username: "sajy",
                password: "@Sajjad2005"
            },
            {
                name: 'سجاد عزیز',
                username: "sjad002",
                password: "Sajjad1384@@"
            },
            {
                name: "مهدی عزیز",
                username: "mahdi-m84",
                password: "Mahdi1384"
            },
        ]
        const admin = admins.find(a => a.username === username && a.password === password);

        if (admin) {
            const token = generateAdminToken(admin.username);
            reply.setCookie('token', token, {
                httpOnly: true,
                signed: true,
                secure: false, //change to 'true' in production
                sameSite: 'none', // change to 'strict' in production
                path: '/',
                maxAge: 60 * 60 * 24 * 1
            });
            reply.setCookie('adminName', admin.name, {
                httpOnly: false,
                signed: true,
                secure: false, //change to 'true' in production
                sameSite: 'none', // change to 'strict' in production
                path: '/',
                maxAge: 60 * 60 * 24 * 1,
            });

            return { success: true, message: "Admin logged in successfully" };
        }

        throw new BadRequestException("Invalid username or password");

    }
    async sendTestMail(to: string) {
        const result = await this.mailService.send(to);
        console.log(result);
        return { success: true, message: 'Email sent successfully' };

    }
}

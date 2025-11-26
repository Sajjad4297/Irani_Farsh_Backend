import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { comparePassword, hashPassword } from 'src/common/utils/password';
import { UsersRepository } from './users.repository';
import { generateUserToken } from 'src/common/utils/token';
import { User } from './interfaces/user.interface';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository) { }
    async register(body: RegisterUserDto) {
        const userData: RegisterUserDto = { ...body, password: await hashPassword(body.password) };
        const newUser = await this.usersRepository.register(userData);

        if (!newUser) throw new ConflictException('Failed to create user');
        const token = generateUserToken(newUser.insertId, userData.email);
        return ({
            success: true, message: 'User registered successfully', sajy: token,
            user: { id: newUser.id, firstName: userData.firstName, lastName: userData.lastName }
        });
    }

    async login(body: LoginUserDto) {
        const userData = body;
        const existingUser: User = await this.usersRepository.login(userData);
        if (existingUser.id && existingUser.email && existingUser.password && await comparePassword(body.password, existingUser.password)) {
            const token = generateUserToken(existingUser.id, existingUser.email);
            return ({
                success: true, message: 'User logged in successfully', sajy: token,
                user: { firstName: existingUser.firstName, lastName: existingUser.lastName, profileImage: existingUser.profileImage }
            });
        } else {
            throw new BadRequestException('Invalid email or password');
        }

    }


    async findAll() {
        const data = await this.usersRepository.findAll();
        if (data) {
            return ({ success: true, message: 'Users got successfully', data });
        }
    }

    async updateProfile(user: { id: number; email: string }, file: { image: Express.Multer.File }) {

        // Extract filenames
        const image = file.image[0];
        // Generate a unique filename but keep original extension
        const uniqueSuffix = crypto.randomBytes(5).toString("hex");
        const ext = path.extname(image.filename); // ".png", ".jpg", etc.
        const newFilename = `img-${uniqueSuffix}${ext}`;
        const filePath = path.join("uploads/user", newFilename);

        // Save the file
        fs.writeFileSync(filePath, image.buffer);


        await this.usersRepository.updateProfile(user.id, newFilename);


        return ({
            success: true, message: 'Profile updated successfully'
        });
    }
    async update(id: number, updateUserDto: UpdateUserDto) {
        return `This action updates a #${id} user`;
    }
    
    async findUserInfo(user: { id: number; email: string }) {
        const result = await this.usersRepository.findUserInfo(user.id);
            return ({ success: true, message: 'User info got successfully', result });
    }


}

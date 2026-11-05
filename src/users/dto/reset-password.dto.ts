import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email!: string;

    @IsString()
    @IsNotEmpty({ message: 'OTP code is required' })
    otp!: string;

    @IsString()
    @IsNotEmpty({ message: 'New password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    newPassword!: string;
}
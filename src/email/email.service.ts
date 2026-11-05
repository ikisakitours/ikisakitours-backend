import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private resend: Resend;

    constructor() {
        // Get API Key from .env file[cite: 3]
        this.resend = new Resend(process.env.RESEND_API_KEY);
    }

    // 1. Send OTP Email Function[cite: 3]
    async sendOtpEmail(email: string, otpCode: string): Promise<any> {
        try {
            const data = await this.resend.emails.send({
                from: 'Ikisaki Tours Security <no-reply@ikisakitours.com>',
                to: email,
                subject: 'Your OTP Code - Ikisaki Tours',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #2c3e50; text-align: center;">Welcome to Ikisaki Tours!</h2>
            <p style="font-size: 16px; color: #555;">Your One-Time Password (OTP) for account verification is:</p>
            <h1 style="background: #f4f4f4; padding: 15px; text-align: center; letter-spacing: 5px; color: #000; border-radius: 5px;">${otpCode}</h1>
            <p style="font-size: 14px; color: #777;">This code is valid for 10 minutes. Do not share this code with anyone.</p>
          </div>
        `,
            });
            return data;
        } catch (error) {
            console.error('Email sending failed:', error);
            throw new InternalServerErrorException('Failed to send OTP email');
        }
    }

    // 2. Payment Receipt Email Function[cite: 4]
    async sendPaymentReceipt(
        email: string,
        customerName: string,
        amount: string,
        invoiceId: string
    ): Promise<any> {
        try {
            const data = await this.resend.emails.send({
                from: 'Ikisaki Tours Billing <billing@ikisakitours.com>',
                to: email,
                subject: `Payment Successful - Invoice #${invoiceId}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #27ae60;">Payment Successful!</h2>
            <p>Dear ${customerName},</p>
            <p>Thank you for your payment to Ikisaki Tours. Here are your transaction details:</p>
            <ul style="background: #f9f9f9; padding: 15px; border-radius: 5px; list-style: none;">
              <li><strong>Invoice ID:</strong> ${invoiceId}</li>
              <li><strong>Amount Paid:</strong> ${amount}</li>
              <li><strong>Status:</strong> Paid</li>
            </ul>
            <p style="font-size: 14px; color: #777;">If you have any questions, please reply to this email.</p>
          </div>
        `,
            });
            return data;
        } catch (error) {
            console.error('Receipt sending failed:', error);
            throw new InternalServerErrorException('Failed to send payment receipt');
        }
    }
}
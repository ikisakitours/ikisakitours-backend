import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private resend: Resend;

    constructor() {
        // Get API Key from .env file
        this.resend = new Resend(process.env.RESEND_API_KEY);
    }

    // 1. Send OTP Email Function (Template එක භාවිතා කර)
    async sendOtpEmail(email: string, otpCode: string): Promise<any> {
        try {
            const data = await this.resend.emails.send({
                from: 'Ikisaki Tours Security <no-reply@ikisakitours.com>',
                to: email,
                subject: 'Reset Your Password - Ikisaki Tours',
                
                // HTML වෙනුවට Template ID සහ Variables දීම
                templateId: 'otp-template-1',
                variables: {
                    OTP_CODE: otpCode,
                },
            });
            return data;
        } catch (error) {
            console.error('Email sending failed:', error);
            throw new InternalServerErrorException('Failed to send OTP email');
        }
    }

    // 2. Payment Receipt Email Function (Template එක සහ PDF Attachment භාවිතා කර)
    async sendPaymentReceipt(
        email: string,
        customerName: string,
        amount: string,
        invoiceId: string,
        pdfBuffer: Buffer // අලුතින් එකතු කළ PDF Buffer එක
    ): Promise<any> {
        try {
            const data = await this.resend.emails.send({
                from: 'Ikisaki Tours Billing <billing@ikisakitours.com>',
                to: email,
                subject: `Payment Successful - Invoice #${invoiceId}`,
                
                // HTML වෙනුවට Template ID සහ Variables දීම
                templateId: 'advance-payment',
                variables: {
                    AMOUNT: amount,
                    CUSTOMER_NAME: customerName,
                    CUSTOMER_EMAIL: email,
                    INVOICE_ID: invoiceId,
                    SERVICE_TYPE: 'Tour Package', // මේවා පසුව Database එකෙන් එන පරිදි සකසා ගත හැක
                    SERVICE_NAME: 'Premium Travel Experience',
                    DATE: new Date().toLocaleDateString(),
                    PAYMENT_METHOD: 'Online Payment',
                    BOOKING_REF: 'BK-10293',
                    TRANSACTION_ID: `txn_${Date.now()}`,
                },
                
                // PDF රිසිට් එක Attach කිරීම
                attachments: [
                    {
                        filename: `Ikisaki-Advance-Receipt-${invoiceId}.pdf`,
                        content: pdfBuffer,
                    }
                ]
            });
            return data;
        } catch (error) {
            console.error('Receipt sending failed:', error);
            throw new InternalServerErrorException('Failed to send payment receipt');
        }
    }
}

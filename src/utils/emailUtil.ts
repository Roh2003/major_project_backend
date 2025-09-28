import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

const transporter = nodemailer.createTransport({
    host: process.env.SENDINBLUE_HOST,
    port: Number(process.env.SENDINBLUE_PORT),
    secure: false,
    auth: {
        user: process.env.SENDINBLUE_USER,
        pass: process.env.SENDINBLUE_PASSWORD,
    },
});

export const sendEmail = async ({ to, subject, text }: { to: string; subject: string; text: string }) => {
    console.log({to, subject, text })
    console.log({ host: process.env.SENDINBLUE_HOST,
        from: `"${process.env.EMAIL_SENDER_NAME}" <${process.env.EMAIL_SENDER}>`,
        port: Number(process.env.SENDINBLUE_PORT),
        secure: false,
        auth: {
            user: process.env.SENDINBLUE_USER,
            pass: process.env.SENDINBLUE_PASSWORD,
        }})

   const info = await transporter.sendMail({
        from: process.env.EMAIL_SENDER,
        to,
        subject,
        text,
    });
    console.log({info})
};

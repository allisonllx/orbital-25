const { Resend } = require('resend');
require('dotenv').config({ path: '../.env' });

const resend = new Resend(process.env.RESEND_API_KEY);

const sendResetEmail = async (to, code) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'NUSeek <noreply@onresend.com>', // use resend domain for dev
            to,
            subject: 'Reset your password',
            html: `<p>Your verification code is: <strong>${code}</strong></p>`
        });

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Email send error:', err);
        throw err;
    }
}

module.exports = sendResetEmail;
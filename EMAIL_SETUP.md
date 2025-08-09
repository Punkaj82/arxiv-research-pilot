# Email Setup for Arxiv Research Pilot

## Overview
The Contact Us form now sends actual emails to `pankaj@arxivresearch.com` when users submit feedback.

## Setup Instructions

### Option 1: Gmail (Recommended for testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Set Environment Variables**:
   ```bash
   export EMAIL_USER=your-email@gmail.com
   export EMAIL_PASS=your-16-digit-app-password
   ```

### Option 2: Custom SMTP Server

If you have your own email server or want to use a different provider:

1. **Update server.js** to use custom SMTP:
   ```javascript
   const emailConfig = {
     host: process.env.EMAIL_HOST || 'smtp.yourdomain.com',
     port: process.env.EMAIL_PORT || 587,
     secure: false, // true for 465, false for other ports
     auth: {
       user: process.env.EMAIL_USER || 'your-email@yourdomain.com',
       pass: process.env.EMAIL_PASS || 'your-password'
     }
   };
   ```

2. **Set Environment Variables**:
   ```bash
   export EMAIL_HOST=smtp.yourdomain.com
   export EMAIL_PORT=587
   export EMAIL_USER=your-email@yourdomain.com
   export EMAIL_PASS=your-password
   ```

### Option 3: Environment File (.env)

Create a `.env` file in your project root:
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

Then install dotenv:
```bash
npm install dotenv
```

And add this line at the top of server.js:
```javascript
require('dotenv').config();
```

## Testing

1. **Start your server**:
   ```bash
   node server.js
   ```

2. **Open the contact form** and submit feedback

3. **Check your email** at `pankaj@arxivresearch.com`

4. **Check server logs** for email sending status

## Security Notes

- Never commit email credentials to Git
- Use environment variables or .env files
- For production, consider using email services like SendGrid, Mailgun, or AWS SES
- App passwords are more secure than regular passwords

## Troubleshooting

### Common Issues:

1. **"Invalid login" error**:
   - Check if 2FA is enabled for Gmail
   - Verify app password is correct
   - Ensure email address is correct

2. **"Connection timeout"**:
   - Check firewall settings
   - Verify SMTP port is correct
   - Try different ports (587, 465, 25)

3. **"Authentication failed"**:
   - Double-check credentials
   - Ensure app password is generated correctly
   - Try logging in with the same credentials in a mail client

## Production Deployment

For production (Render, Heroku, etc.):

1. **Set environment variables** in your hosting platform
2. **Use production email services** (SendGrid, Mailgun, AWS SES)
3. **Implement rate limiting** to prevent spam
4. **Add CAPTCHA** for additional security 
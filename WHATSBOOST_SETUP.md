# WhatsBoost Integration Setup

This document describes the WhatsBoost messaging service integration that has replaced MSG91 and Fast2SMS.

## Overview

The application now uses WhatsBoost for all messaging needs:
- OTP authentication (login and signup)
- Appointment confirmation messages
- Appointment cancellation messages
- Post-appointment thank you messages

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# WhatsBoost Configuration
WHATSBOOST_APP_KEY=0a1375d1-500c-4f2e-afac-a4a9fa449840
WHATSBOOST_AUTH_KEY=C1y84SZLTbJlIUiImYDtrGfQx2jPmXPvUkbLf8ZPisZDriABRT
```

## Changes Made

### 1. New WhatsBoost Service (`lib/whatsboost.js`)

A new service class has been created that handles all messaging:

- `sendMessage(phone, message)` - Send any text message
- `sendOTP(phone, otp)` - Send OTP for authentication
- `generateOTP()` - Generate 6-digit OTP
- `sendAppointmentConfirmation(phone, details)` - Send appointment confirmation
- `sendAppointmentCancellation(phone, details)` - Send cancellation notification
- `sendAppointmentReschedule(phone, details)` - Send reschedule notification
- `sendThankYouMessage(phone, details)` - Send post-appointment thank you

### 2. Authentication Changes

#### Removed PIN Login System
- Deleted `/app/api/auth/login-pin/route.js`
- Deleted `/app/api/auth/forgot-pin/route.js`
- Removed PIN field from User model
- Simplified AuthPage.js to only use OTP authentication

#### Updated OTP Flow
- `/app/api/auth/send-otp/route.js` - Now generates and stores OTPs in database, sends via WhatsBoost
- `/app/api/auth/verify-otp/route.js` - Verifies OTP from database, creates/logs in users without PIN
- `/app/api/auth/resend-otp/route.js` - Resends OTP via WhatsBoost

### 3. Appointment Messaging

#### Confirmation Messages
When an appointment is created (`/app/api/appointments/route.js`), a confirmation message is automatically sent to the patient via WhatsApp with:
- Patient name
- Appointment date
- Time slot
- Consultation type

#### Cancellation Messages
When an appointment status is changed to 'cancelled' (`/app/api/appointments/[id]/route.js`), a cancellation notification is sent.

#### Thank You Messages
When an appointment status is changed to 'seen' (completed), a thank you message is automatically sent to the patient.

### 4. User Model Updates

Removed fields:
- `pin` - No longer needed
- `comparePin()` method - Removed
- PIN hashing pre-save hook - Removed

### 5. Frontend Changes

**AuthPage.js** has been completely rewritten:
- Removed PIN login UI
- Removed MSG91 widget integration
- Simplified to only OTP-based authentication
- Direct API calls instead of widget callbacks
- Cleaner, simpler user experience

## Authentication Flow

### Login
1. User enters phone number
2. System sends OTP to WhatsApp via WhatsBoost
3. User enters 6-digit OTP
4. System verifies OTP and logs in user

### Signup
1. User enters name and phone number
2. System sends OTP to WhatsApp via WhatsBoost
3. User enters 6-digit OTP
4. System verifies OTP and creates new user account (no PIN required)

## Appointment Messaging Flow

### New Appointment
1. User books appointment
2. Appointment is created in database
3. Confirmation message is automatically sent via WhatsBoost

### Cancel Appointment
1. Staff/patient cancels appointment
2. Appointment status is updated to 'cancelled'
3. Cancellation message is automatically sent via WhatsBoost

### Complete Appointment
1. Staff marks appointment as 'seen'
2. Appointment status is updated
3. Thank you message is automatically sent via WhatsBoost

## Message Templates

### OTP Message
```
Your OTP for verification is: {otp}. This code is valid for 10 minutes. Do not share this code with anyone.
```

### Appointment Confirmation
```
Dear {patientName}, your appointment has been confirmed!

Date: {date}
Time: {timeSlot}
Type: {consultationType}

Please arrive 10 minutes early. For any changes, contact us at least 4 hours before your appointment.

Thank you for choosing our clinic!
```

### Appointment Cancellation
```
Dear {patientName}, your appointment scheduled for {date} at {timeSlot} has been cancelled.

If you would like to reschedule, please book a new appointment at your convenience.

We hope to serve you soon!
```

### Thank You Message
```
Dear {patientName}, thank you for visiting our clinic today!

We hope you had a positive experience. Your health and well-being are our top priority.

If you have any questions or need to schedule a follow-up, please don't hesitate to contact us.

Take care and stay healthy!
```

## Testing

To test the integration:

1. Ensure WhatsBoost credentials are set in `.env`
2. Start the application
3. Try logging in with a phone number - you should receive an OTP via WhatsApp
4. Book an appointment - patient should receive confirmation via WhatsApp
5. Cancel an appointment - patient should receive cancellation notification
6. Mark appointment as 'seen' - patient should receive thank you message

## Migration Notes

### Old Environment Variables (No Longer Needed)
These can be removed from your `.env`:
- `MSG91_AUTH_KEY`
- `MSG91_WIDGET_ID`
- `MSG91_TEMPLATE_ID`
- `FAST2SMS_API_KEY`
- `NEXT_PUBLIC_MSG91_WIDGET_ID`
- `NEXT_PUBLIC_MSG91_AUTH_KEY`

### Database Migration
The User model no longer has a `pin` field. Existing users with PINs stored will need to use OTP authentication going forward. The PIN field can be safely dropped from the database if desired.

## Troubleshooting

### Messages Not Sending
- Verify WhatsBoost credentials are correct
- Check that phone numbers are in correct format (10 digits for Indian numbers)
- Check application logs for WhatsBoost API errors

### OTP Not Received
- Ensure phone number has WhatsApp installed
- Check that number is registered with WhatsApp
- Verify WhatsBoost account has sufficient credits

### Authentication Issues
- Clear browser localStorage and cookies
- Ensure database connection is working
- Check that OTP model is properly indexed

## Support

For WhatsBoost API issues, contact WhatsBoost support at https://whatsboost.in

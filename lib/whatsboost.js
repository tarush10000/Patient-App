const axios = require('axios');

/**
 * WhatsBoost Messaging Service
 * Replaces MSG91 and Fast2SMS for all messaging needs
 */
class WhatsBoostService {
  constructor() {
    this.appkey = process.env.WHATSBOOST_APP_KEY;
    this.authkey = process.env.WHATSBOOST_AUTH_KEY;
    this.apiUrl = 'https://whatsboost.in/api/create-message';
  }

  /**
   * Send a message via WhatsBoost
   * @param {string} to - Receiver phone number (with country code)
   * @param {string} message - Message text to send
   * @returns {Promise<Object>} Response from WhatsBoost API
   */
  async sendMessage(to, message) {
    try {
      // Format phone number - ensure it has country code
      let formattedPhone = to.toString().trim();

      // If number starts with +, remove it
      if (formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.substring(1);
      }

      // If number doesn't have country code, add +91 for India
      if (formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone;
      }

      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('appkey', this.appkey);
      formData.append('authkey', this.authkey);
      formData.append('to', formattedPhone);
      formData.append('message', message);

      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      if (response.data) {
        return {
          success: true,
          data: response.data,
          message: 'Message sent successfully'
        };
      } else {
        throw new Error('No response from WhatsBoost API');
      }
    } catch (error) {
      console.error('WhatsBoost send error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Failed to send message'
      };
    }
  }

  /**
   * Send OTP message
   * @param {string} phone - Phone number
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} Send result
   */
  async sendOTP(phone, otp) {
    const message = `Your OTP for verification is: ${otp}. This code is valid for 10 minutes. Do not share this code with anyone.`;
    return await this.sendMessage(phone, message);
  }

  /**
   * Generate a random 6-digit OTP
   * @returns {string} 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send appointment confirmation message
   * @param {string} phone - Patient phone number
   * @param {Object} appointmentDetails - Appointment details
   * @returns {Promise<Object>} Send result
   */
  async sendAppointmentConfirmation(phone, appointmentDetails) {
    const { patientName, date, timeSlot, consultationType } = appointmentDetails;

    const message = `Dear ${patientName}, your appointment has been confirmed!\n\n` +
      `Date: ${date}\n` +
      `Time: ${timeSlot}\n` +
      `Type: ${consultationType}\n\n` +
      `Please arrive 10 minutes early. For any changes, contact us at least 4 hours before your appointment.\n\n` +
      `Thank you for choosing our clinic!`;

    return await this.sendMessage(phone, message);
  }

  /**
   * Send appointment cancellation message
   * @param {string} phone - Patient phone number
   * @param {Object} appointmentDetails - Appointment details
   * @returns {Promise<Object>} Send result
   */
  async sendAppointmentCancellation(phone, appointmentDetails) {
    const { patientName, date, timeSlot } = appointmentDetails;

    const message = `Dear ${patientName}, your appointment scheduled for ${date} at ${timeSlot} has been cancelled.\n\n` +
      `If you would like to reschedule, please book a new appointment at your convenience.\n\n` +
      `We hope to serve you soon!`;

    return await this.sendMessage(phone, message);
  }

  /**
   * Send appointment postpone/reschedule message
   * @param {string} phone - Patient phone number
   * @param {Object} appointmentDetails - Appointment details
   * @returns {Promise<Object>} Send result
   */
  async sendAppointmentReschedule(phone, appointmentDetails) {
    const { patientName, oldDate, oldTimeSlot, newDate, newTimeSlot } = appointmentDetails;

    const message = `Dear ${patientName}, your appointment has been rescheduled.\n\n` +
      `Previous: ${oldDate} at ${oldTimeSlot}\n` +
      `New: ${newDate} at ${newTimeSlot}\n\n` +
      `Please arrive 10 minutes early. For any changes, contact us at least 4 hours before your appointment.\n\n` +
      `Thank you!`;

    return await this.sendMessage(phone, message);
  }

  /**
   * Send post-appointment thank you message
   * @param {string} phone - Patient phone number
   * @param {Object} appointmentDetails - Appointment details
   * @returns {Promise<Object>} Send result
   */
  async sendThankYouMessage(phone, appointmentDetails) {
    const { patientName } = appointmentDetails;

    const message = `Dear ${patientName}, thank you for visiting our clinic today!\n\n` +
      `We hope you had a positive experience. Your health and well-being are our top priority.\n\n` +
      `If you have any questions or need to schedule a follow-up, please don't hesitate to contact us.\n\n` +
      `Take care and stay healthy!`;

    return await this.sendMessage(phone, message);
  }
}

// Create a singleton instance
const whatsBoostService = new WhatsBoostService();

module.exports = whatsBoostService;

export const emailTemplates = {
  bookingRequest: (data: {
    providerName: string;
    clientName: string;
    serviceDetails: string;
    bookingDate: string;
    bookingTime: string;
    dashboardUrl: string;
  }) => ({
    subject: `New Booking Request - ${data.serviceDetails}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Booking Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0066bb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { 
            display: inline-block; 
            background: #0066bb; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px 5px;
          }
          .booking-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #0066bb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Booking Request</h1>
          </div>
          <div class="content">
            <p>Hello ${data.providerName},</p>
            
            <p>You have received a new booking request!</p>
            
            <div class="booking-details">
              <h3>Booking Details:</h3>
              <p><strong>Client:</strong> ${data.clientName}</p>
              <p><strong>Service:</strong> ${data.serviceDetails}</p>
              <p><strong>Date:</strong> ${data.bookingDate}</p>
              <p><strong>Time:</strong> ${data.bookingTime}</p>
            </div>
            
            <p>Please review this request and respond as soon as possible.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" class="button">View Booking Request</a>
            </div>
            
            <p>Best regards,<br>The ServiGOTN Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  bookingConfirmed: (data: {
    clientName: string;
    providerName: string;
    serviceDetails: string;
    bookingDate: string;
    bookingTime: string;
  }) => ({
    subject: `Booking Confirmed - ${data.serviceDetails}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Confirmed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .booking-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #22c55e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Booking Confirmed</h1>
          </div>
          <div class="content">
            <p>Hello ${data.clientName},</p>
            
            <p>Great news! Your booking request has been confirmed.</p>
            
            <div class="booking-details">
              <h3>Confirmed Booking:</h3>
              <p><strong>Service Provider:</strong> ${data.providerName}</p>
              <p><strong>Service:</strong> ${data.serviceDetails}</p>
              <p><strong>Date:</strong> ${data.bookingDate}</p>
              <p><strong>Time:</strong> ${data.bookingTime}</p>
            </div>
            
            <p>Your service provider will contact you if any additional details are needed.</p>
            
            <p>Best regards,<br>The ServiGOTN Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  bookingDeclined: (data: {
    clientName: string;
    providerName: string;
    serviceDetails: string;
    bookingDate: string;
    bookingTime: string;
  }) => ({
    subject: `Booking Update - ${data.serviceDetails}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .booking-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #ef4444; }
          .button { 
            display: inline-block; 
            background: #0066bb; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Booking Update</h1>
          </div>
          <div class="content">
            <p>Hello ${data.clientName},</p>
            
            <p>We regret to inform you that your booking request could not be accommodated at this time.</p>
            
            <div class="booking-details">
              <h3>Booking Request:</h3>
              <p><strong>Service Provider:</strong> ${data.providerName}</p>
              <p><strong>Service:</strong> ${data.serviceDetails}</p>
              <p><strong>Date:</strong> ${data.bookingDate}</p>
              <p><strong>Time:</strong> ${data.bookingTime}</p>
            </div>
            
            <p>Don't worry! You can search for other available service providers or try a different time slot.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/service-listings" class="button">Find Other Providers</a>
            </div>
            
            <p>Best regards,<br>The ServiGOTN Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};
import nodemailer from "nodemailer";

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: "Gmail", // or SMTP config
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Deligo" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email - Deligo",
    html: `<p>Click below to verify your email:</p>
           <a href="${url}">${url}</a>`,
  });
}

export async function sendOrderConfirmationEmail(
  email: string, 
  orderId: string, 
  otpCode: string,
  orderDetails: {
    items: Array<{ name: string; quantity: number; price: number }>;
    totalAmount: number;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  }
) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const itemsList = orderDetails.items
    .map(item => `<li>${item.name} x ${item.quantity} - ₹${item.price * item.quantity}</li>`)
    .join('');

  await transporter.sendMail({
    from: `"Deligo" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order Confirmation - ${orderId}`,
    html: `
      <h2>Order Confirmed!</h2>
      <p>Your order has been successfully placed.</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Delivery OTP:</strong> <span style="font-size: 24px; font-weight: bold; color: #2563eb;">${otpCode}</span></p>
      <p>Please share this OTP with the delivery person when they deliver your order.</p>
      
      <h3>Order Details:</h3>
      <ul>${itemsList}</ul>
      <p><strong>Total Amount:</strong> ₹${orderDetails.totalAmount}</p>
      
      <h3>Shipping Address:</h3>
      <p>${orderDetails.shippingAddress.street}, ${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.state} - ${orderDetails.shippingAddress.zipCode}</p>
      
      <p>Thank you for shopping with Deligo!</p>
    `,
  });
}

import Razorpay from "razorpay";
import { nanoid } from "nanoid";

const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
}) : null;

export async function createPaymentLink(amount: number, customerName: string, referenceId: string): Promise<{ success: boolean, url?: string, isDemo: boolean }> {
  if (razorpay) {
    try {
      const response = await razorpay.paymentLink.create({
        amount: amount * 100, // paise
        currency: "INR",
        accept_partial: false,
        reference_id: referenceId,
        description: `Recovery payment for ${customerName}`,
        customer: {
          name: customerName,
        },
        notify: {
          sms: false,
          email: false
        },
        reminder_enable: false
      });
      return { success: true, url: response.short_url, isDemo: false };
    } catch (e) {
      console.error("Razorpay error", e);
      return { success: false, isDemo: false };
    }
  } else {
    // Demo mode
    console.log("RAZORPAY DEMO MODE: Simulating payment link creation");
    return { 
      success: true, 
      url: `https://demo.razorpay.com/pl_${nanoid(8)}`, 
      isDemo: true 
    };
  }
}

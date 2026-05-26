import { api } from './api';

export interface PaymentRecord {
  id:                string;
  applicationId:     string;
  userId:            string;
  razorpayOrderId:   string | null;
  razorpayPaymentId: string | null;
  amount:            number;   // paise
  currency:          string;
  status:            'Pending' | 'Completed' | 'Failed';
  invoiceNo:         string | null;
  createdAt:         string;
  updatedAt:         string;
}

export interface CreateOrderResult {
  orderId?:     string;
  amount?:      number;
  currency?:    string;
  keyId?:       string;
  isNoFee?:     boolean;
  alreadyPaid?: boolean;
  invoiceNo?:   string | null;
}

export async function createOrder(applicationId: string): Promise<CreateOrderResult> {
  const res = await api.post(`/payments/${applicationId}/create-order`);
  return res.data;
}

export async function verifyPayment(
  razorpayOrderId:   string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): Promise<{ invoiceNo: string | null }> {
  const res = await api.post('/payments/verify', {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
  return res.data;
}

export async function getPayment(applicationId: string): Promise<PaymentRecord | null> {
  const res = await api.get(`/payments/${applicationId}`);
  return res.data.payment;
}

// Load Razorpay checkout script dynamically
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script    = document.createElement('script');
    script.src      = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload   = () => resolve(true);
    script.onerror  = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Open Razorpay checkout — resolves with invoice number on success, rejects on failure/dismiss
export async function openRazorpayCheckout(opts: {
  applicationId:   string;
  referenceNumber: string;
  companyName:     string;
  email:           string;
  contact?:        string;
}): Promise<string | null> {
  const loaded = await loadRazorpayScript();
  if (!loaded) throw new Error('Razorpay script could not be loaded. Check your internet connection.');

  const order = await createOrder(opts.applicationId);

  if (order.alreadyPaid) return order.invoiceNo ?? null;
  if (order.isNoFee)     return null; // no payment needed

  return new Promise((resolve, reject) => {
    const rzp = new (window as any).Razorpay({
      key:         order.keyId,
      amount:      order.amount,
      currency:    order.currency ?? 'INR',
      name:        'FSSAI — E-PAAS Portal',
      description: `Application Fee — ${opts.referenceNumber}`,
      order_id:    order.orderId,
      prefill: {
        name:    opts.companyName,
        email:   opts.email,
        contact: opts.contact ? `+91${opts.contact.replace(/\D/g, '').slice(-10)}` : undefined,
      },
      readonly: {
        email:   !!opts.email,
        contact: !!opts.contact,
      },
      theme: { color: '#1A3C34' },
      handler: async (response: {
        razorpay_order_id:   string;
        razorpay_payment_id: string;
        razorpay_signature:  string;
      }) => {
        try {
          const result = await verifyPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
          );
          resolve(result.invoiceNo);
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    });
    rzp.open();
  });
}

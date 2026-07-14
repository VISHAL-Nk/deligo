/**
 * Deligo Policy Store
 *
 * Static policy documents for the RAG chatbot.
 * These replace the ChromaDB vector store used in the local Python server,
 * enabling the chatbot to run entirely within Next.js serverless functions.
 *
 * Similarity search is done with a simple cosine similarity over TF-IDF-like
 * term vectors — no external vector DB required.
 */

export interface PolicyDocument {
  id: string;
  title: string;
  content: string;
  keywords: string[];
}

export const POLICY_DOCUMENTS: PolicyDocument[] = [
  {
    id: 'shipping-policy',
    title: 'Shipping & Delivery Policy',
    keywords: ['shipping', 'delivery', 'dispatch', 'track', 'courier', 'days', 'arrive', 'ship', 'transit'],
    content: `Deligo Shipping & Delivery Policy:

Standard Delivery: 3-7 business days for most products. Available across India.
Express Delivery: 1-2 business days available in major cities (Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Pune, Kolkata).
Same-Day Delivery: Available in select metropolitan areas for orders placed before 12 PM.

Shipping Charges:
- Free shipping on orders above ₹499
- ₹49 flat fee for orders below ₹499
- Express delivery charges vary by location (typically ₹99-₹199)

Tracking: Once your order is dispatched, you will receive an SMS and email with a tracking number. You can track your order in the My Orders section of your account.

Dispatch Timeline: Most orders are dispatched within 24-48 hours of placement. During sale events, dispatch may take up to 72 hours.

International Shipping: Currently not available. We ship within India only.`,
  },
  {
    id: 'returns-policy',
    title: 'Returns & Refund Policy',
    keywords: ['return', 'refund', 'exchange', 'cancel', 'money back', 'replace', 'damaged', 'wrong', 'defective'],
    content: `Deligo Returns & Refund Policy:

Return Window: Most products can be returned within 7 days of delivery. Electronics and appliances have a 3-day return window.

Eligible for Return:
- Damaged or defective products
- Wrong product delivered
- Product not as described
- Incomplete order (missing items/accessories)

Not Eligible for Return:
- Perishable items (food, plants)
- Personalized/customized products
- Intimate apparel and swimwear
- Software/digital downloads
- Products with tampered/missing serial numbers

Return Process:
1. Go to My Orders → Select the order → Click "Return/Replace"
2. Select reason and upload photos (for damaged/wrong items)
3. Schedule a pickup or drop-off at the nearest Deligo point
4. Refund is processed within 5-7 business days after we receive the item

Refund Methods:
- Original payment method: 5-7 business days
- Deligo Wallet/Credits: 24-48 hours (instant in most cases)

Cancellation: Orders can be cancelled before dispatch for a full refund. Once dispatched, you must wait for delivery and then initiate a return.`,
  },
  {
    id: 'payment-policy',
    title: 'Payment & Security Policy',
    keywords: ['payment', 'pay', 'upi', 'card', 'credit', 'debit', 'cod', 'cash', 'emi', 'razorpay', 'wallet', 'secure'],
    content: `Deligo Payment Policy:

Accepted Payment Methods:
- UPI (Google Pay, PhonePe, Paytm, BHIM, etc.)
- Credit Cards (Visa, Mastercard, RuPay, American Express)
- Debit Cards
- Net Banking (all major banks)
- Cash on Delivery (COD) — available on eligible orders up to ₹10,000
- EMI — available on credit cards for orders above ₹3,000
- Deligo Wallet

Payment Security:
- All transactions are processed through Razorpay, a PCI-DSS compliant payment gateway
- We never store your card details on our servers
- All pages are SSL encrypted (HTTPS)
- Two-factor authentication for card payments via OTP

COD Policy:
- Available on orders up to ₹10,000
- A nominal COD fee of ₹30 applies
- Please keep exact change ready for faster delivery
- Not available for international shipping or certain remote pin codes

Failed Payments: If a payment fails but the amount was debited, it will be automatically refunded within 5-7 business days. Contact support if it takes longer.`,
  },
  {
    id: 'seller-policy',
    title: 'Seller & Marketplace Policy',
    keywords: ['seller', 'sell', 'vendor', 'marketplace', 'list', 'product', 'commission', 'earnings', 'payout'],
    content: `Deligo Seller Policy:

Becoming a Seller:
- Register as a seller at deligo.live/seller
- Required: GST number, Bank account, Aadhaar/PAN, Business address proof
- Approval typically takes 2-3 business days

Commission Structure:
- Electronics: 5-8%
- Fashion & Apparel: 15-20%
- Home & Kitchen: 10-15%
- Grocery & Food: 8-12%
- Books & Media: 12%

Payout Schedule:
- Payouts are processed every 7 days
- Minimum payout threshold: ₹1,000
- Transferred directly to your registered bank account

Seller Responsibilities:
- Accurate product descriptions and images
- Maintain stock levels — overselling leads to penalties
- Ship orders within 48 hours of order placement
- Respond to customer queries within 24 hours

Prohibited Items:
- Counterfeit or fake products
- Illegal/regulated items
- Adult content
- Hazardous materials without proper labeling`,
  },
  {
    id: 'account-policy',
    title: 'Account & Privacy Policy',
    keywords: ['account', 'login', 'signup', 'password', 'profile', 'data', 'privacy', 'delete', 'security', 'personal'],
    content: `Deligo Account & Privacy Policy:

Account Creation:
- Sign up with email or Google/Facebook account
- One account per person; multiple accounts may be suspended
- Minimum age: 18 years

Data We Collect:
- Name, email, phone number, delivery address
- Order history and browsing behavior (for personalization)
- Payment method details (stored securely, not card numbers)
- Device information and IP address

How We Use Your Data:
- To process orders and provide customer support
- To send order updates via SMS/email
- To personalize your shopping experience using AI recommendations
- To detect and prevent fraud

Data Sharing:
- We share data with delivery partners and payment processors only as needed
- We never sell your personal data to third parties
- You can request data export or deletion by contacting support@deligo.live

Account Security:
- Use a strong, unique password
- Enable two-factor authentication (2FA) in account settings
- We will never ask for your password via email or phone

Account Deletion:
- Request deletion at Account Settings → Delete Account
- Active orders must be completed first
- Refunds for cancelled orders will be processed before deletion`,
  },
  {
    id: 'warranty-policy',
    title: 'Warranty & Guarantee Policy',
    keywords: ['warranty', 'guarantee', 'brand', 'manufacturer', 'repair', 'service center', 'claim'],
    content: `Deligo Warranty Policy:

Brand Warranty:
All electronics and appliances sold on Deligo come with the manufacturer's official warranty. This is separate from Deligo's return policy.

Warranty Claims:
- Contact the brand's authorized service center directly for warranty issues after the 7-day return window
- Keep your invoice (sent via email) as proof of purchase — it is accepted by all major brands
- Deligo can assist in facilitating warranty claims — contact support@deligo.live

Deligo Protection Plan (Optional):
- Extended warranty plans available at checkout for select electronics
- Covers accidental damage, liquid damage, and post-warranty repairs
- Managed by Deligo's partner service network

Counterfeit Protection:
- We guarantee all products are genuine and sold by verified sellers
- If you receive a counterfeit product, you are eligible for a full refund + ₹500 compensation`,
  },
  {
    id: 'general-faq',
    title: 'General FAQ',
    keywords: ['help', 'support', 'contact', 'complaint', 'escalate', 'agent', 'hours', 'customer care', 'faq'],
    content: `Deligo General FAQ:

How do I contact Deligo support?
- Email: support@deligo.live
- In-app chat: Available 9 AM – 9 PM IST, 7 days a week
- Response time: Within 24 hours for email, immediate for chat

How do I track my order?
Go to My Account → My Orders → Select the order → Click "Track Order". You can also use the tracking number sent to your registered mobile/email.

Can I change my delivery address after placing an order?
Address changes are possible only before the order is dispatched. Contact support immediately with your order ID.

What if I miss a delivery attempt?
The courier will make 2 more delivery attempts on consecutive days. After 3 failed attempts, the order is returned to the seller and a refund is processed.

How do I apply a coupon code?
Enter the code in the "Apply Coupon" field at checkout. Only one coupon can be applied per order.

Is Deligo available as an app?
The mobile app is coming soon. Currently, deligo.live is fully mobile-optimized for a seamless experience on any device.

How do I report a problem with a seller?
Go to the order details page and click "Report Seller" or email seller-support@deligo.live with your order ID.`,
  },
];

/**
 * Find the most relevant policy documents for a given query.
 * Uses keyword overlap (bag-of-words) as a lightweight similarity measure —
 * no vector DB or embeddings API call required.
 */
export function findRelevantPolicies(query: string, topK: number = 3): PolicyDocument[] {
  const queryWords = new Set(
    query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  const scored = POLICY_DOCUMENTS.map((doc) => {
    // Keyword overlap score
    const keywordScore = doc.keywords.filter((kw) =>
      queryWords.has(kw) ||
      Array.from(queryWords).some((qw) => kw.includes(qw) || qw.includes(kw))
    ).length;

    // Also check content for query word matches (simple TF-like score)
    const contentWords = doc.content.toLowerCase().split(/\s+/);
    const contentScore =
      Array.from(queryWords).reduce((sum, qw) => {
        return sum + contentWords.filter((cw) => cw.includes(qw)).length;
      }, 0) / 100; // normalize

    return { doc, score: keywordScore * 2 + contentScore };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.doc);
}

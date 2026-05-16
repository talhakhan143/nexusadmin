import { Plus } from "lucide-react";

export const metadata = { title: "FAQ" };

const FAQS = [
  {
    section: "Orders",
    items: [
      { q: "How long does delivery take?", a: "Standard delivery is 3–5 working days. Express delivery for major cities (Karachi, Lahore, Islamabad, Rawalpindi) is 1–2 working days." },
      { q: "Do you offer Cash on Delivery?", a: "Yes. COD is available across Pakistan for orders up to Rs 50,000. Select Cash on Delivery at checkout." },
      { q: "Can I modify or cancel my order?", a: "If your order hasn't been shipped yet, contact us on WhatsApp within 2 hours and we'll do our best to help." },
      { q: "Will I receive tracking?", a: "Yes — once your order ships you'll receive an email and SMS with your tracking number and a link." },
    ],
  },
  {
    section: "Products",
    items: [
      { q: "Are your products authentic?", a: "All Noor products are formulated and bottled by our atelier. We do not resell third-party brands." },
      { q: "How long do your perfumes last?", a: "Most of our perfumes (EDP concentration) last 6–8 hours. Our attars are oil-based and can last 8–12 hours on skin." },
      { q: "Are your products cruelty-free?", a: "Yes. We do not test on animals, and we work only with suppliers who share this commitment." },
    ],
  },
  {
    section: "Payment",
    items: [
      { q: "What payment methods do you accept?", a: "Cash on Delivery, JazzCash, Easypaisa, and Visa/Mastercard debit/credit cards." },
      { q: "Is my payment information secure?", a: "Yes. All card payments are processed via PCI-compliant payment processors. We never store card details on our servers." },
    ],
  },
  {
    section: "Returns",
    items: [
      { q: "What's your return policy?", a: "Unopened, unused products may be returned within 7 days of delivery. Due to hygiene, opened fragrances and tested products cannot be returned." },
      { q: "How do I start a return?", a: "Message us on WhatsApp with your order number and reason. We'll send a courier to pick up the item — at no charge to you." },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="container-tight py-16 md:py-24">
      <div className="text-center mb-16">
        <p className="section-eyebrow justify-center">Help</p>
        <h1 className="font-serif text-4xl md:text-5xl mt-4">Frequently asked questions.</h1>
      </div>

      <div className="max-w-3xl mx-auto space-y-12">
        {FAQS.map((sec) => (
          <section key={sec.section}>
            <h2 className="font-serif text-2xl mb-5">{sec.section}</h2>
            <div className="divide-y border-y">
              {sec.items.map((it, i) => (
                <details key={i} className="group py-5">
                  <summary className="flex items-center justify-between cursor-pointer list-none gap-4">
                    <span className="font-medium">{it.q}</span>
                    <Plus className="h-4 w-4 transition-transform group-open:rotate-45 shrink-0" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{it.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export const metadata = { title: "Returns & Refunds" };

export default function ReturnsPage() {
  return (
    <div className="container-tight py-16 md:py-24 max-w-3xl mx-auto">
      <div className="mb-12">
        <p className="section-eyebrow">Returns & Refunds</p>
        <h1 className="font-serif text-4xl md:text-5xl mt-4">A simple, honest return policy.</h1>
      </div>

      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="font-serif text-2xl text-foreground mb-3">7-day return window</h2>
          <p>You may return unopened, unused products within 7 days of delivery for a full refund. We'll send a courier to pick up the item at no charge to you.</p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-foreground mb-3">Hygiene exceptions</h2>
          <p>Due to the nature of fragrance and skincare, the following cannot be returned:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Opened or tested perfumes and attars</li>
            <li>Opened skincare and beauty products</li>
            <li>Items marked "final sale" at checkout</li>
            <li>Custom-engraved or gift-wrapped orders</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-foreground mb-3">How to start a return</h2>
          <ol className="list-decimal pl-6 mt-2 space-y-1">
            <li>Message us on WhatsApp with your order number and reason.</li>
            <li>We'll arrange a free courier pickup within 24–48 hours.</li>
            <li>Refund is processed within 5–7 working days of receipt.</li>
            <li>Refunds go back to original payment method (or as store credit, your choice).</li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-foreground mb-3">Damaged or wrong item?</h2>
          <p>If something arrives damaged or you received the wrong product, message us within 48 hours of delivery with a photo. We'll replace it immediately at no cost.</p>
        </section>
      </div>
    </div>
  );
}

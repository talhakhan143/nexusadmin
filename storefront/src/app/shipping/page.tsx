import { Truck, Clock, MapPin, Package } from "lucide-react";

export const metadata = { title: "Shipping & Delivery" };

export default function ShippingPage() {
  return (
    <div className="container-tight py-16 md:py-24 max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <p className="section-eyebrow justify-center">Shipping & Delivery</p>
        <h1 className="font-serif text-4xl md:text-5xl mt-4">Delivered with care, across Pakistan.</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {[
          { icon: Truck, title: "Standard delivery", body: "3–5 working days. Rs 250 flat rate." },
          { icon: Clock, title: "Express delivery", body: "1–2 working days in major cities. Rs 450 flat rate." },
          { icon: Package, title: "Free shipping", body: "On all orders over Rs 3,500." },
          { icon: MapPin, title: "Coverage", body: "60+ cities including Karachi, Lahore, Islamabad, Faisalabad, Multan and more." },
        ].map((p) => (
          <div key={p.title} className="border p-6 flex gap-4">
            <p.icon className="h-6 w-6 text-accent shrink-0" />
            <div>
              <h3 className="font-serif text-lg">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{p.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="prose prose-stone max-w-none space-y-6 text-muted-foreground">
        <h2 className="font-serif text-2xl text-foreground">How it works</h2>
        <ol className="space-y-2 list-decimal pl-5">
          <li>Place your order and choose your delivery option at checkout.</li>
          <li>Orders placed before 2 PM (Mon–Sat) are dispatched the same day.</li>
          <li>You'll receive an email + SMS with tracking once your order ships.</li>
          <li>Track your shipment any time via our courier partner's portal.</li>
        </ol>

        <h2 className="font-serif text-2xl text-foreground">Our courier partners</h2>
        <p>We ship via TCS, Leopards Courier, and M&P. Couriers vary by city for fastest delivery.</p>

        <h2 className="font-serif text-2xl text-foreground">Cash on Delivery</h2>
        <p>COD is available across Pakistan. Maximum order value Rs 50,000. Please have the exact cash ready for the courier.</p>
      </div>
    </div>
  );
}

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="container-tight py-16 md:py-24 max-w-3xl mx-auto prose prose-stone">
      <h1 className="font-serif text-4xl mb-6">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: May 2026</p>

      <p>By using this site or placing an order, you agree to these terms.</p>

      <h2 className="font-serif text-2xl mt-8 mb-3">Orders</h2>
      <p className="text-muted-foreground">All orders are subject to availability. We reserve the right to refuse or cancel orders for any reason, including pricing errors or suspected fraud.</p>

      <h2 className="font-serif text-2xl mt-8 mb-3">Pricing</h2>
      <p className="text-muted-foreground">Prices are in PKR. We reserve the right to change prices at any time, but changes won't affect orders already placed.</p>

      <h2 className="font-serif text-2xl mt-8 mb-3">Payment</h2>
      <p className="text-muted-foreground">By placing an order you authorize us to charge the selected payment method (or to collect cash on delivery, as applicable). All card payments are processed by PCI-compliant third parties.</p>

      <h2 className="font-serif text-2xl mt-8 mb-3">Intellectual property</h2>
      <p className="text-muted-foreground">All content on this site — text, images, brand names — is property of Noor or its licensors. You may not reproduce or use it without permission.</p>

      <h2 className="font-serif text-2xl mt-8 mb-3">Contact</h2>
      <p className="text-muted-foreground">Questions? Email hello@noorperfumes.pk.</p>
    </div>
  );
}

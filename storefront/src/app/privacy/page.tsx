export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="container-tight py-16 md:py-24 max-w-3xl mx-auto prose prose-stone">
      <h1 className="font-serif text-4xl mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: May 2026</p>

      <p>
        At Noor, we respect your privacy. This policy explains what information we collect, how we use it, and your rights.
      </p>

      <h2 className="font-serif text-2xl mt-8 mb-3">Information we collect</h2>
      <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
        <li>Contact information you provide at checkout (name, email, phone, address).</li>
        <li>Order history and preferences.</li>
        <li>Anonymized analytics (page views, device type) to improve the site.</li>
      </ul>

      <h2 className="font-serif text-2xl mt-8 mb-3">How we use it</h2>
      <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
        <li>To process and deliver your orders.</li>
        <li>To respond to your questions and support requests.</li>
        <li>If you opted in: to send occasional marketing emails (unsubscribe any time).</li>
      </ul>

      <h2 className="font-serif text-2xl mt-8 mb-3">What we never do</h2>
      <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
        <li>Sell your data to third parties.</li>
        <li>Store your full card details on our servers.</li>
        <li>Share data with anyone beyond what's needed to fulfill your order.</li>
      </ul>

      <h2 className="font-serif text-2xl mt-8 mb-3">Your rights</h2>
      <p className="text-muted-foreground">You can request access to, correction of, or deletion of your data any time by emailing hello@noorperfumes.pk.</p>
    </div>
  );
}

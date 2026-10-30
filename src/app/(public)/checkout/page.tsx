import { Container } from "@/components/ui/container";
import { CheckoutForm } from "@/components/cart/checkout-form";
export default function Page() {
  return (
    <main className="py-14">
      <Container>
        <h1 className="mb-8 text-4xl font-black">Checkout</h1>
        <p className="mb-6 text-slate-600">
          No online payment is collected here. We will confirm fulfilment and
          payment instructions with you.
        </p>
        <CheckoutForm />
      </Container>
    </main>
  );
}

import { Container } from "@/components/ui/container";
import { CartPage } from "@/components/cart/cart-page";
export default function Page() {
  return (
    <main className="py-14">
      <Container>
        <h1 className="mb-8 text-4xl font-black">Shopping Cart</h1>
        <CartPage />
      </Container>
    </main>
  );
}

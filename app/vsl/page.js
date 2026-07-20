import VslPage from "./VslPage";

export const metadata = {
  title: "Tu resultado explicado | Infinixe",
  description: "Entiende qué significa tu nivel de madurez de innovación y cuál es el siguiente paso para subir de nivel.",
  robots: { index: false, follow: false },
};

// Link de pago Stripe (variante A, $450). Se configura en Vercel como NEXT_PUBLIC_STRIPE_LINK_450.
const STRIPE_URL = process.env.NEXT_PUBLIC_STRIPE_LINK_450 || "#";

export default function Page() {
  return <VslPage price={450} stripeUrl={STRIPE_URL} variant="a" />;
}

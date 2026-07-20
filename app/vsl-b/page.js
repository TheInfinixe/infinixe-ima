import VslPage from "../vsl/VslPage";

export const metadata = {
  title: "Tu resultado explicado | Infinixe",
  description: "Entiende qué significa tu nivel de madurez de innovación y cuál es el siguiente paso para subir de nivel.",
  robots: { index: false, follow: false },
};

// Link de pago Stripe (variante B, $350). Se configura en Vercel como NEXT_PUBLIC_STRIPE_LINK_350.
const STRIPE_URL = process.env.NEXT_PUBLIC_STRIPE_LINK_350 || "#";

export default function Page() {
  return <VslPage price={350} stripeUrl={STRIPE_URL} variant="b" />;
}

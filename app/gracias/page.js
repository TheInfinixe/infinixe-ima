import GraciasContent from "./GraciasContent";

export const metadata = {
  title: "¡Pago recibido! | Infinixe",
  robots: { index: false, follow: false },
};

// Destino de Stripe después del pago. Configurar en cada Payment Link:
//   After payment -> Redirect to:
//   https://<dominio>/gracias?p=450&session_id={CHECKOUT_SESSION_ID}   (link de $450)
//   https://<dominio>/gracias?p=350&session_id={CHECKOUT_SESSION_ID}   (link de $350)
export default function Page() {
  return <GraciasContent />;
}

"use client";

import { useEffect } from "react";
import { CheckoutSuccessExperience } from "@/components/checkout/CheckoutSuccessExperience";
import { useCheckoutUI } from "@/context/CheckoutUIContext";

type Props = {
  orderId: string;
  paid: boolean;
  total?: number;
};

export function CheckoutSuccessClient({ orderId, paid }: Props) {
  const { setImmersive } = useCheckoutUI();

  useEffect(() => {
    setImmersive(true);
    return () => setImmersive(false);
  }, [setImmersive]);

  return (
    <CheckoutSuccessExperience orderId={orderId} paid={paid} />
  );
}

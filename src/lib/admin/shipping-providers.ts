/**
 * Pluggable shipping provider architecture.
 * UI + webhooks can register providers without hardcoding one carrier into orders.
 */

export type ShippingProviderStatus = "connected" | "disconnected" | "error";

export type ShippingProvider = {
  id: string;
  name: string;
  nameAr: string;
  logoUrl?: string;
  apiStatus: ShippingProviderStatus;
  webhookStatus: ShippingProviderStatus;
  active: boolean;
  lastSyncAt?: string;
  notes?: string;
};

export type ShipmentRecord = {
  id: string;
  orderId: string;
  providerId: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: string;
  courierName?: string;
  courierPhone?: string;
  shippingFee?: number;
  deliveryArea?: string;
  pickupAt?: string;
  estimatedDelivery?: string;
  lastUpdateAt?: string;
};

/** Built-in providers — connection is env/config driven later */
export function listShippingProviders(): ShippingProvider[] {
  return [
    {
      id: "waseet",
      name: "Waseet",
      nameAr: "شركة الوسط",
      apiStatus: "disconnected",
      webhookStatus: "disconnected",
      active: true,
      notes: "التوصيل الحالي برسوم ثابتة — ربط API جاهز للتفعيل لاحقاً.",
    },
  ];
}

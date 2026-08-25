import { prisma } from "@/lib/db";
import { DEFAULT_VELORA_CARD_CONFIG } from "@/lib/my-velora/default-config";

const TEMPLATE_ID = "tpl-signature";

export async function ensureMyVeloraSeed() {
  await prisma.veloraCardConfig.upsert({
    where: { id: "default" },
    create: { id: "default", data: DEFAULT_VELORA_CARD_CONFIG },
    update: {},
  });

  await prisma.veloraCardTemplate.upsert({
    where: { id: TEMPLATE_ID },
    create: {
      id: TEMPLATE_ID,
      slug: "velora-signature",
      nameAr: "VELORA Signature",
      nameEn: "VELORA Signature",
      styleKey: "signature",
      backgroundUrl: "/my-velora/templates/velora-signature-master.png",
      layoutJson: {},
      isActive: true,
      isDefault: true,
      priority: 100,
    },
    update: {
      backgroundUrl: "/my-velora/templates/velora-signature-master.png",
      isActive: true,
      isDefault: true,
    },
  });
}

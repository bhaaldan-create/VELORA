import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { recordCardEvent } from "@/lib/my-velora/generate";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export default async function MyVeloraReferralPage({ params }: Props) {
  const { token } = await params;

  const link = await prisma.veloraReferralLink.findUnique({
    where: { token },
    include: { card: true },
  });
  if (!link) notFound();

  if (!link.expiresAt || link.expiresAt >= new Date()) {
    await prisma.veloraReferralEvent.create({
      data: {
        referralLinkId: link.id,
        eventType: "visit",
        metaJson: {} as Prisma.InputJsonValue,
      },
    });
    if (link.cardId) {
      await recordCardEvent(link.cardId, "referral_click");
    }
  }

  return (
    <main
      className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-[#F6F0F8] px-6 py-16 text-center"
      dir="rtl"
    >
      <p className="font-latin text-[0.65rem] tracking-[0.38em] text-[#8B7A92]">
        VELORA
      </p>
      <h1 className="font-display mt-4 text-[1.6rem] font-semibold leading-snug text-[#3D2640]">
        صديقتك شاركت للتو
        <br />
        لحظة جمال VELORA ✦
      </h1>
      {link.card ? (
        <p className="mt-5 text-[0.92rem] text-[#7A6880]">
          {link.card.productCount} منتج · {link.card.brandCount} علامة · +
          {link.card.pointsEarned} نقطة
        </p>
      ) : null}
      <Link
        href="/shop"
        className="mt-10 inline-flex rounded-full bg-[#3D2640] px-8 py-3 text-[0.9rem] text-white"
      >
        استكشفي VELORA
      </Link>
    </main>
  );
}

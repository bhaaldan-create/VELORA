import { computeLandedCostIqd } from "@/lib/finance/product-cost";
import { writeAuditLog } from "@/lib/finance/audit";
import { prisma } from "@/lib/db";

export async function receiveImportShipment(
  shipmentId: string,
  actorId = "root",
) {
  const shipment = await prisma.importShipment.findUnique({
    where: { id: shipmentId },
    include: { items: true },
  });
  if (!shipment) throw new Error("الشحنة غير موجودة");
  if (shipment.status === "Received" || shipment.status === "Completed") {
    throw new Error("تم استلام هذه الشحنة مسبقاً");
  }
  if (!shipment.items.length) throw new Error("لا توجد أصناف في الشحنة");

  const rate =
    shipment.currency.toUpperCase() === "IQD"
      ? 1
      : Math.max(0, shipment.exchangeRate || 0);
  const extrasIqd =
    (shipment.shippingCost +
      shipment.customsCost +
      shipment.brokerageCost +
      shipment.otherFees) *
    rate;
  const purchaseIqd = shipment.purchaseTotal * rate;
  const totalLandedIqd = purchaseIqd + extrasIqd;
  const totalUnits = shipment.items.reduce((s, i) => s + i.quantity, 0);
  const extraPerUnit = totalUnits > 0 ? extrasIqd / totalUnits : 0;

  await prisma.$transaction(async (tx) => {
    for (const item of shipment.items) {
      const unitPurchaseIqd = item.unitCost * rate;
      const landedUnitIqd =
        Math.round((unitPurchaseIqd + extraPerUnit) * 100) / 100;

      await tx.importItem.update({
        where: { id: item.id },
        data: { landedUnitIqd },
      });

      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) continue;

      const newStock = product.stock + item.quantity;
      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: newStock,
          purchasePrice: item.unitCost,
          costCurrency: shipment.currency,
          costExchangeRate: shipment.exchangeRate,
          shippingCostIqd: Math.round(extraPerUnit * 100) / 100,
          landedCostIqd: landedUnitIqd,
          supplierId: shipment.supplierId,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          type: "receive",
          quantity: item.quantity,
          balanceAfter: newStock,
          reference: shipment.code,
          note: `استلام شحنة ${shipment.code}`,
          actorId,
        },
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    await tx.importShipment.update({
      where: { id: shipment.id },
      data: {
        status: "Received",
        receivedDate: today,
        totalLandedIqd: Math.round(totalLandedIqd * 100) / 100,
      },
    });
  });

  await writeAuditLog({
    actorId,
    action: "import.receive",
    entityType: "ImportShipment",
    entityId: shipmentId,
    after: { totalLandedIqd, items: shipment.items.length },
  });

  return { totalLandedIqd };
}

export { computeLandedCostIqd };

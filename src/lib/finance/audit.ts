import { prisma } from "@/lib/db";

export async function writeAuditLog(input: {
  actorId?: string;
  actorLabel?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId || "root",
        actorLabel: input.actorLabel || "root",
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId || "",
        beforeJson: input.before === undefined ? undefined : (input.before as object),
        afterJson: input.after === undefined ? undefined : (input.after as object),
      },
    });
  } catch {
    // Never block business operations on audit failure
  }
}

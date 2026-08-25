"use client";

import type { VeloraCardProduct } from "@/lib/my-velora/types";
import { cn } from "@/lib/utils";

type Props = {
  products: VeloraCardProduct[];
  className?: string;
};

function ProductImg({
  product,
  className,
}: {
  product: VeloraCardProduct;
  className?: string;
}) {
  const src =
    product.imageUrl || `/api/media/product/${encodeURIComponent(product.id)}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={product.name}
      className={cn(
        "h-full w-full object-contain drop-shadow-[0_8px_24px_rgba(61,38,64,0.18)]",
        className,
      )}
      draggable={false}
    />
  );
}

export function ProductComposition({ products, className }: Props) {
  const count = products.length;
  if (!count) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center", className)}>
        <p className="font-latin text-[28px] tracking-[0.2em] text-[#6B5A72]/60">
          VELORA
        </p>
      </div>
    );
  }

  if (count === 1) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center p-[6%]", className)}>
        <div className="h-full w-[62%]">
          <ProductImg product={products[0]!} />
        </div>
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className={cn("flex h-full w-full items-end justify-center gap-[4%] px-[5%] pb-[8%]", className)}>
        <div className="h-[78%] w-[38%] -rotate-3">
          <ProductImg product={products[0]!} />
        </div>
        <div className="h-[82%] w-[38%] rotate-2">
          <ProductImg product={products[1]!} />
        </div>
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className={cn("relative h-full w-full px-[6%] pb-[6%] pt-[4%]", className)}>
        <div className="absolute left-[8%] top-[8%] h-[52%] w-[34%] -rotate-6">
          <ProductImg product={products[0]!} />
        </div>
        <div className="absolute left-[34%] top-[18%] z-10 h-[58%] w-[34%]">
          <ProductImg product={products[1]!} />
        </div>
        <div className="absolute right-[6%] top-[10%] h-[50%] w-[32%] rotate-6">
          <ProductImg product={products[2]!} />
        </div>
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className={cn("grid h-full w-full grid-cols-2 gap-[3%] p-[7%]", className)}>
        {products.slice(0, 4).map((p) => (
          <div key={p.id} className="min-h-0">
            <ProductImg product={p} />
          </div>
        ))}
      </div>
    );
  }

  const visible = products.slice(0, 6);
  return (
    <div className={cn("grid h-full w-full grid-cols-3 gap-[2%] p-[6%]", className)}>
      {visible.map((p, i) => (
        <div
          key={p.id}
          className={cn(
            "min-h-0",
            i === 0 && "col-span-2 row-span-2",
          )}
        >
          <ProductImg product={p} />
        </div>
      ))}
    </div>
  );
}

import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Cpu, HardDrive, MemoryStick } from "lucide-react";
import {
  Product,
  categoryLabel,
  conditionLabel,
  formatKES,
  productImage,
  stockLabel,
} from "@/lib/shop";

const ProductCard = ({ product }: { product: Product }) => {
  const discounted =
    product.original_price && product.original_price > product.price;

  return (
    <Card className="group overflow-hidden border-border/70 transition-shadow hover:shadow-hover">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={productImage(product)}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{conditionLabel(product.condition)}</Badge>
            {discounted && <Badge variant="destructive">Offer</Badge>}
          </div>
          {product.stock_status !== "in_stock" && (
            <Badge className="absolute right-3 top-3" variant="outline">
              {stockLabel(product.stock_status)}
            </Badge>
          )}
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {product.brand} · {categoryLabel(product.category)}
            </span>
          </div>

          <h2 className="line-clamp-2 text-base font-semibold text-foreground">
            {product.name}
          </h2>

          {(product.processor || product.ram || product.storage) && (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {product.processor && (
                <li className="flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
                  {product.processor}
                </li>
              )}
              {product.ram && (
                <li className="flex items-center gap-2">
                  <MemoryStick className="h-3.5 w-3.5" aria-hidden="true" />
                  {product.ram} RAM
                </li>
              )}
              {product.storage && (
                <li className="flex items-center gap-2">
                  <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
                  {product.storage}
                </li>
              )}
            </ul>
          )}

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-bold text-primary">
              {formatKES(Number(product.price))}
            </span>
            {discounted && (
              <span className="text-sm text-muted-foreground line-through">
                {formatKES(Number(product.original_price))}
              </span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
};

export default ProductCard;

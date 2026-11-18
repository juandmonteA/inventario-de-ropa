import { listCategories } from "@/lib/queries";
import { CATEGORIES } from "@/lib/constants";
import { NewProductForm } from "@/components/NewProductForm";
import { PageHeader } from "@/components/ui";
import { requirePermission } from "@/lib/auth";

export const metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  await requirePermission("inventario.crear");
  const categories = [...new Set([...CATEGORIES, ...listCategories()])].sort();
  return (
    <>
      <PageHeader
        title="Nuevo producto"
        subtitle="Crea el producto con su primer color y las unidades de cada talla."
      />
      <NewProductForm categories={categories} />
    </>
  );
}

import type { Route } from "./+types/category";
import { Link, data } from "react-router";
import { getCategoryById, loadCategoryData } from "~/lib/data";
import type { BaseEntry } from "~/lib/types";

export function meta({ data: loaderData }: Route.MetaArgs) {
  if (!loaderData) {
    return [{ title: "Not Found - Awesome LED List" }];
  }
  return [
    { title: `${loaderData.category.name} - Awesome LED List` },
    { name: "description", content: loaderData.category.description },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const categoryId = params.category;
  const category = getCategoryById(categoryId);

  if (!category) {
    throw data(null, { status: 404 });
  }

  const entries = loadCategoryData(categoryId);

  return { category, entries };
}

export default function CategoryPage({ loaderData }: Route.ComponentProps) {
  const { category, entries } = loaderData;

  return (
    <main
      className="container py-8 category-theme"
      style={{ "--category-hue": category.color.hue } as React.CSSProperties}
    >
      <nav className="mb-2 flex items-center gap-2">
        <Link to="/" className="text-sm text-muted hover:text-foreground">
          Home
        </Link>
        <span className="text-muted">/</span>
        <span className="text-sm">{category.name}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
        <p className="text-muted">{category.description}</p>
        <p className="text-sm text-muted mt-2">{entries.length} entries</p>
      </header>

      <div className="border rounded-lg overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Manufacturer</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry: BaseEntry) => (
              <tr key={entry.id}>
                <td>
                  <Link
                    to={`${category.path}/${entry.id}`}
                    className="font-medium"
                    style={{ color: "var(--category-primary)" }}
                  >
                    {entry.name}
                  </Link>
                </td>
                <td className="text-muted">
                  {(entry.manufacturer as string) || (entry.developer as string) || "-"}
                </td>
                <td className="text-muted text-sm">
                  {getEntryDetails(entry)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function getEntryDetails(entry: BaseEntry): string {
  const details: string[] = [];

  if (entry.max_pixels) details.push(`${entry.max_pixels} pixels`);
  if (entry.max_outputs) details.push(`${entry.max_outputs} outputs`);
  if (entry.price) details.push(`$${entry.price}`);
  if (entry.interfaces && Array.isArray(entry.interfaces)) {
    details.push(entry.interfaces.join(", "));
  }
  if (entry.status && entry.status !== "unknown") details.push(entry.status as string);

  return details.length > 0 ? details.join(" | ") : "-";
}

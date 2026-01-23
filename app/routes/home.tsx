import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Awesome LED List" },
    { name: "description", content: "A comprehensive database of addressable LEDs, controllers, and related products" },
  ];
}

export default function Home() {
  return (
    <main style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      flexDirection: "column",
      gap: "2rem",
      padding: "2rem"
    }}>
      <h1 style={{
        fontSize: "2.5rem",
        fontWeight: "bold",
        color: "var(--foreground)"
      }}>
        Awesome LED List
      </h1>
      <p style={{
        color: "var(--muted-foreground)",
        textAlign: "center",
        maxWidth: "40rem"
      }}>
        A comprehensive database of addressable LEDs, controllers, pixels, and related products for makers and enthusiasts.
      </p>
      <p style={{
        color: "var(--muted-foreground)",
        fontSize: "0.875rem"
      }}>
        Phase 1: Foundation setup complete. Ready for Phase 2.
      </p>
    </main>
  );
}

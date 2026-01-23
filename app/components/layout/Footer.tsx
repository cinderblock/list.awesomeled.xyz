import { RainbowText } from "~/components/ui/RainbowText";

export function Footer() {
  return (
    <footer className="border-t py-6 select-none" style={{ backgroundColor: "var(--muted)" }}>
      <div className="container px-4 text-center">
        <p className="text-sm text-muted">
          <RainbowText>Awesome LED List</RainbowText> is a community resource. Data is provided as-is with no guarantee of
          accuracy.
        </p>
        <p className="text-sm text-muted mt-2">
          <a
            href="https://github.com/cinderblock/awesomeledlist"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
            style={{ textDecoration: "underline" }}
          >
            Contribute on GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}

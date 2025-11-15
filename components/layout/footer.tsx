import Link from "next/link";

/**
 * Global footer component with SmartCamp.AI branding
 * Required by PRD: "© Created with ❤️ by SmartCamp.AI"
 */
export function Footer() {
  return (
    <footer className="border-t border-background-secondary mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-text-secondary text-sm">
          <p>
            © Created with ❤️ by{" "}
            <a
              href="https://smartcamp.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary hover:underline"
            >
              SmartCamp.AI
            </a>
            {" | "}
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            {" | "}
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
            {" | "}
            <a href="mailto:hello@smartcamp.ai" className="hover:underline">
              Contact
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

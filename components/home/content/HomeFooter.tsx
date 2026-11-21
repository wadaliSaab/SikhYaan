
import AppText from "@/components/ui/AppText";

export default function HomeFooter() {
    return (
        <footer className="mt-10 flex w-full border-t border-border/20 bg-primary/20">
            <div className="mx-auto  flex w-full max-w-6xl flex-col items-center gap-3 px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left">

                <div>
                    <AppText
                        as="h2"
                        variant="subtitle"
                        className="text-accent"
                    >
                        SikhYaan
                    </AppText>

                    <AppText
                        as="p"
                        variant="caption"
                        className="mt-1 text-text-primary/70"
                    >
                        Discover, learn and connect with Sikh heritage.
                    </AppText>
                </div>

                <div className="flex items-center gap-4">
                    <a
                        href="/about"
                        className="text-sm text-text-primary/70 transition-colors hover:text-accent"
                    >
                        About
                    </a>

                    <a
                        href="/contact"
                        className="text-sm text-text-primary/70 transition-colors hover:text-accent"
                    >
                        Contact
                    </a>

                    <a
                        href="/privacy"
                        className="text-sm text-text-primary/70 transition-colors hover:text-accent"
                    >
                        Privacy
                    </a>
                </div>

                <AppText
                    as="p"
                    variant="caption"
                    className="text-text-primary/60"
                >
                    © 2026 SikhYaan
                </AppText>

            </div>
        </footer>
    );
}


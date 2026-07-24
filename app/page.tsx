import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "X-Disturb",
  description: "Enhancing Peace in Shared Spaces",
};

export default function Home() {
	return (
		<div style={{ fontFamily: "var(--font-landing-body)" }}>
			<LandingPage />
		</div>
	);
}

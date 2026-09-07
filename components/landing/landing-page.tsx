"use client";

import Image from "next/image";
import Link from "next/link";
import {
	BookOpen,
	Church,
	MapPin,
	Moon,
	Smartphone,
	VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LandingReveal } from "@/components/landing/landing-reveal";
import { PlayStoreButton } from "@/components/landing/play-store-button";
import { SilenceRings } from "@/components/landing/silence-rings";

const steps = [
	{
		title: "You enter a silent zone",
		body: "X-Disturb recognizes churches, mosques, libraries, and other quiet places around you.",
	},
	{
		title: "Your phone settles",
		body: "Ringers and alerts ease down so the space stays undisturbed — without you hunting for mute.",
	},
	{
		title: "You leave, life resumes",
		body: "When you step outside the zone, your usual settings return on their own.",
	},
] as const;

const places = [
	{
		icon: Church,
		label: "Churches",
		detail: "Orthodox, Protestant, and shared Christian spaces",
	},
	{
		icon: Moon,
		label: "Mosques",
		detail: "Prayer times and gatherings stay uninterrupted",
	},
	{
		icon: BookOpen,
		label: "Libraries",
		detail: "Study halls and reading rooms stay focused",
	},
] as const;

const traits = [
	{
		icon: VolumeX,
		title: "Silence that remembers for you",
		body: "Set it once. The app watches the map so reverence is not a phone setting you forget.",
	},
	{
		icon: MapPin,
		title: "Zones drawn on real places",
		body: "Geofenced quiet around venues that matter — not a blanket do-not-disturb for your whole day.",
	},
	{
		icon: Smartphone,
		title: "Built for everyday Ethiopia",
		body: "Plans and payments that fit local use, so quiet spaces stay accessible for everyone.",
	},
] as const;

export function LandingPage() {
	return (
		<div className="landing-shell">
			<header className="absolute inset-x-0 top-0 z-20">
				<div className="mx-auto flex h-[var(--header-height)] max-w-6xl items-center justify-between px-5 sm:px-8">
					<Link href="/" className="relative block h-8 w-[7.5rem] shrink-0">
						<Image
							src="/logo.svg"
							alt="X-Disturb"
							fill
							priority
							className="object-contain object-left"
						/>
					</Link>

					<nav className="flex items-center gap-1 sm:gap-2">
						<Button variant="ghost" size="sm" asChild>
							<a href="#how-it-works">How it works</a>
						</Button>
						<Button variant="outline" size="sm" asChild>
							<Link href="/auth/login">Admin Portal</Link>
						</Button>
					</nav>
				</div>
			</header>

			<main>
				{/* Hero: brand + thesis + silence rings as full-bleed plane */}
				<section className="relative min-h-[100svh] overflow-hidden">
					<SilenceRings />

					<div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-[calc(var(--header-height)+2.5rem)] sm:px-8 sm:pb-24 md:justify-center md:pb-20">
						<div className="max-w-xl space-y-6 md:max-w-2xl">
							<p className="landing-display animate-landing-rise text-sm font-semibold uppercase tracking-[0.22em] text-primary">
								X-Disturb
							</p>
							<h1 className="landing-display animate-landing-rise text-[clamp(2.4rem,6vw,4.25rem)] font-semibold leading-[1.05] text-foreground [animation-delay:80ms]">
								Your phone stays quiet where reverence begins.
							</h1>
							<p className="animate-landing-rise max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg [animation-delay:160ms]">
								Silent zones around churches, mosques, and libraries — so
								respect does not depend on remembering to mute.
							</p>
							<div className="animate-landing-rise flex flex-wrap items-center gap-3 pt-1 [animation-delay:240ms]">
								<PlayStoreButton />
								<Button size="lg" variant="outline" asChild>
									<a href="#how-it-works">See how it works</a>
								</Button>
							</div>
						</div>
					</div>
				</section>

				{/* How it works — sequence, so numbered steps earn their place */}
				<section
					id="how-it-works"
					className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28"
				>
					<LandingReveal>
						<p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
							How it works
						</p>
						<h2 className="landing-display mt-3 max-w-xl text-3xl font-semibold text-foreground sm:text-4xl">
							Walk in. Stay quiet. Walk out.
						</h2>
					</LandingReveal>

					<ol className="mt-12 space-y-0">
						{steps.map((step, index) => (
							<li key={step.title}>
								<LandingReveal delayMs={index * 80}>
									<div className="grid gap-4 py-8 sm:grid-cols-[5rem_1fr] sm:gap-10">
										<span className="landing-display text-3xl font-semibold tabular-nums text-primary/80">
											{String(index + 1).padStart(2, "0")}
										</span>
										<div>
											<h3 className="text-xl font-semibold tracking-tight text-foreground">
												{step.title}
											</h3>
											<p className="mt-2 max-w-xl text-muted-foreground leading-relaxed">
												{step.body}
											</p>
										</div>
									</div>
								</LandingReveal>
								{index < steps.length - 1 ? <Separator /> : null}
							</li>
						))}
					</ol>
				</section>

				{/* Places */}
				<section className="border-y border-border bg-secondary/40">
					<div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
						<LandingReveal>
							<p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
								Where it listens
							</p>
							<h2 className="landing-display mt-3 max-w-lg text-3xl font-semibold text-foreground sm:text-4xl">
								Quiet for the places that ask for it.
							</h2>
						</LandingReveal>

						<ul className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
							{places.map((place, index) => (
								<li key={place.label}>
									<LandingReveal delayMs={index * 90}>
										<place.icon
											className="h-6 w-6 text-primary"
											strokeWidth={1.75}
											aria-hidden
										/>
										<h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
											{place.label}
										</h3>
										<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
											{place.detail}
										</p>
									</LandingReveal>
								</li>
							))}
						</ul>
					</div>
				</section>

				{/* Traits — open layout, not a card grid */}
				<section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
					<LandingReveal>
						<p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
							What you get
						</p>
						<h2 className="landing-display mt-3 max-w-xl text-3xl font-semibold text-foreground sm:text-4xl">
							Respect that travels with you.
						</h2>
					</LandingReveal>

					<ul className="mt-14 space-y-12">
						{traits.map((trait, index) => (
							<li key={trait.title}>
								<LandingReveal delayMs={index * 70}>
									<div className="grid gap-4 md:grid-cols-[3rem_minmax(0,14rem)_1fr] md:items-start md:gap-8">
										<trait.icon
											className="h-7 w-7 text-primary"
											strokeWidth={1.75}
											aria-hidden
										/>
										<h3 className="text-lg font-semibold tracking-tight text-foreground md:pt-0.5">
											{trait.title}
										</h3>
										<p className="max-w-xl text-muted-foreground leading-relaxed">
											{trait.body}
										</p>
									</div>
								</LandingReveal>
								{index < traits.length - 1 ? (
									<Separator className="mt-12" />
								) : null}
							</li>
						))}
					</ul>
				</section>

				{/* Closing CTA */}
				<section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
					<LandingReveal>
						<div className="relative overflow-hidden rounded-lg border border-border bg-sidebar px-6 py-12 sm:px-12 sm:py-16">
							<div
								aria-hidden
								className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full border border-primary/20"
							/>
							<div
								aria-hidden
								className="pointer-events-none absolute -right-6 -top-6 size-36 rounded-full border border-primary/30"
							/>
							<div className="relative max-w-lg">
								<h2 className="landing-display text-3xl font-semibold text-sidebar-foreground sm:text-4xl">
									Keep the room quiet.
								</h2>
								<p className="mt-3 text-sidebar-foreground/70 leading-relaxed">
									Operators manage zones, users, and plans from the dashboard.
									Everyday people just walk in.
								</p>
							</div>
						</div>
					</LandingReveal>
				</section>
			</main>

			<footer className="border-t border-border">
				<div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
					<div className="flex flex-col gap-4 sm:gap-3">
						<PlayStoreButton variant="outline" />
						<p className="text-sm text-muted-foreground">
							© {new Date().getFullYear()} X-Disturb
						</p>
					</div>
					<div className="flex flex-wrap gap-4 text-sm">
						<Link
							href="/auth/login"
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							Admin Portal
						</Link>
						<Link
							href="/help-center"
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							Help
						</Link>
						<a
							href="#how-it-works"
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							How it works
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}

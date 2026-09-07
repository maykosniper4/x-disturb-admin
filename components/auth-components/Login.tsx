"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth } from "@/firebase/config";
import { session } from "@/lib/sessionStorage";
import { isDashboardDemoEnabled } from "@/lib/dashboard-demo-data";

export default function LoginPage() {
	const router = useRouter();
	const [showPassword, setShowPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [signInWithEmailAndPassword] = useSignInWithEmailAndPassword(auth);

	useEffect(() => {
		if (session.getItem("isAuthenticated")) {
			router.push("/dashboard");
		}
	}, [router]);

	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const res = await signInWithEmailAndPassword(
				formData.email,
				formData.password,
			);

			if (res) {
				session.setItem("isAuthenticated", true);
				session.setItem("userId", res.user.uid);
				session.setItem("accessToken", await res.user.getIdToken());
				router.push("/dashboard");
			}
		} catch (err) {
			console.error(err);
		} finally {
			setIsSubmitting(false);
		}
	};

	const isDemo = isDashboardDemoEnabled();

	const handleDemoLogin = () => {
		session.setItem("isAuthenticated", true);
		session.setItem("userId", "demo_admin_user");
		session.setItem("accessToken", "demo_access_token");
		router.push("/dashboard");
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md border-border shadow-sm">
				<CardHeader className="text-center">
					<CardTitle className="text-xl font-semibold">Sign in</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleLogin} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								placeholder="Enter your email"
								value={formData.email}
								onChange={handleChange}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<div className="relative">
								<Input
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									autoComplete="current-password"
									placeholder="Enter your password"
									value={formData.password}
									onChange={handleChange}
									required
								/>
								<button
									type="button"
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									onClick={() => setShowPassword((prev) => !prev)}
									aria-label={showPassword ? "Hide password" : "Show password"}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>

						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Signing in…
								</>
							) : (
								"Sign in"
							)}
						</Button>

						{isDemo && (
							<Button
								type="button"
								variant="outline"
								className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/10"
								onClick={handleDemoLogin}
							>
								🚀 Enter Demo Dashboard
							</Button>
						)}

						<p className="text-center text-sm text-primary">
							Forgot your password?
						</p>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

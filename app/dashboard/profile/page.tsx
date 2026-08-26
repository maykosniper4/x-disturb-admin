"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState } from "react";
import Image from "next/image";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { session } from "@/lib/sessionStorage";
import { db, auth } from "@/firebase/config";
import { useAdminContext } from "@/components/context-provider";
import ProfileSkeleton from "@/components/dashboard/profile/ProfileSkeleton";
import LegalDocumentsManager from "@/components/dashboard/profile/LegalDocumentsManager";
import { AdminPageContent } from "@/components/admin/admin-layout";
import { toast } from "react-toastify";
import { User, ShieldCheck } from "lucide-react";

const profileSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().email("Invalid email address").min(1, "Email is required"),
	bio: z.string().optional(),
	username: z.string().min(1, "Username is required"),
	timezone: z.string().min(1, "Timezone is required"),
	language: z.string().min(1, "Language is required"),
	notifications: z.object({
		productInfo: z.boolean(),
		nonEssential: z.boolean(),
	}),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const timeZones = [
	{ value: "America/New_York", label: "Eastern Time (ET)" },
	{ value: "America/Chicago", label: "Central Time (CT)" },
	{ value: "America/Denver", label: "Mountain Time (MT)" },
	{ value: "America/Los_Angeles", label: "Pacific Time (PT)" },
	{ value: "Africa/Addis_Ababa", label: "East Africa Time (EAT)" },
	{ value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
	{ value: "Europe/Paris", label: "Central European Time (CET)" },
	{ value: "Asia/Dubai", label: "Gulf Standard Time (GST)" },
	{ value: "Asia/Kolkata", label: "Indian Standard Time (IST)" },
];

export default function ProfilePage() {
	const [submitting, setSubmitting] = useState(false);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const { triggerRefetch } = useAdminContext();
	const id = auth?.currentUser?.uid || session?.getItem("userId") || "admin_id";

	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
	});

	const firstName = form.watch("firstName");
	const lastName = form.watch("lastName");

	useEffect(() => {
		const fetchAdminProfile = async () => {
			setLoading(true);
			try {
				const docRef = doc(db, "admin_profile", id);
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					const data = docSnap.data();
					form.reset({
						firstName: data.firstName || "",
						lastName: data.lastName || "",
						email: data.email || "",
						bio: data.bio || "",
						username: data.username || "",
						timezone: data.timezone || "",
						language: data.language || "English",
						notifications: {
							productInfo: data.notifications?.productInfo ?? true,
							nonEssential: data.notifications?.nonEssential ?? false,
						},
					});
				}
			} catch (err) {
				console.error("Error fetching admin profile:", err);
			}
			setLoading(false);
		};

		fetchAdminProfile();
	}, [id, form]);

	const onSubmit = async (data: ProfileFormValues) => {
		setSubmitting(true);
		try {
			const cleaned = Object.fromEntries(
				Object.entries(data).filter(([_, v]) => v !== undefined),
			);
			cleaned.userId = id;
			const docRef = doc(db, "admin_profile", id);
			await setDoc(docRef, cleaned, { merge: true });
			triggerRefetch();
			toast.success("Profile saved successfully!");
		} catch (err: any) {
			console.error("=== PROFILE SAVE FAILED ===");
			console.error("Error code:", err?.code);
			console.error("Error message:", err?.message);
			toast.error(err?.message || "Failed to save profile. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<AdminPageContent wide>
				<Card className="border-border shadow-sm">
					<CardContent className="p-6">
						<ProfileSkeleton />
					</CardContent>
				</Card>
			</AdminPageContent>
		);
	}

	return (
		<AdminPageContent wide>
			<Tabs defaultValue="profile" className="space-y-6">
				<TabsList className="bg-muted p-1 rounded-xl">
					<TabsTrigger value="profile" className="gap-2 rounded-lg data-[state=active]:bg-background">
						<User className="h-4 w-4" />
						Admin Profile
					</TabsTrigger>
					<TabsTrigger value="legal" className="gap-2 rounded-lg data-[state=active]:bg-background">
						<ShieldCheck className="h-4 w-4 text-primary" />
						App Legal & Policies (Data Security, Agreement, Privacy)
					</TabsTrigger>
				</TabsList>

				<TabsContent value="profile" className="space-y-6">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="max-w-4xl space-y-6"
						>
							<Card className="border-border shadow-sm">
								<CardHeader>
									<CardTitle className="text-base font-semibold">
										Basic info
									</CardTitle>
								</CardHeader>
								<CardContent className="grid gap-6 md:grid-cols-[160px_1fr]">
									<div className="flex flex-col items-center gap-3">
										<Avatar className="h-32 w-32">
											<Image
												src="/placeholder.png"
												alt="Profile"
												width={128}
												height={128}
												className="aspect-square size-full object-cover"
											/>
											<AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
												{firstName?.[0]}
												{lastName?.[0]}
											</AvatarFallback>
										</Avatar>
									</div>

									<div className="space-y-4">
										<div className="grid gap-4 sm:grid-cols-2">
											<FormField
												control={form.control}
												name="firstName"
												render={({ field }) => (
													<FormItem>
														<FormLabel>First name</FormLabel>
														<FormControl>
															<Input {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="lastName"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Last name</FormLabel>
														<FormControl>
															<Input {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<FormField
											control={form.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Email</FormLabel>
													<FormControl>
														<Input {...field} type="email" />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="bio"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Bio</FormLabel>
													<FormControl>
														<Textarea
															{...field}
															placeholder="Write a few things about yourself"
															className="min-h-[100px]"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</CardContent>
							</Card>

							<Card className="border-border shadow-sm">
								<CardHeader>
									<CardTitle className="text-base font-semibold">
										Sign-in credentials
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<FormField
										control={form.control}
										name="username"
										render={({ field }) => (
											<FormItem className="max-w-md">
												<FormLabel>Username</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button type="button" variant="outline" disabled>
										Change password
									</Button>
								</CardContent>
							</Card>

							<Card className="border-border shadow-sm">
								<CardHeader>
									<CardTitle className="text-base font-semibold">
										Location and language
									</CardTitle>
								</CardHeader>
								<CardContent className="grid gap-4 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="timezone"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Timezone</FormLabel>
												<Select onValueChange={field.onChange} value={field.value}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select timezone" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{timeZones.map((timeZone) => (
															<SelectItem
																key={timeZone.value}
																value={timeZone.value}
															>
																{timeZone.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="language"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Language</FormLabel>
												<Select onValueChange={field.onChange} value={field.value}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select language" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="English">English</SelectItem>
														<SelectItem value="Spanish">Spanish</SelectItem>
														<SelectItem value="French">French</SelectItem>
														<SelectItem value="German">German</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>

							<Card className="border-border shadow-sm">
								<CardHeader>
									<CardTitle className="text-base font-semibold">
										Email and notification settings
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<FormField
										control={form.control}
										name="notifications.productInfo"
										render={({ field }) => (
											<FormItem className="flex items-start gap-3 space-y-0">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
														className="mt-0.5"
													/>
												</FormControl>
												<div className="space-y-1">
													<FormLabel className="font-normal leading-snug">
														Receive product updates, feedback requests, and feature
														announcements.
													</FormLabel>
												</div>
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="notifications.nonEssential"
										render={({ field }) => (
											<FormItem className="flex items-start gap-3 space-y-0">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
														className="mt-0.5"
													/>
												</FormControl>
												<div className="space-y-1">
													<FormLabel className="font-normal leading-snug">
														Exclude from all non-essential emails and notifications.
													</FormLabel>
												</div>
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>

							<div className="flex gap-3">
								<Button type="submit" disabled={form.formState.isSubmitting}>
									{submitting ? "Saving…" : "Save changes"}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => router.push("/dashboard")}
								>
									Cancel
								</Button>
							</div>
						</form>
					</Form>
				</TabsContent>

				<TabsContent value="legal" className="space-y-6">
					<LegalDocumentsManager />
				</TabsContent>
			</Tabs>
		</AdminPageContent>
	);
}

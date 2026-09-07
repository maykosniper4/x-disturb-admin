"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { getUserStatusTone } from "@/lib/admin-status-badge";
import { AdminPageContent } from "@/components/admin/admin-layout";
import { updateUserData } from "@/app/api/user-management-api";
import { db } from "@/firebase/config";
import { toast } from "react-toastify";
import { Phone, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const CATEGORY_OPTIONS = [
	{ value: "Orthodox", label: "Orthodox" },
	{ value: "Muslim", label: "Muslim" },
	{ value: "Protestant", label: "Protestant" },
	{ value: "General", label: "General" },
];

const formSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }),
	phoneNumber: z.string().min(6, { message: "Valid phone number is required" }),
	category: z.string(),
	email: z.string().email({ message: "Invalid email" }).optional().or(z.literal("")),
	reason: z.string().optional(),
	currentStatus: z.boolean(),
	role: z.string().min(1, { message: "Role is required" }),
	referralCode: z.string().optional(),
});

const UserDetailPage = () => {
	const [isUpdating, setIsUpdating] = useState(false);
	const [loading, setLoading] = useState(true);
	const params = useParams();
	const router = useRouter();
	const userId = params.id as string;

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			phoneNumber: "",
			category: "Orthodox",
			email: "",
			reason: "",
			currentStatus: true,
			role: "User",
			referralCode: "",
		},
	});

	const isActive = form.watch("currentStatus");
	const currentName = form.watch("name");
	const currentPhone = form.watch("phoneNumber");

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsUpdating(true);
		const result = await updateUserData(userId, {
			username: values.name,
			phoneNumber: values.phoneNumber,
			category: values.category,
			email: values.email || "",
			currentStatus: values.currentStatus,
			role: values.role,
			referralCode: values.referralCode,
			reason: values.reason || "Updated via admin console",
		});

		if (result.success) {
			toast.success("User updated successfully!");
			router.push("/dashboard/users-management");
		} else {
			toast.error(result.message || "Failed to update user");
		}
		setIsUpdating(false);
	}

	useEffect(() => {
		const fetchUser = async () => {
			setLoading(true);
			try {
				const docRef = doc(db, "users", userId);
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					const data = docSnap.data();
					form.reset({
						name: data.name || data.displayName || "",
						phoneNumber: (data.phoneNumber || "").trim(),
						category: data.category || "Orthodox",
						email: data.email || "",
						currentStatus: data.isActive !== false,
						role: data.role || "User",
						referralCode: data.referralCode || "",
						reason: "",
					});
				} else {
					toast.error("User not found");
				}
			} catch (err) {
				console.error("Error fetching user:", err);
				toast.error("Failed to load user profile");
			}
			setLoading(false);
		};

		if (userId) {
			fetchUser();
		}
	}, [userId, form]);

	return (
		<AdminPageContent wide>
			<div className="mb-4">
				<Link
					href="/dashboard/users-management"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Users Directory
				</Link>
			</div>

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="max-w-2xl space-y-6"
				>
					<Card className="border-border shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
							<div className="flex items-center gap-4">
								<Avatar className="h-14 w-14">
									<AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
										{currentName ? currentName.slice(0, 2).toUpperCase() : "U"}
									</AvatarFallback>
								</Avatar>
								<div>
									<CardTitle className="text-lg font-semibold">
										{currentName || "User details"}
									</CardTitle>
									<p className="text-sm font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5">
										<Phone className="h-3 w-3" />
										{currentPhone || "No phone number"}
									</p>
								</div>
							</div>
							<AdminStatusBadge
								label={isActive ? "Active" : "Inactive"}
								tone={getUserStatusTone(isActive)}
							/>
						</CardHeader>

						<CardContent className="space-y-4">
							{loading ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							) : (
								<>
									<FormField
										control={form.control}
										name="currentStatus"
										render={({ field }) => (
											<FormItem className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3">
												<div className="space-y-0.5">
													<FormLabel className="text-sm font-medium">
														Account Status
													</FormLabel>
													<p className="text-xs text-muted-foreground">
														Active users can log in and use silent zone features
													</p>
												</div>
												<FormControl>
													<Switch
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
											</FormItem>
										)}
									/>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Full Name *</FormLabel>
													<FormControl>
														<Input placeholder="Full Name" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="phoneNumber"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Phone Number * (App ID)</FormLabel>
													<FormControl>
														<Input placeholder="+2519..." {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<FormField
											control={form.control}
											name="category"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Prayer / Silent Category</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select category" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{CATEGORY_OPTIONS.map((c) => (
																<SelectItem key={c.value} value={c.value}>
																	{c.label}
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
											name="role"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Assigned Role</FormLabel>
													<FormControl>
														<Input placeholder="Role (e.g. Standard Operator)" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<FormField
											control={form.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Email Address (Optional)</FormLabel>
													<FormControl>
														<Input placeholder="user@example.com" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="referralCode"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Referral Code</FormLabel>
													<FormControl>
														<Input placeholder="Referral code" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control}
										name="reason"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Reason for Update (Recorded in Audit Logs)</FormLabel>
												<FormControl>
													<Input placeholder="e.g. Verified phone number / Updated category" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</>
							)}
						</CardContent>
					</Card>

					<div className="flex justify-end gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push("/dashboard/users-management")}
						>
							Cancel
						</Button>
						<Button disabled={isUpdating || loading} type="submit">
							{isUpdating ? "Saving changes…" : "Save changes"}
						</Button>
					</div>
				</form>
			</Form>
		</AdminPageContent>
	);
};

export default UserDetailPage;

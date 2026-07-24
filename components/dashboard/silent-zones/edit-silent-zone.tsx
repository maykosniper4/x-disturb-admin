"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

import { db } from "@/firebase/config";
import { serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useDocumentData } from "react-firebase-hooks/firestore";

import { session } from "@/lib/sessionStorage";
import { useEffect, useState } from "react";
import HereMap from "./HereMap";
import { useSearchParams, useRouter } from "next/navigation";
import AddressField from "./AddressSuggestion";

const CenterSchema = z.object({
	latitude: z.string(),
	longitude: z.string(),
});

const formSchema = z.object({
	address: z.string().min(2, {
		message: "Address must be at least 2 characters.",
	}),
	adminID: z.string().min(1, {
		message: "Admin ID is required.",
	}),
	center: CenterSchema,
	description: z.string().optional(),
	isActive: z.boolean(),
	name: z.string().min(2, {
		message: "Zone name must be at least 2 characters.",
	}),
	radius: z.number().min(1).max(500),
	type: z.enum(["church", "mosque", "library"]),
});

export default function UpdateSilentZone() {
	const router = useRouter();
	const [isEditing, setIsEditing] = useState(false);
	const searchParams = useSearchParams();
	const id = searchParams.get("id");

	const [zoneData, loading, error] = useDocumentData(
		id ? doc(db, "silent_zones", id) : null,
	);

	console.log({ zoneData, loading, error });

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			address: "",
			adminID: session?.getItem("userId") || "admin_user",
			center: {
				latitude: "0",
				longitude: "0",
			},
			description: "",
			isActive: true,
			name: "",
			radius: 100,
			type: "church",
		},
	});

	const radius = form.watch("radius");

	useEffect(() => {
		if (zoneData && !loading) {
			form.reset({
				address: zoneData.address || "",
				adminID: zoneData.adminID || session?.getItem("userId") || "admin_user",
				center: {
					latitude: String(zoneData.center?.latitude || "0"),
					longitude: String(zoneData.center?.longitude || "0"),
				},
				description: zoneData.description || "",
				isActive: zoneData.isActive || false,
				name: zoneData.name || "",
				radius: zoneData.radius || 100,
				type: zoneData.type || "church",
			});
		}
	}, [zoneData, loading, form]);

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsEditing(true);
		try {
			if (id) {
				const docRef = doc(db, "silent_zones", id);
				await updateDoc(docRef, {
					...values,
					updatedAt: serverTimestamp(),
				});
				console.log("Document updated with ID:", id);
				router.push("/dashboard/silent-zones");
			}
		} catch (error) {
			console.error("Error processing silent zone:", error);
			form.setError("root", {
				type: "manual",
				message: "Failed to update silent zone. Please try again.",
			});
		}
		setIsEditing(false);
	}

	return (
		<div className="w-full">
			<Card className="border-border shadow-sm">
				<CardContent className="p-6">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							{/* Zone Name */}
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Zone Name</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter zone name"
												{...field}
												className="md:w-1/2"
											/>
										</FormControl>
										<FormMessage className="text-sm text-red-600" />
									</FormItem>
								)}
							/>

							{/* Description */}
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter zone description"
												{...field}
												className="md:w-1/2"
											/>
										</FormControl>
										<FormMessage className="text-sm text-red-600" />
									</FormItem>
								)}
							/>

							{/* Address */}
							{/* Address (Using Custom AddressField Component) */}
							<FormField
								control={form.control}
								name="address"
								render={({ field }) => (
									<FormItem className="md:w-1/2">
										<FormLabel>Address</FormLabel>
										<FormControl>
											<AddressField
												value={field.value}
												onSelect={(val: string) =>
													form.setValue("address", val)
												}
											/>
										</FormControl>
										<FormMessage className="text-sm text-red-600" />
									</FormItem>
								)}
							/>

							{/* Type */}
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem className="">
										<FormLabel>Type</FormLabel>
										<FormControl className="md:w-1/2">
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<SelectTrigger className="md:w-1/2">
													<SelectValue placeholder="Select Location Type" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="church">church</SelectItem>
													<SelectItem value="mosque">Mosque</SelectItem>
													<SelectItem value="library">Library</SelectItem>
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage className="text-sm text-red-600" />
									</FormItem>
								)}
							/>

							{/* isActive */}
							<FormField
								control={form.control}
								name="isActive"
								render={({ field }) => (
									<FormItem className="flex items-center space-x-2">
										<FormLabel>Is Active</FormLabel>
										<FormControl>
											<Switch
												checked={field.value} // Bind the checked state to the form value
												onCheckedChange={field.onChange} // Update the form value on change
											/>
										</FormControl>
										<FormMessage className="text-sm text-red-600" />
									</FormItem>
								)}
							/>

							{/* Map Component */}

							{/* <MapPlace /> */}
							{!loading && zoneData ? (
								<HereMap
									radius={radius}
									initialCoordinates={{
										lat: String(zoneData.center?.latitude || "0"),
										lng: String(zoneData.center?.longitude || "0"),
									}}
									onCoordinatesChange={(coords) => {
										form.setValue("center.latitude", coords.lat);
										form.setValue("center.longitude", coords.lng);
									}}
								/>
							) : (
								<div className="flex h-[400px] w-full flex-col items-center justify-center rounded-md border border-border bg-muted/30">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
									<span className="mt-2 text-sm text-muted-foreground">
										Loading map data…
									</span>
								</div>
							)}

							{/* Zone Radius */}
							<FormField
								control={form.control}
								name="radius"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<div className="w-full">
												<div className="lg:hidden w-full space-y-2">
													<Slider
														min={1}
														max={500}
														step={1}
														defaultValue={[field.value]}
														onValueChange={(vals) => field.onChange(vals[0])}
														className="lg:w-1/2"
													/>
													<div className="flex justify-between">
														<FormLabel className="text-nowrap">
															Zone Radius (Meters)
														</FormLabel>
														<span className="text-sm">{field.value}</span>
													</div>
												</div>

												<div className="w-full justify-between space-x-2 items-center hidden lg:flex">
													<FormLabel className="text-nowrap">
														Zone Radius (Meters)
													</FormLabel>
													<Slider
														min={1}
														max={500}
														step={1}
														defaultValue={[field.value]}
														onValueChange={(vals) => field.onChange(vals[0])}
														className="lg:w-1/2"
													/>
													<span className="text-sm">{field.value}</span>
												</div>
											</div>
										</FormControl>
										<FormMessage className="text-sm text-red-600" />
									</FormItem>
								)}
							/>

							<div className="flex justify-end space-x-2 pt-4">
								<Button
									onClick={() => router.push("/dashboard/silent-zones")}
									variant="outline"
									type="button"
									className="cursor-pointer"
								>
									Cancel
								</Button>
								<Button disabled={isEditing} type="submit">
									{isEditing ? "Saving" : "Save"}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}

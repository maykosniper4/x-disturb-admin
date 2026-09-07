"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	AdminTableShell,
	AdminDataTableEmpty,
	AdminLoadingRow,
} from "@/components/admin/data-table";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { getUserStatusTone } from "@/lib/admin-status-badge";

import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import {
	collection,
	query,
	onSnapshot,
	deleteDoc,
	doc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useEffect, useState } from "react";
import { ConfirmRemovalDialog } from "./ConfirmRemove";
import { Button } from "@/components/ui/button";
import { logAuditEvent } from "@/app/api/audit-logs-api";

interface SilentZone {
	name: string;
	type: "church" | "mosque" | "library";
	radius: number;
	center: {
		latitude: number;
		longitude: number;
	};
	isActive: boolean;
	description: string;
	id: string;
}

export default function SilentZones() {
	const [silentZones, setSilentZones] = useState<SilentZone[]>([]);
	const [loading, setLoading] = useState(true);
	const [isOpen, setIsOpen] = useState(false);
	const [zoneToRemove, setZoneToRemove] = useState<string | null>(null);

	useEffect(() => {
		const silentZonesQuery = query(collection(db, "silent_zones"));
		const unsubscribe = onSnapshot(
			silentZonesQuery,
			(snapshot) => {
				const zonesData = snapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})) as SilentZone[];
				setSilentZones(zonesData);
				setLoading(false);
			},
			(err) => {
				console.log({ err });
				setLoading(false);
			},
		);

		return () => unsubscribe();
	}, []);

	const handleRemoveSilentZone = async (id: string) => {
		try {
			const target = silentZones.find((z) => z.id === id);
			setIsOpen(false);
			await deleteDoc(doc(db, "silent_zones", id));
			await logAuditEvent({
				action: "ZONE_DELETED",
				category: "zones",
				targetType: "Silent Zone",
				targetId: id,
				targetName: target?.name || "Silent Zone",
				details: `Removed silent zone '${target?.name || id}' from active catalog.`,
				status: "danger",
			});
			console.log("Document removed with ID:", id);
		} catch (err) {
			console.error("Error removing silent zone:", err);
		}
	};

	console.log(silentZones);

	return (
		<AdminTableShell>
			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead className="text-muted-foreground">Name</TableHead>
						<TableHead className="text-muted-foreground">Type</TableHead>
						<TableHead className="text-muted-foreground">Radius (m)</TableHead>
						<TableHead className="text-muted-foreground">
							Center Coordinates
						</TableHead>
						<TableHead className="text-muted-foreground">Status</TableHead>
						<TableHead className="text-muted-foreground">Description</TableHead>
						<TableHead className="w-[1%] text-right text-muted-foreground">
							Actions
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{loading ? (
						<AdminLoadingRow columns={7} />
					) : silentZones.length > 0 ? (
						silentZones.map((zone) => (
							<TableRow key={zone.id} className="group">
								<TableCell className="font-medium">
									{zone.name || "N/A"}
								</TableCell>
								<TableCell className="capitalize text-muted-foreground">
									{zone.type}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{zone.radius.toLocaleString()}
								</TableCell>
								<TableCell className="text-muted-foreground font-mono text-xs">
									{Number(zone.center.latitude).toFixed(6)},{" "}
									{Number(zone.center.longitude).toFixed(6)}
								</TableCell>
								<TableCell>
									<AdminStatusBadge
										label={zone.isActive ? "Active" : "Inactive"}
										tone={getUserStatusTone(zone.isActive)}
									/>
								</TableCell>
								<TableCell className="max-w-[250px] truncate text-muted-foreground">
									{zone.description || "N/A"}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100">
										<Link
											href={`silent-zones/edit-zone?id=${zone.id}`}
											className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
											aria-label="Edit zone"
										>
											<Edit className="h-4 w-4" />
										</Link>

										<Button
											onClick={() => {
												setZoneToRemove(zone.id);
												setIsOpen(true);
											}}
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
											aria-label="Delete zone"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))
					) : (
						<AdminDataTableEmpty
							colSpan={7}
							message="No silent zones added yet"
						/>
					)}
				</TableBody>
			</Table>

			{zoneToRemove && (
				<ConfirmRemovalDialog
					onConfirm={() => handleRemoveSilentZone(zoneToRemove)}
					isOpen={isOpen}
					onClose={() => {
						setIsOpen(false);
						setZoneToRemove(null);
					}}
				/>
			)}
		</AdminTableShell>
	);
}

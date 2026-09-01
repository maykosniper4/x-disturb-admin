"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/firebase/config";
import {
	buildDashboardMetrics,
	DashboardMetrics,
	toFirestoreDate,
	type TransactionRecord,
	type ZoneActivityRecord,
} from "@/lib/dashboard-metrics";
import {
	dashboardDemoMetrics,
	isDashboardDemoEnabled,
} from "@/lib/dashboard-demo-data";

interface DashboardUser {
	isActive?: boolean;
}

interface DashboardZone {
	isActive?: boolean;
}

function isMetricsEmpty(metrics: DashboardMetrics): boolean {
	return (
		metrics.stats.totalActivities === 0 &&
		metrics.stats.totalUsers === 0 &&
		metrics.entriesByZone.length === 0 &&
		metrics.stats.totalRevenue === 0
	);
}

export function useDashboardMetrics() {
	const useDemo = isDashboardDemoEnabled();
	const [metrics, setMetrics] = useState<DashboardMetrics | null>(
		useDemo ? dashboardDemoMetrics : null,
	);
	const [loading, setLoading] = useState(!useDemo);
	const [error, setError] = useState<string | null>(null);
	const [isDemo, setIsDemo] = useState(useDemo);

	useEffect(() => {
		if (useDemo) {
			setMetrics(dashboardDemoMetrics);
			setLoading(false);
			setIsDemo(true);
			return;
		}

		let activities: ZoneActivityRecord[] = [];
		let users: DashboardUser[] = [];
		let zones: DashboardZone[] = [];
		let transactions: TransactionRecord[] = [];
		let loaded = {
			activities: false,
			users: false,
			zones: false,
			transactions: false,
		};

		const recompute = () => {
			if (!Object.values(loaded).every(Boolean)) return;
			const live = buildDashboardMetrics(
				activities,
				users,
				zones,
				transactions,
			);
			setMetrics(live);
			setIsDemo(false);
			setLoading(false);
		};

		const handleError = (message: string) => (err: Error) => {
			console.error(message, err);
			const emptyLive = buildDashboardMetrics([], [], [], []);
			setMetrics(emptyLive);
			setIsDemo(false);
			setError(err.message);
			setLoading(false);
		};

		const unsubActivities = onSnapshot(
			query(collection(db, "zone_activities")),
			(snapshot) => {
				activities = snapshot.docs.map((doc) => {
					const data = doc.data();
					return {
						id: doc.id,
						zoneName: String(data.zoneName ?? "Unknown Zone"),
						timestamp: toFirestoreDate(data.timestamp),
					};
				});
				loaded.activities = true;
				recompute();
			},
			handleError("Error loading zone activities"),
		);

		const unsubUsers = onSnapshot(
			query(collection(db, "users")),
			(snapshot) => {
				users = snapshot.docs.map((doc) => doc.data() as DashboardUser);
				loaded.users = true;
				recompute();
			},
			handleError("Error loading users"),
		);

		const unsubZones = onSnapshot(
			query(collection(db, "silent_zones")),
			(snapshot) => {
				zones = snapshot.docs.map((doc) => doc.data() as DashboardZone);
				loaded.zones = true;
				recompute();
			},
			handleError("Error loading silent zones"),
		);

		const unsubTransactions = onSnapshot(
			query(collection(db, "transactions")),
			(snapshot) => {
				transactions = snapshot.docs.map((doc) => {
					const data = doc.data();
					return {
						id: doc.id,
						amount: Number(data.amount ?? 0),
						currency: String(data.currency ?? "ETB"),
						plan_id: String(data.plan_id ?? "Other"),
						status: String(data.status ?? ""),
						created_at: toFirestoreDate(data.created_at),
					};
				});
				loaded.transactions = true;
				recompute();
			},
			handleError("Error loading transactions"),
		);

		return () => {
			unsubActivities();
			unsubUsers();
			unsubZones();
			unsubTransactions();
		};
	}, [useDemo]);

	return { metrics, loading, error, isDemo };
}

"use client";

import { useEffect, useState, useCallback } from "react";
import {
	collection,
	query,
	onSnapshot,
	doc,
	addDoc,
	setDoc,
	updateDoc,
	deleteDoc,
	serverTimestamp,
	Timestamp,
	limit,
	startAfter,
	getDocs,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { logAuditEvent } from "@/app/api/audit-logs-api";

// User interface matching both mobile app and web dashboard schemas
export interface User {
	id: string;
	name?: string;
	displayName?: string;
	phoneNumber?: string;
	category?: string;
	email?: string;
	isActive: boolean;
	createdAt?: Timestamp;
	lastLogin?: Timestamp;
	role?: string;
	referralCode?: string;
	referralCount?: number;
	fcmToken?: string;
	uid?: string;
}

// Helper to normalize Ethiopian phone numbers to international +251 format
export function normalizePhone(raw: string): string {
	const trimmed = raw.trim().replace(/[\s-]/g, "");
	if (trimmed.startsWith("+251")) return trimmed;
	if (trimmed.startsWith("251")) return `+${trimmed}`;
	if (trimmed.startsWith("09") || trimmed.startsWith("07")) {
		return `+251${trimmed.substring(1)}`;
	}
	if (trimmed.startsWith("9") || trimmed.startsWith("7")) {
		return `+251${trimmed}`;
	}
	return trimmed;
}

// Function to fetch users (supports real-time listener + paginated fallback)
export const useFetchUsers = () => {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAllPaginated = useCallback(async () => {
		try {
			let lastDoc = null;
			const fetchedUsers: User[] = [];

			while (true) {
				const q = lastDoc
					? query(collection(db, "users"), startAfter(lastDoc), limit(1))
					: query(collection(db, "users"), limit(1));

				const snapshot = await getDocs(q);
				if (snapshot.empty) break;

				snapshot.forEach((docSnap) => {
					lastDoc = docSnap;
					const data = docSnap.data();
					fetchedUsers.push({
						id: docSnap.id,
						...data,
						name: data.name || data.displayName || "",
						displayName: data.displayName || data.name || "",
						phoneNumber: (data.phoneNumber || "").trim(),
						category: data.category || "N/A",
						isActive: data.isActive !== false,
					} as User);
				});

				if (fetchedUsers.length >= 200) break;
			}

			setUsers(fetchedUsers);
			setLoading(false);
			setError(null);
		} catch (err) {
			console.error("Error during paginated user fetch:", err);
			setError(err instanceof Error ? err.message : "Failed to fetch users");
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		let isMounted = true;
		const usersQuery = query(collection(db, "users"));

		const unsubscribe = onSnapshot(
			usersQuery,
			(snapshot) => {
				if (!isMounted) return;
				const usersData = snapshot.docs.map((docSnap) => {
					const data = docSnap.data();
					return {
						id: docSnap.id,
						...data,
						name: data.name || data.displayName || "",
						displayName: data.displayName || data.name || "",
						phoneNumber: (data.phoneNumber || "").trim(),
						category: data.category || "N/A",
						isActive: data.isActive !== false,
					};
				}) as User[];

				setUsers(usersData);
				setLoading(false);
				setError(null);
			},
			(err) => {
				if (!isMounted) return;
				console.warn(
					"Real-time listener encountered rule limit; switching to paginated retrieval:",
					err.message
				);
				// Fallback to paginated retrieval which satisfies limit <= 1
				fetchAllPaginated();
			}
		);

		return () => {
			isMounted = false;
			unsubscribe();
		};
	}, [fetchAllPaginated]);

	return { users, loading, error, refetch: fetchAllPaginated };
};

// Interface for creating a new user from dashboard
export interface CreateUserInput {
	name: string;
	phoneNumber: string;
	category: string;
	email?: string;
	role: string;
	referralCode?: string;
	isActive: boolean;
}

// Function to create a new user
export const createUser = async (input: CreateUserInput) => {
	try {
		const formattedPhone = normalizePhone(input.phoneNumber);
		const cleanName = input.name.trim();
		const generatedReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

		const docRef = await addDoc(collection(db, "users"), {
			name: cleanName,
			displayName: cleanName,
			phoneNumber: formattedPhone,
			category: input.category || "Orthodox",
			email: input.email ? input.email.trim() : null,
			role: input.role || "Standard Operator",
			referralCode: generatedReferralCode,
			referralCount: 0,
			isActive: input.isActive,
			createdAt: serverTimestamp(),
			lastLogin: null,
		});

		// Also record referral code in referral_codes collection
		try {
			await setDoc(doc(db, "referral_codes", docRef.id), {
				name: generatedReferralCode,
				userId: docRef.id,
			});
		} catch (refErr) {
			console.warn("Could not register referral code doc:", refErr);
		}

		await logAuditEvent({
			action: "USER_CREATED",
			category: "users",
			targetType: "User",
			targetId: docRef.id,
			targetName: cleanName,
			details: `Created new user ${cleanName} (${formattedPhone}) in category '${input.category}' with role '${input.role}'.`,
			metadata: {
				phone: formattedPhone,
				email: input.email || null,
				category: input.category,
				role: input.role,
			},
			status: "success",
		});

		return { success: true, id: docRef.id, message: "User created successfully" };
	} catch (error) {
		console.error("Error creating user:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to create user",
		};
	}
};

// Function to update user status
export const updateUserStatus = async (
	userId: string,
	currentStatus: boolean,
	userName?: string
) => {
	try {
		const userRef = doc(db, "users", userId);
		const newStatus = !currentStatus;
		await updateDoc(userRef, {
			isActive: newStatus,
			updatedAt: serverTimestamp(),
		});

		await logAuditEvent({
			action: "USER_STATUS_TOGGLED",
			category: "users",
			targetType: "User",
			targetId: userId,
			targetName: userName || "User",
			details: `Toggled user status to ${newStatus ? "Active" : "Inactive"}.`,
			metadata: { previousStatus: currentStatus, newStatus },
			status: newStatus ? "success" : "warning",
		});

		return { success: true, message: "User status updated successfully" };
	} catch (error) {
		console.error("Error updating user status:", error);
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Failed to update status",
		};
	}
};

// Function to update user data
export const updateUserData = async (
	userId: string,
	data: {
		email?: string;
		username: string;
		phoneNumber?: string;
		category?: string;
		currentStatus: boolean;
		reason?: string;
		role?: string;
		referralCode?: string;
	},
) => {
	try {
		const userRef = doc(db, "users", userId);
		await updateDoc(userRef, {
			...(data.email ? { email: data.email } : {}),
			name: data.username,
			displayName: data.username,
			...(data.phoneNumber ? { phoneNumber: normalizePhone(data.phoneNumber) } : {}),
			...(data.category ? { category: data.category } : {}),
			isActive: data.currentStatus,
			reason: data.reason || "",
			...(data.role ? { role: data.role } : {}),
			...(data.referralCode ? { referralCode: data.referralCode } : {}),
			updatedAt: serverTimestamp(),
		});

		await logAuditEvent({
			action: "USER_UPDATED",
			category: "users",
			targetType: "User",
			targetId: userId,
			targetName: data.username,
			details: `Updated user profile for ${data.username}. Reason: ${data.reason || "Administrative update"}`,
			metadata: {
				phone: data.phoneNumber,
				category: data.category,
				role: data.role,
				status: data.currentStatus,
			},
			status: "info",
		});

		return { success: true, message: "User updated successfully" };
	} catch (error) {
		console.error("Error updating user:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to update user",
		};
	}
};

// Function to delete user
export const deleteUser = async (userId: string, userName?: string) => {
	try {
		await deleteDoc(doc(db, "users", userId));

		await logAuditEvent({
			action: "USER_DELETED",
			category: "users",
			targetType: "User",
			targetId: userId,
			targetName: userName || "Deleted User",
			details: `Deleted user account with ID: ${userId}.`,
			status: "danger",
		});

		return { success: true };
	} catch (err) {
		console.error("Failed to delete user:", err);
		return { success: false, message: "Failed to delete user" };
	}
};

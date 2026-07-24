import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const q = searchParams.get("q");

	if (!q || q.trim() === "") {
		return NextResponse.json(
			{ error: "Missing required query parameter: q" },
			{ status: 400 },
		);
	}

	try {
		const arcgisUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=${encodeURIComponent(q)}&f=json`;
		const response = await fetch(arcgisUrl);

		if (!response.ok) {
			const errorBody = await response.text();
			console.error(`ArcGIS error ${response.status}: ${errorBody}`);
			return NextResponse.json(
				{ error: `Geocoding request failed: ${response.statusText}` },
				{ status: response.status },
			);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Geocoding proxy error:", error);
		return NextResponse.json(
			{ error: "Internal server error while contacting geocoding service." },
			{ status: 500 },
		);
	}
}
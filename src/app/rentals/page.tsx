import type { Metadata } from "next";
import RentalsHubPage from "@/components/rentals/RentalsHubPage";
import "@/styles/rentals.css";

export const metadata: Metadata = {
  title: "Instrument Rentals",
  description:
    "Rent keyboards, guitars, PA systems, and pro audio gear by the hour, day, week, or month at Vibe Music.",
};

export default function RentalsRoute() {
  return <RentalsHubPage />;
}

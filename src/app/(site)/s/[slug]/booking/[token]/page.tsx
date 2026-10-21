"use client";
import { useParams } from "next/navigation";
import StoreGate from "@/components/Store/StoreGate";
import BookingConfirmation from "@/components/Store/BookingConfirmation";

export default function StoreBookingPage() {
  const { token } = useParams<{ token: string }>();
  return (
    <StoreGate>
      <BookingConfirmation token={token} />
    </StoreGate>
  );
}

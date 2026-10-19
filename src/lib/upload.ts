import { api } from "@/lib/api";

type Kind = "product" | "category" | "logo";
interface Ticket { method: "PUT"; uploadUrl: string; headers?: Record<string, string>; publicUrl: string; maxBytes: number }

const isDataUrl = (s: string) => s.startsWith("data:");

async function toBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl); // a data URL can be fetched to get its bytes
  return res.blob();
}

/** Uploads one picture (a data URL from the image picker) and returns its public URL. URLs that are already uploaded pass through unchanged. */
export async function uploadImage(dataUrlOrUrl: string, kind: Kind): Promise<string> {
  if (!isDataUrl(dataUrlOrUrl)) return dataUrlOrUrl;
  const blob = await toBlob(dataUrlOrUrl);
  const ticket = await api.post<Ticket>("/business/uploads", { kind, contentType: blob.type, size: blob.size });
  if (blob.size > ticket.maxBytes) throw new Error(`That image is too large (max ${Math.round(ticket.maxBytes / 1024 / 1024)} MB).`);
  let res: Response;
  try {
    res = await fetch(ticket.uploadUrl, { method: ticket.method, headers: ticket.headers ?? { "Content-Type": blob.type }, body: blob });
  } catch {
    throw new Error("We couldn't upload that image. Check your connection and try again.");
  }
  if (!res.ok) throw new Error("We couldn't upload that image. Please try again.");
  return ticket.publicUrl;
}

export const uploadImages = (list: string[], kind: Kind) => Promise.all(list.filter(Boolean).map((u) => uploadImage(u, kind)));

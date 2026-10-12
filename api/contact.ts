import { createHash } from "node:crypto";
import { z, ZodError } from "zod";
import type { ApiRequest, ApiResponse } from "../server/http.js";
import { getSupabaseAdmin } from "../server/supabase.js";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().default(""),
  service: z.string().trim().min(1).max(160),
  budget: z.string().trim().min(1).max(40),
  timeline: z.string().trim().min(1).max(80),
  message: z.string().trim().min(30).max(4000),
  consent: z.literal(true),
  companyWebsite: z.string().max(0).optional().default(""),
});

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ message: "Method not allowed." });
    return;
  }
  try {
    if (
      !String(firstHeader(req.headers["content-type"]) || "").startsWith(
        "application/json",
      )
    ) {
      res.status(415).json({ message: "JSON is required." });
      return;
    }
    if (JSON.stringify(req.body ?? "").length > 20_000) {
      res.status(413).json({ message: "Request is too large." });
      return;
    }
    const origin = firstHeader(req.headers.origin);
    const host = firstHeader(req.headers.host);
    if (origin && host && new URL(origin).host !== host) {
      res.status(403).json({ message: "Origin not allowed." });
      return;
    }
    const body = contactSchema.parse(
      typeof req.body === "string" ? JSON.parse(req.body) : req.body,
    );
    if (body.companyWebsite) {
      res.status(202).json({ ok: true });
      return;
    }
    const forwarded = String(
      firstHeader(req.headers["x-forwarded-for"]) ||
        firstHeader(req.headers["x-real-ip"]) ||
        "unknown",
    )
      .split(",")[0]
      .trim();
    const subject = createHash("sha256").update(forwarded).digest("hex");
    const db = getSupabaseAdmin();
    const { data: accepted, error: quotaError } = await db.rpc(
      "consume_api_rate_limit",
      {
        p_scope: "public-contact",
        p_subject_hash: subject,
        p_max_requests: 6,
      },
    );
    if (quotaError) throw quotaError;
    if (accepted !== true) {
      res
        .status(429)
        .json({ message: "Too many requests. Please wait a minute." });
      return;
    }
    const { error } = await db.from("contacts").insert({
      user_id: null,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      service: body.service,
      budget: body.budget,
      message: `${body.message}\n\nPreferred timeline: ${body.timeline}`,
    });
    if (error) throw error;
    res.status(201).json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      res
        .status(400)
        .json({
          message: "Please review the highlighted details and try again.",
        });
      return;
    }
    console.error(
      "public_contact_failure",
      error instanceof Error ? error.name : "unknown",
    );
    res
      .status(503)
      .json({
        message: "We could not send your brief. Please try WhatsApp or email.",
      });
  }
}

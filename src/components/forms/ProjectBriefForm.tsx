import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  CheckCircle2,
  FileLock2,
  LoaderCircle,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  phone: z.string().trim().max(40).optional(),
  service: z.string().min(1, "Choose a service."),
  budget: z.string().min(1, "Choose a budget range."),
  timeline: z.string().min(1, "Choose a preferred timeline."),
  message: z
    .string()
    .trim()
    .min(30, "Tell us a little more about the outcome you need.")
    .max(4000),
  consent: z
    .boolean()
    .refine(Boolean, "Confirm that we may respond to your enquiry."),
  companyWebsite: z.string().max(0).optional(),
});

type BriefFields = z.infer<typeof schema>;

export function ProjectBriefForm({
  initialService = "",
}: {
  initialService?: string;
}) {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BriefFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      consent: false,
      companyWebsite: "",
      service: initialService,
    },
  });

  async function submit(values: BriefFields) {
    setServerError("");
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    if (!response.ok)
      throw new Error(payload.message || "Unable to send your brief.");
    setSent(true);
  }

  if (sent)
    return (
      <div className="pf-brief-success" role="status">
        <CheckCircle2 aria-hidden="true" />
        <p className="pf-kicker">Brief received</p>
        <h2>Thank you. We’ll review it carefully.</h2>
        <p>
          We’ll reply using the contact details you supplied. Create a client
          workspace when you are ready to add private files and keep future
          project decisions together.
        </p>
        <Link className="pf-button" to="/register">
          Create your workspace <ArrowRight size={17} />
        </Link>
      </div>
    );

  return (
    <form
      className="pf-brief-form"
      onSubmit={handleSubmit(
        async (values) => {
          try {
            await submit(values);
          } catch (error) {
            setServerError(
              error instanceof Error
                ? error.message
                : "Unable to send your brief.",
            );
          }
        },
        () => setServerError(""),
      )}
      noValidate
    >
      <div className="pf-brief-form__heading">
        <p className="pf-kicker">Project brief</p>
        <h2>Tell us what success should look like.</h2>
        <p>
          Share the essentials now. Detailed files and private information
          belong in your secure client workspace.
        </p>
      </div>
      <div className="pf-form-grid">
        <label>
          <span>Name</span>
          <input
            autoComplete="name"
            {...register("name")}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <small>{errors.name.message}</small>}
        </label>
        <label>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            {...register("email")}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <small>{errors.email.message}</small>}
        </label>
        <label>
          <span>
            Phone <em>optional</em>
          </span>
          <input type="tel" autoComplete="tel" {...register("phone")} />
        </label>
        <label>
          <span>What do you need?</span>
          <select
            {...register("service")}
            aria-invalid={Boolean(errors.service)}
            defaultValue=""
          >
            <option value="" disabled>
              Select a service
            </option>
            <option>Website or portfolio</option>
            <option>Business web application</option>
            <option>Mobile application</option>
            <option>Data dashboard or machine learning</option>
            <option>Research or academic support</option>
            <option>Not sure yet</option>
          </select>
          {errors.service && <small>{errors.service.message}</small>}
        </label>
        <label>
          <span>Indicative budget</span>
          <select
            {...register("budget")}
            aria-invalid={Boolean(errors.budget)}
            defaultValue=""
          >
            <option value="" disabled>
              Select a range
            </option>
            <option>Under GHS 5,000</option>
            <option>GHS 5,000–15,000</option>
            <option>GHS 15,000–50,000</option>
            <option>Above GHS 50,000</option>
            <option>Need guidance</option>
          </select>
          {errors.budget && <small>{errors.budget.message}</small>}
        </label>
        <label>
          <span>Preferred timeline</span>
          <select
            {...register("timeline")}
            aria-invalid={Boolean(errors.timeline)}
            defaultValue=""
          >
            <option value="" disabled>
              Select a timeline
            </option>
            <option>As soon as practical</option>
            <option>Within 1–2 months</option>
            <option>Within 3–6 months</option>
            <option>Exploring for later</option>
          </select>
          {errors.timeline && <small>{errors.timeline.message}</small>}
        </label>
      </div>
      <label className="pf-form-message">
        <span>Project outcome and context</span>
        <textarea
          rows={7}
          {...register("message")}
          aria-invalid={Boolean(errors.message)}
          placeholder="What should the finished product help people do? Who will use it, and what matters most?"
        />
        <span className="pf-form-hint">
          Please do not include passwords, payment details or confidential
          records.
        </span>
        {errors.message && <small>{errors.message.message}</small>}
      </label>
      <label className="pf-honeypot" aria-hidden="true">
        Company website
        <input
          tabIndex={-1}
          autoComplete="off"
          {...register("companyWebsite")}
        />
      </label>
      <label className="pf-consent">
        <input type="checkbox" {...register("consent")} />
        <span>
          I agree that AuraFlow may use these details to respond to this
          enquiry.
        </span>
      </label>
      {errors.consent && (
        <small className="pf-form-error">{errors.consent.message}</small>
      )}
      <div className="pf-secure-upload-note">
        <FileLock2 aria-hidden="true" />
        <span>
          Have screenshots, documents or media?{" "}
          <Link to="/register">Create a workspace</Link> to upload them
          securely.
        </span>
      </div>
      {serverError && (
        <p className="pf-form-error" role="alert">
          {serverError}
        </p>
      )}
      <button className="pf-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <LoaderCircle className="pf-spin" aria-hidden="true" />
        ) : null}
        {isSubmitting ? "Sending…" : "Send project brief"}
        {!isSubmitting && <ArrowRight size={17} />}
      </button>
    </form>
  );
}

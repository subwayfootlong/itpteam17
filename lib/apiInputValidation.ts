import { InputValidationError, requireString, requireEnum, requireInteger, requireDate, requireEmail, requireWebUrl } from "./inputValidation";
import { MEMBERSHIP_TIERS } from "./membershipTiers";

type Body = Record<string, unknown>;
export const membershipStatuses = ["active", "inactive", "expired", "pending", "suspended"];
export const publicationStatuses = ["draft", "published", "archived"];

function textFields(body: Body, fields: Record<string, number>, required: readonly string[] = []) {
  for (const [key, max] of Object.entries(fields)) {
    if (!(key in body)) continue;
    if (body[key] === null && !required.includes(key)) continue;
    requireString(body[key], key, max, required.includes(key) ? 1 : 0);
  }
}

function booleans(body: Body, fields: string[]) {
  for (const key of fields) if (key in body && typeof body[key] !== "boolean") {
    throw new InputValidationError(`${key} must be true or false`);
  }
}

function urls(body: Body, fields: string[]) {
  for (const key of fields) if (body[key] != null && body[key] !== "") requireWebUrl(body[key], key);
}

export function validateProfileInput(body: Body) {
  textFields(body, { salutation: 20, first_name: 100, last_name: 100, arabic_name: 200, phone: 40, organization: 200, designation: 200 },
    ["salutation", "first_name", "phone", "organization", "designation"]);
}

export function validateRegistrationInput(body: Body) {
  textFields(body, { salutation: 20, firstName: 100, lastName: 100, arabicName: 200, organization: 200, designation: 200, arsStatus: 20, phone: 40 });
  requireEmail(body.email);
  if (typeof body.password !== "string" || body.password.length < 8 || new TextEncoder().encode(body.password).length > 72) {
    throw new InputValidationError("Password must contain at least 8 characters and at most 72 UTF-8 bytes");
  }
}

export function validateLoginInput(body: Body) {
  requireEmail(body.email);
  if (typeof body.password !== "string" || !body.password || body.password.length > 1024) {
    throw new InputValidationError("Password must be a nonempty string of at most 1024 characters");
  }
}

export function validateMemberInput(body: Body) {
  // Existing member records may have unset optional profile fields.
  textFields(body, { salutation: 20, first_name: 100, last_name: 100, arabic_name: 200, phone: 40,
    organization: 200, designation: 200, member_id: 100, ars_status: 20 }, ["first_name"]);
  if ("email" in body) requireEmail(body.email);
  if ("role" in body) requireEnum(body.role, "Role", ["member", "admin"]);
  if ("membership_tier" in body) requireEnum(body.membership_tier, "Membership tier", MEMBERSHIP_TIERS.map(t => t.value));
  if ("membership_status" in body) requireEnum(body.membership_status, "Membership status", membershipStatuses);
  for (const key of ["expiry_date", "member_since"]) if (body[key] != null && body[key] !== "") requireDate(body[key], key);
}

export function validateEventInput(body: Body) {
  textFields(body, { title: 200, description: 20000, venue: 500, category: 100 }, ["title", "category"]);
  if ("event_date" in body) requireDate(body.event_date, "Event date");
  for (const key of ["start_time", "end_time"]) if (body[key] != null && body[key] !== "" &&
    (typeof body[key] !== "string" || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(body[key] as string))) {
    throw new InputValidationError(`${key} must be a valid time (HH:mm or HH:mm:ss)`);
  }
  if (body.capacity != null) requireInteger(body.capacity, "Capacity");
  if ("status" in body) requireEnum(body.status, "Status", publicationStatuses);
  urls(body, ["external_rsvp_url", "image_url"]);
}

export function validateAnnouncementInput(body: Body) {
  textFields(body, { title: 200, content: 20000, category: 100, poll_question: 500 }, ["title", "content", "category"]);
  booleans(body, ["poll_enabled"]);
  if ("status" in body) requireEnum(body.status, "Status", publicationStatuses);
  urls(body, ["image_url"]);
}

export function validateBenefitInput(body: Body) {
  textFields(body, { merchant_name: 200, category: 100, discount_description: 2000, discount_amount: 100,
    address: 500, description: 20000, logo_initials: 20 }, ["merchant_name", "category", "discount_description"]);
  booleans(body, ["is_active"]);
  urls(body, ["image_url", "logo_url"]);
}

export function validatePaymentInput(body: Body) {
  textFields(body, { name: 200, description: 2000, payment_url: 2048 }, ["name", "payment_url"]);
  booleans(body, ["is_active"]);
  urls(body, ["qr_code_url"]);
  // payment_url retains the existing normalizer's support for addresses without a scheme.
}

export function validateAnalyticsInput(body: Body) {
  requireEnum(body.eventType, "Event type", ["event_view", "event_rsvp_click", "benefit_view", "announcement_view", "login"]);
  requireEnum(body.category, "Category", ["event", "benefit", "announcement", "system"]);
  if (body.targetId != null) requireString(body.targetId, "Target ID", 200, 0);
  if (body.metadata !== undefined && (!body.metadata || typeof body.metadata !== "object" || Array.isArray(body.metadata) || JSON.stringify(body.metadata).length > 4096)) {
    throw new InputValidationError("Metadata must be an object of at most 4096 characters");
  }
}

export function validateMemberFilters(search: string, tier: string, status: string) {
  requireString(search, "Search", 100, 0);
  // These delimiters have syntax meaning in the existing PostgREST OR filter.
  if (/[,()"\\]/.test(search)) throw new InputValidationError("Search contains unsupported filter characters");
  if (tier) requireEnum(tier, "Tier", MEMBERSHIP_TIERS.map(t => t.value));
  if (status) requireEnum(status, "Status", membershipStatuses);
}

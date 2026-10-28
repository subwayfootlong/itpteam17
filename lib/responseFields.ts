// Client contracts: keep database projections and JSON allowlists together.
export const EVENT_DETAIL_FIELDS = 'id, title, description, event_date, start_time, end_time, venue, category, capacity, spots_available, external_rsvp_url, image_url, status, audience_type, eligible_tiers, show_locked_preview';
export const ANNOUNCEMENT_DETAIL_FIELDS = 'id, title, content, category, image_url, status, poll_enabled, poll_question, audience_type, eligible_tiers, show_locked_preview';
export const MEMBER_DIRECTORY_FIELDS = 'id, first_name, last_name, salutation, email, member_id, membership_tier, membership_status, expiry_date, phone, organization, designation, ars_status, member_since, created_at';
export const MEMBER_DETAIL_FIELDS = 'id, salutation, first_name, last_name, email, phone, organization, designation, arabic_name, ars_status, member_id, membership_tier, membership_status, expiry_date, member_since, role, created_at';

// Flat fields only. Nested relations must be mapped explicitly at their boundary.
export function responseFields(row: Record<string, unknown>, columns: string) {
  return Object.fromEntries(columns.split(',').map((column) => {
    const key = column.trim();
    return [key, row[key]];
  }));
}

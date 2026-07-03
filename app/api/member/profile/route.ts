import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { getErrorMessage } from "@/lib/errors";
import { isValidSalutation } from "@/lib/memberProfileOptions";
import {
  formatStoredPhone,
  getPhoneValidationMessage,
  isAcceptablePhoneNumber,
} from "@/lib/phone";
import { supabaseAdmin } from "@/lib/supabaseServer";

type ProfileUpdatePayload = {
  salutation?: string;
  first_name?: string;
  last_name?: string;
  arabic_name?: string;
  phone?: string;
  organization?: string;
  designation?: string;
};

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in first" }, { status: 401 });
    }

    const body = (await req.json()) as ProfileUpdatePayload;
    const salutation = body.salutation?.trim() ?? "";
    const firstName = body.first_name?.trim() ?? "";
    const lastName = body.last_name?.trim() ?? "";
    const arabicName = body.arabic_name?.trim() ?? "";
    const organization = body.organization?.trim() ?? "";
    const designation = body.designation?.trim() ?? "";
    const phoneInput = body.phone?.trim() ?? "";

    if (!salutation) {
      return NextResponse.json({ error: "Please select a salutation" }, { status: 400 });
    }

    if (!isValidSalutation(salutation)) {
      return NextResponse.json({ error: "Invalid salutation" }, { status: 400 });
    }

    if (!firstName) {
      return NextResponse.json({ error: "First name is required" }, { status: 400 });
    }

    if (!organization) {
      return NextResponse.json({ error: "Organization is required" }, { status: 400 });
    }

    if (!designation) {
      return NextResponse.json({ error: "Designation is required" }, { status: 400 });
    }

    if (!phoneInput) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    if (!isAcceptablePhoneNumber(phoneInput)) {
      return NextResponse.json(
        { error: getPhoneValidationMessage(phoneInput) },
        { status: 400 },
      );
    }

    const phone = formatStoredPhone(phoneInput);
    if (!phone) {
      return NextResponse.json(
        { error: getPhoneValidationMessage(phoneInput) },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        salutation,
        first_name: firstName,
        last_name: lastName || null,
        arabic_name: arabicName || null,
        phone,
        organization,
        designation,
      })
      .eq("id", user.id)
      .select(
        "id, first_name, last_name, salutation, email, role, member_id, membership_tier, membership_status, expiry_date, phone, organization, designation, arabic_name, member_since",
      )
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ member: data });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(err, "Unable to update profile") },
      { status: 500 },
    );
  }
}

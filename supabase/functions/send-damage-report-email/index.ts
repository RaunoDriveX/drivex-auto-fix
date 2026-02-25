import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    const timestamp = payload.timestamp || new Date().toISOString();
    const licensePlate = payload.licensePlate || "UNKNOWN";

    // Build CSV rows: Field,Value
    const csvRows: [string, string][] = [
      ["Glass Location", payload.glassLocation || ""],
      ["Damage Type", payload.damageType || ""],
      ["Vehicle Type", payload.vehicleType || ""],
      ["License Plate", licensePlate],
      ["Insured Name", payload.insuredName || ""],
      ["Insurance Company", payload.selectedInsurer || ""],
      ["Street", payload.customerStreet || ""],
      ["City", payload.customerCity || ""],
      ["Postal Code", payload.customerPostalCode || ""],
      ["Contact Method", payload.contactMethod || ""],
      ["Contact Value", payload.contactValue || ""],
      ["DIN Partner Name/ID", payload.dinPartner || ""],
      ["Tracking Token", payload.token || ""],
      ["Appointment ID", payload.appointmentId || ""],
      ["Timestamp", timestamp],
    ];

    const csvContent = "Field,Value\n" +
      csvRows
        .map(([field, value]) => `"${field}","${String(value).replace(/"/g, '""')}"`)
        .join("\n");

    // Base64 encode the CSV for Resend attachment
    const csvBase64 = btoa(unescape(encodeURIComponent(csvContent)));

    const subject = `DIN_Repair_Request_Form - ${licensePlate} - ${timestamp}`;

    const { error } = await resend.emails.send({
      from: "Glassify <noreply@resend.dev>",
      to: ["rauno.sigur@drivex.io"],
      subject,
      html: `<p>New damage report submitted.</p><p>License Plate: ${licensePlate}</p><p>See attached CSV for full details.</p>`,
      attachments: [
        {
          filename: `DIN_Repair_Request_${licensePlate}_${timestamp.replace(/[:.]/g, "-")}.csv`,
          content: csvBase64,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-damage-report-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

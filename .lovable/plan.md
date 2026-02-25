
## Implement Damage Report Email with CSV Attachment

When the user clicks "Confirm & Send" on the damage report thank-you page, the system will automatically send an email with a CSV attachment containing all form data.

### What will happen
- After clicking "Confirm & Send", an email is sent in the background (no UI change)
- **Recipient:** `joseph.soomer@drivex.io` (test; will switch to `operations@glassify24.com` for production)
- **Subject:** `DIN_Repair_Request_Form - [License Plate] - [Timestamp]`
- **Attachment:** CSV file with all data from both forms
- The email sending will not block the user flow

### CSV data included
- Glass location, damage type, vehicle type
- License plate, insured name, insurance company
- Street, city, postal code
- Contact method, contact value
- DIN Partner Name/ID
- Tracking token, appointment ID, timestamp

---

### Technical Details

**1. New Edge Function: `supabase/functions/send-damage-report-email/index.ts`**
- Accepts JSON payload with all form data
- Builds a CSV string in-memory (two columns: Field, Value)
- Sends via Resend API with CSV as base64-encoded attachment
- To: `joseph.soomer@drivex.io`
- From: `Glassify <noreply@resend.dev>`
- Subject: `DIN_Repair_Request_Form - [license_plate] - [ISO timestamp]`
- Uses existing `RESEND_API_KEY` secret

**2. Update `supabase/config.toml`**
- Add `[functions.send-damage-report-email]` with `verify_jwt = false`

**3. Update `src/pages/DamageReport.tsx`**
- In `handleContactSubmit`, after the successful appointment update and before `navigate()`, fire-and-forget call to the new edge function with all collected state data (glassLocation, damageType, vehicleType, licensePlate, insuredName, selectedInsurer, customerStreet, customerCity, customerPostalCode, contactMethod, contactValue, dinPartner, token, appointmentId, timestamp)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Zod schema for input validation
const CreateInsurerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  insurerName: z.string().trim().min(1).max(200),
  fullName: z.string().trim().min(1).max(100)
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse and validate request body
    const requestBody = await req.json()
    const validationResult = CreateInsurerSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          details: validationResult.error.errors
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    const { email, password, insurerName, fullName } = validationResult.data;

    console.log(`Creating test insurer user: ${email} for ${insurerName}`)

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      throw new Error(`Failed to create auth user: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('No user data returned from auth creation')
    }

    // Get the insurer profile
    const { data: insurerProfile, error: profileError } = await supabaseAdmin
      .from('insurer_profiles')
      .select('id')
      .eq('insurer_name', insurerName)
      .single()

    if (profileError || !insurerProfile) {
      // Clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Insurer profile not found: ${insurerName}`)
    }

    // Create the insurer user record
    const { error: userError } = await supabaseAdmin
      .from('insurer_users')
      .insert({
        insurer_id: insurerProfile.id,
        user_id: authData.user.id,
        email: email,
        full_name: fullName,
        role: 'admin', // Make them admin so they can test user management
        created_by: authData.user.id
      })

    if (userError) {
      console.error('Insurer user creation error:', userError)
      // Clean up the auth user if insurer user creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Failed to create insurer user: ${userError.message}`)
    }

    console.log(`Successfully created test insurer user: ${email}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test insurer user created successfully for ${insurerName}`,
        user_id: authData.user.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error creating test insurer:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
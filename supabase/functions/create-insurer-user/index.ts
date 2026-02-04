import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CreateInsurerUserSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email must be less than 255 characters'),
  full_name: z.string().trim().min(1, 'Full name is required').max(100, 'Full name must be less than 100 characters'),
  role: z.enum(['admin', 'claims_user'], { errorMap: () => ({ message: 'Role must be admin or claims_user' }) }),
  insurer_id: z.string().uuid('Invalid insurer ID'),
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the caller is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the caller is an admin using the is_insurer_admin function
    const { data: isAdmin, error: adminCheckError } = await supabaseClient.rpc('is_insurer_admin', {
      _user_id: user.id,
    });

    if (adminCheckError) {
      console.error('Admin check error:', adminCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin privileges' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      console.error('User is not an admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only admins can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = CreateInsurerUserSchema.parse(body);

    console.log('Creating user:', { email: validatedData.email, role: validatedData.role });

    // Verify that the insurer_id belongs to the caller's organization
    const { data: callerInsurer, error: insurerCheckError } = await supabaseClient
      .from('insurer_users')
      .select('insurer_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (insurerCheckError || !callerInsurer) {
      console.error('Insurer check error:', insurerCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify insurer organization' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerInsurer.insurer_id !== validatedData.insurer_id) {
      console.error('Insurer ID mismatch:', { caller: callerInsurer.insurer_id, requested: validatedData.insurer_id });
      return new Response(
        JSON.stringify({ error: 'Forbidden: Can only create users in your own organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a cryptographically secure random password
    const password = crypto.randomUUID();

    // Create the auth user using admin API
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: password,
      email_confirm: true,
    });

    if (createUserError || !authData.user) {
      console.error('Error creating auth user:', createUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user account', details: createUserError?.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auth user created:', authData.user.id);

    // Insert into insurer_users table
    const { data: insurerUser, error: insertError } = await supabaseAdmin
      .from('insurer_users')
      .insert({
        insurer_id: validatedData.insurer_id,
        user_id: authData.user.id,
        email: validatedData.email,
        full_name: validatedData.full_name,
        role: validatedData.role,
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting insurer_user:', insertError);
      
      // Clean up the auth user if insurer_users insert failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create insurer user record', details: insertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Insurer user created successfully:', insurerUser.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User created successfully',
        user: {
          id: insurerUser.id,
          email: insurerUser.email,
          full_name: insurerUser.full_name,
          role: insurerUser.role,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

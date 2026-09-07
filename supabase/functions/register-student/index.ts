import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // 1. Caller Authorization Verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED: Missing authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user: callerUser }, error: callerAuthError } = await callerClient.auth.getUser(token);
    if (callerAuthError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED: Invalid caller session token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Query Caller Profile & Role Gate
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role, status')
      .eq('id', callerUser.id)
      .single();

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED: Caller profile not found.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerProfile.role !== 'ADMIN' && callerProfile.role !== 'TEACHER') {
      return new Response(
        JSON.stringify({ error: 'FORBIDDEN: Only administrators and teachers can register students.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerProfile.status !== 'ACTIVE') {
      return new Response(
        JSON.stringify({ error: 'FORBIDDEN: Staff account is not active.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Read and Validate Request Payload
    const body = await req.json();
    const {
      email,
      password,
      fullName,
      fatherName,
      cnic,
      phone,
      targetForceId,
      targetCourseId,
      batchId,
      rollNumber,
      education,
      educationDetails,
      gender = 'Male',
      dateOfBirth,
      alternatePhone,
      address,
      guardianName,
      guardianRelationship = 'Father',
      guardianPhone,
      admissionDate,
      status = 'ACTIVE',
      notes,
      photoUrl,
    } = body;

    // Field validations
    if (!email || !email.trim()) throw new Error('VALIDATION_ERROR: Email is required.');
    if (!password || password.length < 4) throw new Error('VALIDATION_ERROR: Password must be at least 4 characters.');
    if (!fullName || !fullName.trim()) throw new Error('VALIDATION_ERROR: Full name is required.');
    if (!fatherName || !fatherName.trim()) throw new Error('VALIDATION_ERROR: Father name is required.');
    if (!cnic || !cnic.trim()) throw new Error('VALIDATION_ERROR: CNIC is required.');
    if (!phone || !phone.trim()) throw new Error('VALIDATION_ERROR: Phone number is required.');
    if (!targetForceId) throw new Error('VALIDATION_ERROR: Target force is required.');
    if (!targetCourseId) throw new Error('VALIDATION_ERROR: Target course is required.');
    if (!batchId) throw new Error('VALIDATION_ERROR: Batch enrollment is mandatory.');
    if (!rollNumber || !rollNumber.trim()) throw new Error('VALIDATION_ERROR: Roll number is required.');
    if (!education || !education.trim()) throw new Error('VALIDATION_ERROR: Education qualification is mandatory.');
    if (education === 'Other' && (!educationDetails || !educationDetails.trim())) {
      throw new Error('VALIDATION_ERROR: Education details are required when Other is selected.');
    }

    // 4. Create Auth User via Admin API with FORCED role = 'STUDENT'
    const { data: newAuthData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        role: 'STUDENT', // HARDENED: Server-authoritative STUDENT role only
        display_name: fullName.trim(),
        phone: phone.trim(),
        avatar_url: photoUrl || null,
      },
    });

    if (createAuthError || !newAuthData?.user) {
      return new Response(
        JSON.stringify({ error: createAuthError?.message || 'Failed to create authentication user.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const createdUserId = newAuthData.user.id;

    // 5. Create Profile, Student, Batch Enrollment & Audit Log via DB RPC
    const { data: rpcResult, error: rpcError } = await adminClient.rpc(
      'create_registered_student_profile',
      {
        p_auth_user_id: createdUserId,
        p_email: email.trim().toLowerCase(),
        p_display_name: fullName.trim(),
        p_father_name: fatherName.trim(),
        p_cnic: cnic.trim(),
        p_phone: phone.trim(),
        p_target_force_id: targetForceId,
        p_target_course_id: targetCourseId,
        p_batch_id: batchId,
        p_roll_number: rollNumber.trim().toUpperCase(),
        p_education: education.trim(),
        p_education_details: educationDetails?.trim() || null,
        p_gender: gender || 'Male',
        p_date_of_birth: dateOfBirth || null,
        p_alternate_phone: alternatePhone?.trim() || null,
        p_address: address?.trim() || null,
        p_guardian_name: guardianName?.trim() || null,
        p_guardian_relationship: guardianRelationship || 'Father',
        p_guardian_phone: guardianPhone?.trim() || null,
        p_admission_date: admissionDate || new Date().toISOString().split('T')[0],
        p_status: status || 'ACTIVE',
        p_notes: notes?.trim() || null,
        p_photo_url: photoUrl || null,
        p_creator_id: callerUser.id,
      }
    );

    // 6. Error Compensation: Rollback newly created Auth user on DB failure
    if (rpcError) {
      console.error('DB registration failed, rolling back auth user:', createdUserId, rpcError);
      try {
        await adminClient.auth.admin.deleteUser(createdUserId);
      } catch (delErr) {
        console.error('Failed to cleanup orphan auth user:', delErr);
      }
      return new Response(
        JSON.stringify({ error: rpcError.message || 'Database registration failed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Successful Response
    return new Response(
      JSON.stringify(rpcResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Edge Function unhandled exception:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error during registration.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

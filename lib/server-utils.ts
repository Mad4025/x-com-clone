import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { User as SupabaseUser } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseApiClient = createSupabaseJsClient(supabaseUrl, supabaseAnonKey);

export async function getAuthenticatedUser(req: NextRequest): Promise<{ user: SupabaseUser | null, errorResponse: NextResponse | null }> {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { user: null, errorResponse: NextResponse.json({ error: `Unauthorized: No invalid Bearer token provided` }, { status: 401 }) };
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseApiClient.auth.getUser(token);

    if (error || !user) {
        console.error('Auth error in API getAuthenticatedUser:', error?.message);
        return { user: null, errorResponse: NextResponse.json({ error: `Unauthorized: Invalid token. ${error?.message}` }, { status: 401 }) };
    }
    return { user, errorResponse: null };
}
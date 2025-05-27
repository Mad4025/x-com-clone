"use server"

import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/utils";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";


export const loginAction = async (email: string, password: string) => {
    try {
        const supabase = await createSupabaseServerClient();

        const{error} = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw error;

        return { errorMessage: null };

    } catch (error) {
        return handleError(error);
    }
}

export const signUpAction = async (email: string, password: string) => {
    try {
        const supabase = await createSupabaseServerClient();

        const{ data, error } = await supabase.auth.signUp({
            email,
            password
        })
        if (error) throw error;

        const userId = data.user?.id;
        if (!userId) throw new Error("Error signing up");

        await prisma.user.create({
            data: {
                id: userId,
                email
            }
        })

        return { errorMessage: null };

    } catch (error) {
        return handleError(error);
    }
}

export const logOutAction = async () => {
    try {
        const supabase = await createSupabaseServerClient();

        const{ error } = await supabase.auth.signOut();
        if (error) throw error;

        return { errorMessage: null };

    } catch (error) {
        return handleError(error);
    }
}
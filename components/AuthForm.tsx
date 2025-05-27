'use client'

import { useRouter } from "next/navigation";
import { CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useTransition } from "react";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { loginAction, signUpAction } from "@/actions/users";

type Props = {
    type: "login" | "signup";
}

function AuthForm({ type }: Props) {
    const isLoginForm = type === "login";

    const router = useRouter();

    const [isPending, startTransition] = useTransition();

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;

            let errorMessage;
            let description;

            if (isLoginForm) {
                errorMessage = (await loginAction(email, password)).errorMessage;
                description = "Logged in successfully!";
            } else {
                errorMessage = (await signUpAction(email, password)).errorMessage;
                description = "Signed up successfully!";
            }

            if (!errorMessage) {
                toast(description);
                router.replace("/");
            } else {
                toast(errorMessage);
            }
        })
    }

  return (
    <form action={handleSubmit}>
        <CardContent className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input 
                id="email"
                name="email"
                placeholder="Enter your email"
                type="email"
                required
                disabled={isPending}
                />
            </div>
            <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input 
                id="password"
                name="password"
                placeholder="Enter your password"
                type="password"
                required
                disabled={isPending}
                />
            </div>
        </CardContent>
        <CardFooter className="mt-4 flex flex-col gap-6">
            <Button className="w-full">
                { isPending ? <Loader2 className="animate-spin" /> : isLoginForm ? "Log In" : "Sign Up" }
            </Button>
            <p className="text-xs">
                {isLoginForm ? "Don't have an account yet?" : "Already have an account?"}{" "}
                <Link href={isLoginForm ? "/sign-up" : "/login"} className={`text-blue-600 underline ${isPending ? "pointer-events-none" : "opacity-90"}`}>
                {isLoginForm ? "Sign Up" : "Log In"}
                </Link>
            </p>
        </CardFooter>
    </form>
  );
}

export default AuthForm;
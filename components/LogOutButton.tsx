"use client"

import { Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import { useState } from "react"
import { toast } from "sonner";
import { logOutAction } from "@/actions/users";

function LogOutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogOut = async () => {
    setLoading(true);

    const { errorMessage } = await logOutAction();

    if (!errorMessage) {
        toast("You have been successfully logged out!");
    } else {
        toast(`Error: ${errorMessage}`)
    }

    setLoading(false);
  }

  return (
    <Button
    disabled={loading}
    onClick={handleLogOut}
    variant="outline"
    className="w-24"
    >{loading ? <Loader2 className="animate-spin" /> : "Log out"}</Button>
  )
}

export default LogOutButton
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function CarDetailActions({ carId }: { carId: string }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    setDeleting(true);

    try {
      const response = await fetch(`/api/cars/${carId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      const errorMessage = payload?.error?.message;

      if (!response.ok) {
        throw new Error(errorMessage || "Failed to delete car.");
      }

      setDialogOpen(false);
      toast.success("Car deleted.");
      router.push("/cars");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete car. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
      <Button asChild variant="outline" size="sm" className="h-10 flex-1 sm:flex-none">
        <Link href={`/cars/${carId}/edit`}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>
      </Button>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-none"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this car?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the car record. Once entries, maintenance,
              and todos are fully real, linked records for this car will also be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Car"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

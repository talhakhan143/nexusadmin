"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Edit, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CustomerForm } from "@/components/modules/customer-form";
import { deleteAddress } from "@/server/actions/customers";

interface CustomerEditProps {
  customer: {
    id: string;
    email: string;
    name: string;
    phone: string;
    acceptsMarketing: boolean;
    notes: string;
  };
}

export function CustomerEditButton({ customer }: CustomerEditProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Edit className="mr-2 h-4 w-4" /> Edit
      </Button>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit customer</DialogTitle>
          <DialogDescription>Update profile, marketing preferences and notes.</DialogDescription>
        </DialogHeader>
        <CustomerForm mode="edit" customerId={customer.id} initial={customer} />
      </DialogContent>
    </Dialog>
  );
}

export function AddressDeleteButton({ addressId }: { addressId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function confirm() {
    setPending(true);
    const res = await deleteAddress(addressId);
    setPending(false);
    setOpen(false);
    if (!res.ok) toast.error(res.error);
    else {
      toast.success("Address removed");
      router.refresh();
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove address?</AlertDialogTitle>
          <AlertDialogDescription>
            The address will be deleted. Past orders that referenced it keep their snapshot.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

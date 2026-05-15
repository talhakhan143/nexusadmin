"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Loader2, Power, Shield } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { teamUserSchema, type TeamUserInput } from "@/lib/validations/settings";
import { createTeamUser, updateUserRole, toggleUserActive } from "@/server/actions/settings";
import { formatDate } from "@/lib/utils";

interface TeamUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

const ROLE_VARIANT: Record<UserRole, "default" | "secondary" | "warning" | "destructive"> = {
  SUPER_ADMIN: "destructive",
  ADMIN: "warning",
  MANAGER: "default",
  VIEWER: "secondary",
};

export function TeamPanel({ users, currentUserId }: { users: TeamUser[]; currentUserId: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team members</CardTitle>
          <CardDescription>{users.length} user(s). Roles control what data and actions are accessible.</CardDescription>
        </div>
        <InviteDialog />
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {users.map((u) => (
            <UserRow key={u.id} user={u} isMe={u.id === currentUserId} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function UserRow({ user, isMe }: { user: TeamUser; isMe: boolean }) {
  const router = useRouter();
  const [working, setWorking] = React.useState(false);
  const initials = (user.name ?? user.email)
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function changeRole(role: UserRole) {
    if (role === user.role) return;
    setWorking(true);
    const res = await updateUserRole(user.id, role);
    setWorking(false);
    if (!res.ok) toast.error(res.error);
    else {
      toast.success("Role updated");
      router.refresh();
    }
  }

  async function toggleActive() {
    setWorking(true);
    const res = await toggleUserActive(user.id);
    setWorking(false);
    if (!res.ok) toast.error(res.error);
    else {
      toast.success(res.data?.isActive ? "Activated" : "Deactivated");
      router.refresh();
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted/30">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-9 w-9">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium">{user.name ?? user.email}</p>
            {isMe && <Badge variant="outline" className="text-[10px]">You</Badge>}
            {!user.isActive && <Badge variant="secondary">Inactive</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            {user.email} · last login {user.lastLoginAt ? formatDate(user.lastLoginAt) : "never"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Select value={user.role} onValueChange={(v) => changeRole(v as UserRole)} disabled={isMe || working}>
          <SelectTrigger className="h-8 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SUPER_ADMIN">Super admin</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="VIEWER">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant={ROLE_VARIANT[user.role]} className="hidden sm:inline-flex">
          <Shield className="mr-1 h-3 w-3" />
          {user.role.replace("_", " ")}
        </Badge>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleActive} disabled={isMe || working}>
          {working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </li>
  );
}

function InviteDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [created, setCreated] = React.useState<{ email: string; password: string } | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TeamUserInput>({
    resolver: zodResolver(teamUserSchema),
    defaultValues: { email: "", name: "", role: "VIEWER", password: "" },
  });

  async function onSubmit(data: TeamUserInput) {
    setSubmitting(true);
    const generated = data.password || crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const res = await createTeamUser({ ...data, password: generated });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("User created");
    setCreated({ email: data.email, password: generated });
    router.refresh();
  }

  function close() {
    setOpen(false);
    setCreated(null);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Add member
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{created ? "User created" : "Add team member"}</DialogTitle>
          <DialogDescription>
            {created
              ? "Share these credentials with the new user. The password is only shown now."
              : "Creates a user with the chosen role. Auto-generates a temporary password if blank."}
          </DialogDescription>
        </DialogHeader>
        {created ? (
          <div className="space-y-3 text-sm">
            <div className="rounded-md border p-3 font-mono">
              <p>email: {created.email}</p>
              <p>password: {created.password}</p>
            </div>
            <p className="text-xs text-muted-foreground">User can change their password after first login.</p>
            <DialogFooter>
              <Button onClick={close}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="iname">Name</Label>
                <Input id="iname" {...register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="iemail">Email *</Label>
                <Input id="iemail" type="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select defaultValue="VIEWER" onValueChange={(v) => setValue("role", v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ipwd">Temporary password (leave blank to auto-generate)</Label>
              <Input id="ipwd" type="text" {...register("password")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

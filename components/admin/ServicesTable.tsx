"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Service } from "@/types";

export default function ServicesTable({ services }: { services: Service[] }) {
  const router = useRouter();
  const [toggling, setToggling] = useState<string | null>(null);

  async function toggleActive(service: Service) {
    setToggling(service.id);
    const res = await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: service.id, is_active: !service.is_active }),
    });
    if (res.ok) {
      toast.success(`${service.name} ${service.is_active ? "deactivated" : "activated"}.`);
      router.refresh();
    } else {
      toast.error("Failed to update service.");
    }
    setToggling(null);
  }

  if (services.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
        No services added yet. Click &quot;Add Service&quot; to get started.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <p className="font-medium">{s.name}</p>
                {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
              </TableCell>
              <TableCell>{s.duration_minutes} min</TableCell>
              <TableCell>₱{Number(s.price).toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant={s.is_active ? "default" : "secondary"}>
                  {s.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleActive(s)}
                  disabled={toggling === s.id}
                >
                  {toggling === s.id ? "..." : s.is_active ? "Deactivate" : "Activate"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { getCars } from "@/lib/db/api";
import type { Car } from "@/lib/db/schema";
import { CarCard } from "@/components/car-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function CarsListView() {
  const [cars, setCars] = React.useState<Car[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getCars().then((c) => {
      setCars(c);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            My Cars
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your vehicles and track their costs.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/cars/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Car
          </Link>
        </Button>
      </div>

      {cars.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <p className="text-sm text-muted-foreground">
            No cars added yet. Start by adding your first vehicle.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/cars/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Car
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      )}
    </div>
  );
}

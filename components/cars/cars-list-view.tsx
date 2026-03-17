import Link from "next/link";
import type { Car } from "@/lib/db/schema";
import { CarCard } from "@/components/car-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function CarsListView({ initialCars }: { initialCars: Car[] }) {
  const cars = initialCars;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-6 lg:py-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 md:mb-7 md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            My Cars
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your vehicles and track their costs.
          </p>
        </div>
        <Button asChild size="sm" className="h-10 w-full sm:w-auto">
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

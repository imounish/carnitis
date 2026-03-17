import type { Car } from "@/lib/db/schema";
import { CarForm } from "@/components/cars/car-form";
import {
  getCarFormValues,
  getEditableCarInputFromCar,
} from "@/lib/db/car-form";

export function EditCarForm({ car }: { car: Car }) {
  return (
    <CarForm
      mode="edit"
      carId={car.id}
      initialValues={getCarFormValues(car)}
      initialInput={getEditableCarInputFromCar(car)}
    />
  );
}

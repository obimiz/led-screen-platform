import { Schema, model, models, type Model } from "mongoose";
type Counter = { _id: string; value: number };
export const SalesCounter =
  (models.SalesCounter as Model<Counter> | undefined) ??
  model<Counter>(
    "SalesCounter",
    new Schema<Counter>({ _id: String, value: { type: Number, default: 0 } }),
  );

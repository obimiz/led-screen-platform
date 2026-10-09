import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db/connection";
import { Admin } from "../src/models/admin";
import { Product } from "../src/models/product";
import { ProductCategory } from "../src/models/product-category";
import { productSchema } from "../src/lib/validations/product";
import { createSlug } from "../src/lib/utils/slug";

// Supplied catalogue copy, used only to populate the existing MongoDB models.
// The website continues to read products from MongoDB, never from this script.
const catalogue = [
  {
    name: "Indoor LED Display",
    image: "indoor-led-screen.png",
    environment: "indoor",
    summary:
      "High-resolution LED display for churches, auditoriums, conference halls, offices and shopping spaces, designed for clear viewing in indoor installations.",
    description:
      "High-resolution LED display designed for churches, auditoriums, conference halls, offices, shopping spaces and other indoor installations.",
    applications: [
      "Churches",
      "Auditoriums",
      "Conference rooms",
      "Control rooms",
      "Commercial spaces",
    ],
  },
  {
    name: "Outdoor LED Display",
    image: "outdoor-led-screen.png",
    environment: "outdoor",
    summary:
      "Bright and durable LED display for outdoor advertising, public information, building displays and permanent exterior installations at commercial premises.",
    description:
      "Bright and durable LED display solution designed for outdoor viewing, advertising, public information and permanent exterior installations.",
    applications: [
      "Outdoor advertising",
      "Building displays",
      "Public spaces",
      "Event centres",
      "Commercial premises",
    ],
  },
  {
    name: "Rental LED Screen",
    image: "rental-led-screen.png",
    environment: "not-specified",
    summary:
      "Modular LED display system for temporary installations at concerts, conferences, weddings, exhibitions and corporate programmes, supporting flexible event and stage setups.",
    description:
      "Modular LED display system designed for temporary installations, events, concerts, conferences, weddings and corporate programmes.",
    applications: [
      "Events",
      "Concerts",
      "Conferences",
      "Weddings",
      "Exhibitions",
      "Stage productions",
    ],
  },
  {
    name: "Church & Auditorium LED Screen",
    image: "church-led-screen.png",
    environment: "indoor",
    summary:
      "Professional LED display for worship centres and auditoriums, providing clear visibility for live video, presentations, lyrics, announcements and programme content.",
    description:
      "Professional LED display solution for worship centres and auditoriums, providing clear visibility for live video, presentations, lyrics, announcements and programme content.",
    applications: ["Churches", "Worship centres", "Auditoriums", "Large halls"],
  },
  {
    name: "Advertising LED Billboard",
    image: "advertising-led-billboard.png",
    environment: "outdoor",
    summary:
      "Large-format LED advertising display for high-visibility digital campaigns, promotions and public information in roadside, shopping and commercial environments.",
    description:
      "Large-format LED advertising display designed for high-visibility digital campaigns, promotions and public information.",
    applications: [
      "Roadside advertising",
      "Shopping areas",
      "Commercial properties",
      "Outdoor campaigns",
    ],
  },
  {
    name: "Event & Stage LED Screen",
    image: "event-stage-led-screen.png",
    environment: "not-specified",
    summary:
      "High-impact LED video wall for stage productions, concerts, corporate events and entertainment environments, supporting visual content for conferences and special events.",
    description:
      "High-impact LED video wall for stage productions, concerts, corporate events and entertainment environments.",
    applications: [
      "Stages",
      "Concerts",
      "Entertainment venues",
      "Conferences",
      "Special events",
    ],
  },
];

async function main() {
  loadEnvConfig(process.cwd());
  await connectToDatabase();
  const owner = await Admin.findOne({ role: "owner", isActive: true })
    .sort({ createdAt: 1 })
    .select("_id");
  assert.ok(
    owner,
    "An existing active owner is required for product audit fields",
  );
  // Check every mapping before writes; never guess which existing product to update.
  for (const item of catalogue) {
    const slug = createSlug(item.name);
    const matches = await Product.find({
      $or: [{ slug }, { productType: "led-screen", name: item.name }],
    }).lean();
    assert.ok(
      matches.length <= 1 &&
        matches.every((p) => p.productType === "led-screen"),
      `Ambiguous product: ${item.name}`,
    );
  }
  let inserted = 0;
  for (const [sortOrder, item] of catalogue.entries()) {
    const slug = createSlug(item.name);
    const category = await ProductCategory.findOneAndUpdate(
      { productType: "led-screen", slug },
      {
        $setOnInsert: {
          name: item.name,
          description: item.description,
          active: true,
          sortOrder,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
        timestamps: false,
      },
    );
    assert.ok(category);
    let imageUrl = "";
    try {
      await access(`public/images/products/led-screens/${item.image}`);
      imageUrl = `/images/products/led-screens/${item.image}`;
    } catch {
      /* Keep the neutral fallback until the real asset is supplied. */
    }
    const values = productSchema.parse({
      name: item.name,
      category: String(category._id),
      shortDescription: item.summary,
      description: item.description,
      usageApplications: item.applications,
      indoorOutdoor: item.environment,
      featuredImageUrl: imageUrl,
      imageFit: "cover",
      price: null,
      currency: "NGN",
      priceType: "contact",
      stockStatus: "made-to-order",
      featured: true,
      status: "published",
    });
    const result = await Product.updateOne(
      { productType: "led-screen", $or: [{ slug }, { name: item.name }] },
      {
        $setOnInsert: {
          ...values,
          productType: "led-screen",
          slug,
          createdBy: owner._id,
          updatedBy: owner._id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true, runValidators: true, timestamps: false },
    );
    inserted += result.upsertedCount;
  }
  const records = await Product.find({
    productType: "led-screen",
    name: { $in: catalogue.map((p) => p.name) },
  }).lean();
  console.log(
    JSON.stringify(
      {
        inserted,
        records: records.map((p) => ({
          name: p.name,
          slug: p.slug,
          image: p.featuredImageUrl,
          price: p.price,
          priceType: p.priceType,
          status: p.status,
          featured: p.featured,
        })),
      },
      null,
      2,
    ),
  );
}
main()
  .catch((error) => {
    console.error(
      error instanceof assert.AssertionError
        ? error.message
        : "LED catalogue setup failed; inspect configuration and retry.",
    );
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());

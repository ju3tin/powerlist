import { connectDB } from "@/lib/mongodb";
import { TicketConfigModel } from "@/models/TicketConfig";
import { defaultTicketConfig, type TicketConfig } from "@/lib/ticketTypes";

function isValidConfig(raw: unknown): raw is TicketConfig {
  return (
    !!raw &&
    typeof raw === "object" &&
    Array.isArray((raw as TicketConfig).layers) &&
    (raw as TicketConfig).layers.length > 0 &&
    !!(raw as TicketConfig).background
  );
}

export async function getTicketConfig(): Promise<TicketConfig> {
  try {
    await connectDB();
    const doc = await TicketConfigModel.findOne({ key: "default" }).lean();

    if (isValidConfig(doc?.config)) {
      return {
        ...defaultTicketConfig,
        ...doc.config,
        background: doc.config.background ?? defaultTicketConfig.background,
        layers: doc.config.layers,
      };
    }

    console.warn("[getTicketConfig] No valid config in DB — using defaults");
    return defaultTicketConfig;
  } catch (err) {
    console.error("[getTicketConfig]", err);
    return defaultTicketConfig;
  }
}
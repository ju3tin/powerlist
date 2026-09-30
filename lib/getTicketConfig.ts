import { connectDB } from "@/lib/mongodb";
import { TicketConfigModel, type TicketConfigData } from "@/models/TicketConfig";

export async function getTicketConfig(): Promise<TicketConfigData> {
  try {
    await connectDB();
    const doc = await TicketConfigModel.findOne({ key: "default" }).lean();
    return (doc?.config as TicketConfigData) ?? {};
  } catch {
    return {};
  }
}
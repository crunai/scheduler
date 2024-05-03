import { Response } from "express";
import { sanitiseString } from "../../../helper/parsing";
import { randomUUID } from "crypto";
import { z } from "zod";
import { checkTimezone } from "../../../helper/timing";

const schema = z
  .object({
    name: z.string().transform(sanitiseString),
    timezone: z
      .string()
      .refine(
        checkTimezone,
        "Timezone is invalid, must be IANA time zone. E.g. America/New_York",
      ),
    earliestHour: z.number().gte(0).lte(24).default(0),
    latestHour: z.number().gte(0).lte(24).default(24),
  })
  .refine((obj) => obj.latestHour > obj.earliestHour);

export abstract class ScheduleCreator {
  name: string;
  timezone: string;
  earliestHour: number;
  latestHour: number;

  constructor(body: unknown) {
    const result = schema.safeParse(body);
    if (!result.success) {
      throw result.error;
    }
    const { name, timezone, earliestHour, latestHour } = result.data;
    this.name = name;
    this.timezone = timezone;
    this.earliestHour = earliestHour;
    this.latestHour = latestHour;
  }

  async create(res: Response) {
    const uuid = String(randomUUID());
    await this.insertSchedule(uuid);
    res.json({ uuid });
  }

  abstract insertSchedule(uuid: string): Promise<void>;
}

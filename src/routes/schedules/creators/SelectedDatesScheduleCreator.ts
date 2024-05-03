import { z } from "zod";
import { ScheduleType, SchedulesCollection } from "../../../database";
import {
  createUTCDateTimeFromMillis,
  generateTimeRange,
} from "../../../helper/timing";
import { ScheduleCreator } from "./ScheduleCreator";
import { validUnixmsTime } from "../../../helper/parsing";
import { DateTime } from "luxon";
import { mergeMillisIntervals } from "../../../helper/interval";

const schema = z.object({
  dates: z
    .number()
    .refine(validUnixmsTime, "Must be valid unix ms")
    .array()
    .nonempty()
    .transform((dates) =>
      dates.map((date) => createUTCDateTimeFromMillis(date)),
    )
    .transform((dates) => new Set(dates)),
});

export class SelectedDateSchedulerCreator extends ScheduleCreator {
  private dates: Set<DateTime> = new Set();

  constructor(body: unknown) {
    super(body);

    const result = schema.safeParse(body);
    if (!result.success) {
      throw result.error;
    }
    this.dates = result.data.dates;
  }

  async insertSchedule(uuid: string): Promise<void> {
    await SchedulesCollection.insertMany({
      uuid: uuid,
      schedule_name: this.name,
      type: ScheduleType.SELECTEDDATES,
      allowable_time_range: mergeMillisIntervals(
        generateTimeRange(
          this.dates,
          this.earliestHour,
          this.latestHour,
          this.timezone,
        ),
      ),
      timezone: this.timezone,
      user_availabilities: new Map(),
      user_info: new Map(),
    });
  }
}

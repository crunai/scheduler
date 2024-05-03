import { z } from "zod";
import { ScheduleType, SchedulesCollection } from "../../../database";
import { generateDummyWeekTimeRange } from "../../../helper/timing";
import { ScheduleCreator } from "./ScheduleCreator";
import { mergeMillisIntervals } from "../../../helper/interval";

const schema = z.object({
  days: z
    .number()
    .gte(1)
    .lte(7)
    .array()
    .nonempty()
    .transform((days) => new Set(days)),
});

export class DaysInWeekScheduleCreator extends ScheduleCreator {
  private days: Set<number> = new Set();

  constructor(body: unknown) {
    super(body);

    const result = schema.safeParse(body);
    if (!result.success) {
      throw result.error;
    }
    this.days = result.data.days;
  }

  async insertSchedule(uuid: string): Promise<void> {
    await SchedulesCollection.insertMany({
      uuid: uuid,
      schedule_name: this.name,
      type: ScheduleType.DAYSINWEEK,
      allowable_time_range: mergeMillisIntervals(
        generateDummyWeekTimeRange(
          this.days,
          this.earliestHour,
          this.latestHour,
        ),
      ),
      timezone: this.timezone,
      user_availabilities: new Map(),
      user_info: new Map(),
    });
  }
}

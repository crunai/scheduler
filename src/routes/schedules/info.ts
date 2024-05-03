import { sendParsingError } from "../../helper/parsing";
import { z } from "zod";
import { Request, Response } from "express";
import { findSchedule } from "../../helper/query";

const schema = z.object({
  scheduleUUID: z.string(),
});

export const info = async (req: Request, res: Response) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    return sendParsingError(result.error, res);
  }

  const { scheduleUUID } = result.data;
  const scheduleQuery = await findSchedule(scheduleUUID, res);

  if (scheduleQuery.error) {
    return scheduleQuery.error;
  }

  const schedule = scheduleQuery.schedule;
  const user_availabilities = new Map();
  schedule.user_availabilities.forEach((availability, username) => {
    user_availabilities.set(
      username,
      availability.map(({ start, end, preference }) => {
        return {
          start,
          end,
          preference,
        };
      }),
    );
  });

  res.json({
    schedule_name: schedule.schedule_name,
    type: schedule.type,
    allowable_time_range: schedule.allowable_time_range.map((interval) => {
      return {
        start: interval.start,
        end: interval.end,
      };
    }),
    timezone: schedule.timezone,
    user_availabilities: Object.fromEntries(user_availabilities),
  });
};

import mongoose, { Schema } from "mongoose";

export const connectMongoose = async () => {
  const uri = process.env.MONGO_URI;
  if (uri) {
    await mongoose.connect(uri, {
      dbName: "SchedulingDB",
    });
  } else {
    console.error("No MongoDB URI found");
  }
};

export enum ScheduleType {
  SELECTEDDATES = "SELECTEDDATES",
  DAYSINWEEK = "DAYSINWEEK",
}

const TimeRange = new Schema({
  start: { type: Number, required: true },
  end: { type: Number, required: true },
});

export enum PreferenceType {
  NOTPREFERRED = 1,
  PREFERRED = 2,
}

const PreferredTimeRange = new Schema({
  start: { type: Number, required: true },
  end: { type: Number, required: true },
  preference: { type: Number, enum: PreferenceType, required: true },
});

const UserInfo = new Schema({
  scrypt_derived_key: { type: String, required: true },
  salt: { type: String, required: true },
  tokens: { type: [String], required: true },
});

export const SchedulesCollection = mongoose.model(
  "schedules",
  new Schema({
    uuid: { type: String, required: true },
    schedule_name: { type: String, required: true },
    type: { type: String, enum: ScheduleType, required: true },
    allowable_time_range: { type: [TimeRange], required: true },
    timezone: { type: String, required: true },
    user_availabilities: {
      type: Map,
      of: [PreferredTimeRange],
      required: true,
    },
    user_info: {
      type: Map,
      of: UserInfo,
      required: true,
    },
  }),
);

export const LogsCollection = mongoose.model(
  "logs",
  new Schema({
    message: { type: String, required: true },
    expireAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 7, // 7 day log expiry
    },
  }),
);

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { z } from "zod";
import { Response } from "express";

const scryptPassword = (password: string, salt: Buffer) => {
  const scryptDerivedKey = scryptSync(password, salt, 64);
  return scryptDerivedKey;
};

export const checkSamePassword = (
  password: string,
  salt: string,
  scryptDerivedKey: string,
) => {
  const scryptDerivedKeyGenerated = scryptPassword(
    password,
    Buffer.from(salt, "hex"),
  );
  return timingSafeEqual(
    scryptDerivedKeyGenerated,
    Buffer.from(scryptDerivedKey, "hex"),
  );
};

export const createNewScryptKey = (password: string) => {
  const salt = randomBytes(16);
  const scryptDerivedKey = scryptPassword(password, salt);
  return {
    scryptDerivedKey: scryptDerivedKey.toString("hex"),
    salt: salt.toString("hex"),
  };
};

export const getAuthToken = (authorization: unknown, res: Response) => {
  const result = z.string().safeParse(authorization);

  if (!result.success) {
    return { error: res.status(401).send("Token is not string") };
  }

  const permBearer = result.data;
  if (!permBearer.startsWith("Bearer ")) {
    return { error: res.status(401).send("Not authorised") };
  }

  return { token: permBearer.substring(7, permBearer.length) };
};

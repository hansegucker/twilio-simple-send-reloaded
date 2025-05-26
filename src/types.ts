import { PhoneNumber } from "libphonenumber-js";

export interface SettingsObject {
  fromNumber: string;
  accountSID: string;
  authToken: string;
}

export const COUNTRY_CODE = "DE";
export const SMS_LENGTH = 160;

export interface PhoneNumberStatus {
  number: PhoneNumber;
  status: boolean;
  running: boolean;
  textStatus: string;
  messageObject: { [key: string]: unknown };
}

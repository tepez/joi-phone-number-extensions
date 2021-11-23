import * as PhoneNumber from 'google-libphonenumber';


export const validRegions: string[] = Object.keys(
    // as any because metadata is not in @types/google-libphonenumber
    (PhoneNumber as any).metadata.countryToMetadata,
);
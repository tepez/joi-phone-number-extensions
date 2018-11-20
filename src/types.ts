import { PhoneNumberFormat as PNF, PhoneNumberType as PNT } from 'google-libphonenumber'
import * as Joi from 'joi'
import { Reference, StringSchema } from 'joi'


export interface PhoneNumberSchema extends StringSchema {
    defaultRegion(region: string): this

    region(region: string | Reference): this

    type(type: keyof typeof PNT | string): this

    format(format: keyof typeof PNF | string): this
}

export type JoiWithPhoneNumberExtension = typeof Joi & {
    phoneNumber(): PhoneNumberSchema
}
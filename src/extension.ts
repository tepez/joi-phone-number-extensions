import { MyReference, TypedExtension, TypedExtensionRule } from '@tepez/joi-misc-extensions';
import { assertT } from '@tepez/ts-utils';
import { PhoneNumberFormat as PNF, PhoneNumberType as PNT, PhoneNumberUtil } from 'google-libphonenumber'
import * as Joi from 'joi'
import { Reference } from 'joi'
import { phoneNumberExtensionsEnMessages } from './i18n/en';
import { validRegions } from './utils';
import { phoneNumberExtensionsHeMessages } from './i18n/he';

const Assert = require('@hapi/hoek/lib/assert');


interface IFlags {
    phoneNumberDefaultRegion?: string
    phoneNumberRegion?: string | Reference
    phoneNumberType?: keyof typeof PNT
    phoneNumberFormat?: keyof typeof PNF
}

const phoneNumberUtil = PhoneNumberUtil.getInstance();

function typesMatch(type1: PNT, type2: PNT): boolean {
    return type1 === type2 ||
        (type1 === PNT.FIXED_LINE_OR_MOBILE && (type2 === PNT.MOBILE || type2 === PNT.FIXED_LINE)) ||
        (type2 === PNT.FIXED_LINE_OR_MOBILE && (type1 === PNT.MOBILE || type1 === PNT.FIXED_LINE));
}

const assertUpperCaseString = (name: string, value: any, validValues: string[]): string => {
    Assert(value, name, 'is required');

    Assert(typeof value === 'string', name, 'must be a string');

    const ret = value.toUpperCase();

    Assert(validValues.includes(ret), name, 'must be one of', validValues.join(', '));

    return ret as string;
}

export const phoneNumExtensions = function (joi: typeof Joi): TypedExtension<IFlags> {
    const regionValidation = joi
        .string()
        .uppercase()
        .valid(...validRegions)
        .required();

    const pntKeys = Object.keys(PNT);
    const pnfKeys = Object.keys(PNF)

    return {
        type: 'phoneNumber',
        base: joi.string(),
        messages: {
            ...phoneNumberExtensionsEnMessages,
            he: phoneNumberExtensionsHeMessages,
        } as any, // joi types doesn't support languages but it's ok 
        // https://github.com/sideway/joi/blob/v17.4.2/lib/index.d.ts#L29
        validate(value, helpers) {
            if (!value) {
                return {
                    value,
                };
            }

            const phoneNumberRegion = helpers.schema.$_getFlag('phoneNumberRegion');
            const phoneNumberDefaultRegion = helpers.schema.$_getFlag('phoneNumberDefaultRegion');
            const phoneNumberType = helpers.schema.$_getFlag('phoneNumberType');
            const phoneNumberFormat = helpers.schema.$_getFlag('phoneNumberFormat');

            let regionSource: string | Reference = phoneNumberRegion
                || phoneNumberDefaultRegion
                || null;

            let region: string;

            if (joi.isRef(regionSource)) {
                region = (regionSource as MyReference).resolve(value, helpers.state, helpers.prefs);

                if (!region) {
                    return {
                        errors: helpers.error('phoneNumber.emptyFieldRef', { ref: regionSource.key }),
                    };
                }

                const regionValidationResult = regionValidation.validate(region);
                if (regionValidationResult.error) {
                    return {
                        errors: helpers.error('phoneNumber.illegalRefRegion', { ref: regionSource.key }),
                    };
                }
            } else {
                region = regionSource;
            }

            let parsedNumber;

            try {
                parsedNumber = phoneNumberUtil.parse(value, region);
            } catch (err) {
                return {
                    errors: helpers.error('phoneNumber.base', { value }),
                };
            }

            if (phoneNumberRegion) {
                if (!phoneNumberUtil.isValidNumberForRegion(parsedNumber, region)) {
                    return {
                        errors: helpers.error('phoneNumber.region', { value, region }),
                    };
                }
            } else if (!phoneNumberUtil.isValidNumber(parsedNumber)) {
                return {
                    errors: helpers.error('phoneNumber.base', { value }),
                };
            }

            if (phoneNumberType) {
                const numberType = phoneNumberUtil.getNumberType(parsedNumber);
                if (!typesMatch(PNT[phoneNumberType], numberType)) {
                    const context = {
                        value,
                        type: phoneNumberType,
                    };
                    return {
                        errors: helpers.error('phoneNumber.type', context),
                    };
                }
            }

            if (phoneNumberFormat) {
                const formattedNumber = phoneNumberUtil.format(parsedNumber, PNF[phoneNumberFormat]);
                if (helpers.prefs.convert) {
                    return {
                        value: formattedNumber,
                    };
                } else if (value !== formattedNumber) {
                    const context = {
                        value,
                        format: phoneNumberFormat,
                    };
                    return {
                        errors: helpers.error('phoneNumber.format', context),
                    };
                }
            }

            return {
                value: value,
            };
        },
        rules: {
            defaultRegion: assertT<TypedExtensionRule<{
                defaultRegion: string
            }, IFlags>>({
                // region that we are expecting the number to be from
                method(defaultRegion: string) {
                    return this.$_setFlag(
                        'phoneNumberDefaultRegion',
                        assertUpperCaseString('defaultRegion', defaultRegion, validRegions),
                    );
                },
            }),
            region: assertT<TypedExtensionRule<{
                region: string | Reference
            }, IFlags>>({
                method(region: string | Reference) {
                    return this.$_setFlag(
                        'phoneNumberRegion',
                        joi.isRef(region)
                            ? region
                            : assertUpperCaseString('region', region, validRegions),
                    );
                },
            }),
            numType: assertT<TypedExtensionRule<{
                type: keyof typeof PNT
            }, IFlags>>({
                method(type: keyof typeof PNT) {
                    return this.$_setFlag(
                        'phoneNumberType',
                        assertUpperCaseString('type', type, pntKeys) as keyof typeof PNT,
                    );
                },
            }),
            format: assertT<TypedExtensionRule<{
                format: keyof typeof PNF
            }, IFlags>>({
                method(format: keyof typeof PNF) {
                    return this.$_setFlag(
                        'phoneNumberFormat',
                        assertUpperCaseString('format', format, pnfKeys) as keyof typeof PNF,
                    );
                },
            }),
        },
    }
};


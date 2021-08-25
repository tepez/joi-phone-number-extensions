import { assertT } from '@tepez/ts-utils';
import * as PhoneNumber from 'google-libphonenumber'
import { PhoneNumberFormat as PNF, PhoneNumberType as PNT, PhoneNumberUtil } from 'google-libphonenumber'
import * as Joi from 'joi'
import { Err, Extension, ExtensionBoundSchema, Reference, Rules } from 'joi'


interface IFlags {
    phoneNumberDefaultRegion?: string
    phoneNumberRegion?: string | Reference
    phoneNumberType?: keyof typeof PNT
    phoneNumberFormat?: keyof typeof PNF
}

type ExtensionBoundSchemaWithFlags = ExtensionBoundSchema & {
    _flags: IFlags
}

const phoneNumberUtil = PhoneNumberUtil.getInstance();

function typesMatch(type1: PNT, type2: PNT): boolean {
    return type1 === type2 ||
        (type1 === PNT.FIXED_LINE_OR_MOBILE && (type2 === PNT.MOBILE || type2 === PNT.FIXED_LINE)) ||
        (type2 === PNT.FIXED_LINE_OR_MOBILE && (type1 === PNT.MOBILE || type1 === PNT.FIXED_LINE));
}

export const phoneNumExtensions = function (joi: typeof Joi): Extension {
    // as any because metadata is not in @types/google-libphonenumber
    const validRegions: string[] = Object.keys((PhoneNumber as any).metadata.countryToMetadata);

    const regionValidation = joi
        .string()
        .uppercase()
        .only(validRegions);

    return {
        base: joi.string(),
        name: 'phoneNumber',
        language: {
            base: 'must be a valid phone number',
            region: 'must be number of region {{region}}',
            emptyFieldRef: 'region reference "{{ref}}" must point to a non empty field',
            illegalRefRegion: `region reference "{{ref}}" must be one of [${validRegions.join(', ')}]`,
            type: 'must be a {{type}} phone number',
            format: 'must be formatted in {{format}} format',
        },
        coerce(this: ExtensionBoundSchemaWithFlags, value: string, state, options): string | Err {
            if (!value) {
                return value;
            }

            const flags = this._flags;

            let regionSource: string | Reference = flags.phoneNumberRegion
                || flags.phoneNumberDefaultRegion
                || null;

            let region: string;

            if (joi.isRef(regionSource)) {
                region = regionSource(state.reference || state.parent, options);

                if (!region) {
                    return this.createError('phoneNumber.emptyFieldRef', { ref: regionSource.key }, state, options);
                }

                const regionValidationResult = regionValidation.validate(region);
                if (regionValidationResult.error) {
                    return this.createError('phoneNumber.illegalRefRegion', { ref: regionSource.key }, state, options);
                }
            } else {
                region = regionSource;
            }

            let parsedNumber;

            try {
                parsedNumber = phoneNumberUtil.parse(value, region);
            } catch (err) {
                return this.createError('phoneNumber.base', { value }, state, options);
            }

            if (flags.phoneNumberRegion) {
                if (!phoneNumberUtil.isValidNumberForRegion(parsedNumber, region)) {
                    return this.createError('phoneNumber.region', { value, region }, state, options);
                }
            } else if (!phoneNumberUtil.isValidNumber(parsedNumber)) {
                return this.createError('phoneNumber.base', { value }, state, options);
            }

            if (flags.phoneNumberType) {
                const numberType = phoneNumberUtil.getNumberType(parsedNumber);
                if (!typesMatch(PNT[flags.phoneNumberType], numberType)) {
                    const context = {
                        value,
                        type: flags.phoneNumberType,
                    };
                    return this.createError('phoneNumber.type', context, state, options);
                }
            }

            if (flags.phoneNumberFormat) {
                const formattedNumber = phoneNumberUtil.format(parsedNumber, PNF[flags.phoneNumberFormat]);
                if (options.convert) {
                    return formattedNumber;
                } else if (value !== formattedNumber) {
                    const context = {
                        value,
                        format: flags.phoneNumberFormat,
                    };
                    return this.createError('phoneNumber.format', context, state, options);
                }
            }

            return value;
        },
        rules: [
            assertT<Rules<{
                defaultRegion: string
            }>>({
                // region that we are expecting the number to be from
                name: 'defaultRegion',
                params: {
                    defaultRegion: regionValidation,
                },
                description(params) {
                    return `Phone number should be of region ${params.defaultRegion} if not international`;
                },
                setup(this: ExtensionBoundSchemaWithFlags, params) {
                    this._flags.phoneNumberDefaultRegion = params.defaultRegion;
                },
                validate(_params, value, _state, _options) {
                    // No-op just to enable description
                    return value;
                },
            }),
            assertT<Rules<{
                region: string | Reference
            }>>({
                name: 'region',
                params: {
                    region: joi.alternatives([
                        regionValidation,
                        joi.func().ref(),
                    ]).required(),
                },
                description(params) {
                    return `Phone number should be of region ${params.region}`;
                },
                setup(this: ExtensionBoundSchemaWithFlags, params) {
                    this._flags.phoneNumberRegion = params.region;
                },
                validate(_params, value, _state, _options) {
                    // No-op just to enable description
                    return value;
                },
            }),
            assertT<Rules<{
                type: keyof typeof PNT
            }>>({
                name: 'type',
                params: {
                    type: joi
                        .string()
                        .uppercase()
                        .only(Object.keys(PNT))
                        .required(),
                },
                description(params) {
                    return `Phone number should should be a ${params.type} number`;
                },
                setup(this: ExtensionBoundSchemaWithFlags, params) {
                    this._flags.phoneNumberType = params.type;
                },
                validate(_params, value, _state, _options) {
                    // No-op just to enable description
                    return value;
                },
            }),
            assertT<Rules<{
                format: keyof typeof PNF
            }>>({
                name: 'format',
                params: {
                    format: joi
                        .string()
                        .uppercase()
                        .only(Object.keys(PNF))
                        .required(),
                },
                description(params) {
                    return `Phone number should be formatted according to ${params.format}`;
                },
                setup(this: ExtensionBoundSchemaWithFlags, params) {
                    this._flags.phoneNumberFormat = params.format;
                },
                validate(_params, value, _state, _options) {
                    // No-op just to enable description
                    return value;
                },
            }),
        ],
    }
};


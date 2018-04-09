'use strict';
const PhoneNumber = require('google-libphonenumber');
const findKey = require('lodash.findkey');


const phoneNumberUtil = PhoneNumber.PhoneNumberUtil.getInstance();
const PNT = PhoneNumber.PhoneNumberType;
const PNF = PhoneNumber.PhoneNumberFormat;

function normalizeType(type) {
    return typeof type === 'string'
        ? PNT[type]
        : type;
}

function typesMatch(type1, type2) {
    type1 = normalizeType(type1);
    type2 = normalizeType(type2);

    return type1 === type2 ||
        (type1 === PNT.FIXED_LINE_OR_MOBILE && (type2 === PNT.MOBILE || type2 === PNT.FIXED_LINE)) ||
        (type2 === PNT.FIXED_LINE_OR_MOBILE && (type1 === PNT.MOBILE || type1 === PNT.FIXED_LINE));
}

const formatToString = (format) => findKey(PNF, format);


module.exports = (joi) => {
    const regionValidation = joi
        .string()
        .uppercase()
        .only(Object.keys(PhoneNumber.metadata.countryToMetadata));

    return {
        base: joi.string(),
        name: 'phoneNumber',
        language: {
            base: 'must be a valid phone number',
            region: 'must be number of region {{region}}',
            emptyFieldRef: 'region reference "{{ref}}" must point to a non empty field',
            illegalRefRegion: `region reference "{{ref}}" must be one of [${Object.keys(PhoneNumber.metadata.countryToMetadata).join(', ')}]`,
            type: 'must be a {{type}} phone number',
            format: 'must be formatted in {{format}} format',
        },
        coerce(value, state, options) {
            if (!value) {
                return value;
            }

            let parsedNumber;

            const requiredRegion = this._flags.phoneNumberRegion;
            const requiredType = this._flags.phoneNumberType;
            const requiredFormat = this._flags.phoneNumberFormat;

            const defaultRegion = requiredRegion || this._flags.phoneNumberDefaultRegion || null;

            const isRef = joi.isRef(defaultRegion);
            const region = isRef ? defaultRegion(state.reference || state.parent, options) : defaultRegion;

            if (isRef) {
                if (!region) {
                    return this.createError('phoneNumber.emptyFieldRef', { ref: defaultRegion.key }, state, options);                    
                }

                const regionValidationResult = regionValidation.validate(region);
                if (regionValidationResult.error) {
                    return this.createError('phoneNumber.illegalRefRegion', { ref: defaultRegion.key }, state, options);
                }
            }

            try {
                parsedNumber = phoneNumberUtil.parse(value, region);
            } catch (err) {
                return this.createError('phoneNumber.base', { value }, state, options);
            }


            if (requiredRegion) {
                if (!phoneNumberUtil.isValidNumberForRegion(parsedNumber, region)) {
                    return this.createError('phoneNumber.region', { value, region: region }, state, options);
                }
            } else if (!phoneNumberUtil.isValidNumber(parsedNumber)) {
                return this.createError('phoneNumber.base', { value }, state, options);
            }

            if (requiredType) {
                const numberType = phoneNumberUtil.getNumberType(parsedNumber);
                if (!typesMatch(requiredType, numberType)) {
                    const context = {
                        value,
                        type: requiredType
                    };
                    return this.createError('phoneNumber.type', context, state, options);
                }
            }

            if (requiredFormat) {
                const formattedNumber = phoneNumberUtil.format(parsedNumber, PNF[requiredFormat]);
                if (options.convert) {
                    return formattedNumber;
                } else if (value !== formattedNumber) {
                    const context = {
                        value,
                        format: requiredFormat
                    };
                    return this.createError('phoneNumber.format', context, state, options);
                }
            }

            return value;
        },
        rules: [
            {
                // region that we are expecting the number to be from
                name: 'defaultRegion',
                params: {
                    defaultRegion: joi.string().uppercase().only(Object.keys(PhoneNumber.metadata.countryToMetadata)),
                },
                description(params) {
                    return `Phone number should be of region ${params.region} if not international`;
                },
                setup(params) {
                    this._flags.phoneNumberDefaultRegion = params.defaultRegion;
                },
                validate(params, value, state, options) {
                    // No-op just to enable description
                    return value;
                }
            },
            {
                name: 'region',
                params: {
                    region: joi.alternatives([
                        joi.string().uppercase().only(Object.keys(PhoneNumber.metadata.countryToMetadata)),
                        joi.func().ref()]).required()
                },
                description(params) {
                    return `Phone number should be of region ${params.region}`;
                },
                setup(params) {
                    this._flags.phoneNumberRegion = params.region;
                },
                validate(params, value, state, options) {
                    // No-op just to enable description
                    return value;
                }
            },
            {
                name: 'type',
                params: {
                    type: joi.string().uppercase().only(Object.keys(PNT)).required(),
                },
                description(params) {
                    return `Phone number should should be a ${params.type} number`;
                },
                setup(params) {
                    this._flags.phoneNumberType = params.type;
                },
                validate(params, value, state, options) {
                    // No-op just to enable description
                    return value;
                }
            },
            {
                name: 'format',
                params: {
                    format: joi.string().uppercase().only(Object.keys(PNF)).required(),
                },
                description(params) {
                    return `Phone number should be formatted according to ${params.format}`;
                },
                setup(params) {
                    this._flags.phoneNumberFormat = params.format;
                },
                validate(params, value, state, options) {
                    // No-op just to enable description
                    return value;
                }
            }
        ]
    }
};


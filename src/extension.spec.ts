import { addMatchers } from '@tepez/joi-jasmine-helpers'
import * as Joi from 'joi'
import Extension, { JoiWithPhoneNumberExtension, PhoneNumberSchema } from '.'


const ExtendedJoi: JoiWithPhoneNumberExtension = Joi.extend(Extension);


describe('phoneNumber', () => {
    let schema: PhoneNumberSchema;

    addMatchers();

    describe('passthrough empty values', () => {
        beforeEach(() => schema = ExtendedJoi.phoneNumber().allow('', null));

        it('should pass validation for international number', () => {
            expect(schema).toPassValidation(undefined, undefined);
            expect(schema).toPassValidation(null, null);
            expect(schema).toPassValidation('', '');
        });
    });

    describe('defaultRegion', () => {
        describe('when given', () => {
            beforeEach(() => schema = ExtendedJoi.phoneNumber().defaultRegion('US'));

            it('should pass validation for international number', () => {
                expect(schema).toPassValidation('+1 541-754-3010', '+1 541-754-3010');
                expect(schema).toPassValidation('+15417543010', '+15417543010');
            });

            it('should pass validation for national phone numbers from default region', () => {
                expect(schema).toPassValidation('(541) 754-3010', '(541) 754-3010');
            });

            it('should fail validation for national numbers from other regions', () => {
                expect(schema)
                    .toFailValidation('035555555', '"value" must be a valid phone number');
            });
        });

        describe('when not given', () => {
            beforeEach(() => schema = ExtendedJoi.phoneNumber());

            it('should pass validation for international number', () => {
                expect(schema).toPassValidation('+1 541-754-3010', '+1 541-754-3010');
                expect(schema).toPassValidation('+15417543010', '+15417543010');
            });

            it('should fail validation for non international number', () => {
                expect(schema)
                    .toFailValidation('(541) 754-3010', '"value" must be a valid phone number');
            });
        });
    });

    describe('region', () => {
        it('should throw if format is not supported', () => {
            expect(() => {
                ExtendedJoi.phoneNumber().region('XXX');
            }).toThrowError(/region must be one of .*UG, US, UY, UZ.*/);
        });

        it('should throw if region is empty', () => {
            expect(() => {
                (ExtendedJoi.phoneNumber() as any).region();
            }).toThrowError(/region is required/);
        });

        it('should accept in lower case as well', () => {
            const schema = ExtendedJoi.phoneNumber().region('us');
            expect(schema).toPassValidation('+1 541-754-3010', '+1 541-754-3010');
            expect(schema).toPassValidation('+15417543010', '+15417543010');
        });

        describe('when given', () => {
            beforeEach(() => schema = ExtendedJoi.phoneNumber().region('US'));

            it('should pass validation for international number', () => {
                expect(schema).toPassValidation('+1 541-754-3010', '+1 541-754-3010');
                expect(schema).toPassValidation('+15417543010', '+15417543010');
            });

            it('should pass validation for national phone numbers from default region', () => {
                expect(schema).toPassValidation('(541) 754-3010', '(541) 754-3010');
            });

            it('should fail validation for national numbers from other regions', () => {
                expect(schema)
                    .toFailValidation('035555555', '"value" must be number of region US');
            });
        });

        it('should accept value via Joi.ref and use it for validation', () => {
            const schema = ExtendedJoi.object().keys({
                phone: ExtendedJoi.phoneNumber().region(ExtendedJoi.ref('region')),
                region: ExtendedJoi.string(),
            });
            expect(schema).toPassValidation({
                phone: '+1 541-754-3010',
                region: 'US',
            });
            expect(schema).toFailValidation({
                phone: '+1 5555555',
                region: 'US',
            }, '"phone" must be number of region US');
        });

        it('should fail validation for Joi.ref with illegal value', () => {
            const schema = ExtendedJoi.object().keys({
                phone: ExtendedJoi.phoneNumber().region(ExtendedJoi.ref('region')),
                region: ExtendedJoi.string(),
            });
            expect(schema).toFailValidation({
                phone: '+1 541-754-3010',
                region: 'USA',
            }, /^region reference "region" must be one of \[.*UA, UG, US, UY, UZ.*]$/);
        });

        it('should fail validation for Joi.ref pointing to an empty field', () => {
            const schema = ExtendedJoi.object().keys({
                phone: ExtendedJoi.phoneNumber().region(ExtendedJoi.ref('NONFIELD')),
                region: ExtendedJoi.string(),
            });
            expect(schema).toFailValidation({
                phone: '+1 541-754-3010',
            }, 'region reference "NONFIELD" must point to a non empty field');
        });
    });

    describe('type', () => {
        it('should throw if format is not supported', () => {
            expect(() => {
                ExtendedJoi.phoneNumber().numType('XXX');
            }).toThrowError(/type must be one of FIXED_LINE, MOBILE, FIXED_LINE_OR_MOBILE, TOLL_FREE, PREMIUM_RATE, SHARED_COST, VOIP, PERSONAL_NUMBER, PAGER, UAN, VOICEMAIL, UNKNOWN/);
        });

        it('should throw if region is empty', () => {
            expect(() => {
                (ExtendedJoi.phoneNumber()).numType(undefined);
            }).toThrowError(/type is required/);

            expect(() => {
                (ExtendedJoi.phoneNumber()).numType(null);
            }).toThrowError(/type is required/);
        });

        it('should accept in lower case as well', () => {
            const schema = ExtendedJoi.phoneNumber().numType('fixed_line');
            expect(schema).toPassValidation('+1 541-754-3010', '+1 541-754-3010');
            expect(schema).toPassValidation('+15417543010', '+15417543010');
        });

        describe('when given', () => {
            beforeEach(() => schema = ExtendedJoi.phoneNumber().numType('FIXED_LINE'));

            it('should pass for numbers of that type', () => {
                expect(schema).toPassValidation('+1 541-754-3010', '+1 541-754-3010');
                expect(schema).toPassValidation('+97235555555', '+97235555555');
            });

            it('should fail validation for national numbers from other types', () => {
                expect(schema)
                    .toFailValidation('+33752961860', '"value" must be a FIXED_LINE phone number');
                expect(schema)
                    .toFailValidation('+972525555555', '"value" must be a FIXED_LINE phone number');
            });
        });
    });

    describe('format', () => {
        it('should throw if format is not supported', () => {
            expect(() => {
                ExtendedJoi.phoneNumber().format('xxx');
            }).toThrowError(/format must be one of E164, INTERNATIONAL, NATIONAL, RFC3966/);
        });

        it('should throw if format is not given', () => {
            expect(() => {
                ExtendedJoi.phoneNumber().format(undefined);
            }).toThrowError(/format is required/);

            expect(() => {
                ExtendedJoi.phoneNumber().format(null);
            }).toThrowError(/format is required/);
        });

        it('should allow format to be lowercase', () => {
            const schema = ExtendedJoi.phoneNumber().format('international');
            expect(schema).toPassValidation('+1 541-754-3010', '+1 541-754-3010');
        });

        describe('when convert=true (default)', () => {
            it('should convert number to format', () => {
                expect(ExtendedJoi.phoneNumber().format('NATIONAL'))
                    .toPassValidation('+1-541-754-3010', '(541) 754-3010');

                expect(ExtendedJoi.phoneNumber().format('E164'))
                    .toPassValidation('+1-541-754-3010', '+15417543010');
            })
        });

        describe('when convert=false', () => {
            it('should fail when number is not already formatted', () => {
                const schema = ExtendedJoi.phoneNumber().format('NATIONAL');
                expect(schema).toFailValidation('+1-541-754-3010', '"value" must be formatted in NATIONAL format', { convert: false })
            });
        });
    });

    it('should support .any methods', () => {
        const schema = ExtendedJoi.phoneNumber().valid('+972-52-5555555');
        expect(schema).toPassValidation('+972-52-5555555', '+972-52-5555555');
    });

    it('should support .string methods', () => {
        const schema = ExtendedJoi.phoneNumber().max(13);
        expect(schema).toPassValidation('+972525555555', '+972525555555');
        expect(schema).toFailValidation('+972-52-5555555', '"value" length must be less than or equal to 13 characters long')
    });

    describe('required', () => {
        describe('when not required', () => {
            beforeEach(() => {
                schema = ExtendedJoi.phoneNumber()
                    .format('INTERNATIONAL')
                    .region('US')
                    .numType('FIXED_LINE');
            });

            it('should pass validation when given undefined', () => {
                expect(schema).toPassValidation(undefined, undefined);
            });

            it('should fail validation when given null', () => {
                expect(schema).toFailValidation(null, '"value" must be a string');
            });

            it('should pass validation when given null and null is allowed', () => {
                expect(schema.allow(null)).toPassValidation(null, null);
            });
        });

        describe('when required', () => {
            beforeEach(() => {
                schema = ExtendedJoi.phoneNumber()
                    .format('INTERNATIONAL')
                    .region('US')
                    .numType('FIXED_LINE')
                    .required();
            });

            it('should fail validation when given undefined', () => {
                expect(schema).toFailValidation(undefined, '"value" is required');
            });

            it('should fail validation when given null', () => {
                expect(schema).toFailValidation(null, '"value" must be a string');
            });

            it('should pass validation when given null and null is allowed', () => {
                expect(schema.allow(null)).toPassValidation(null, null);
            });
        });
    });
});
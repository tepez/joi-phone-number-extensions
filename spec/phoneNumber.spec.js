'use strict';
const BaseJoi = require('joi');
const Extension = require('../');


const Joi = BaseJoi.extend(Extension);

describe('phoneNumber', () => {
    let spec;
    afterEach(() => spec = null);
    beforeEach(function () {
        spec = this;
    });

    describe('defaultRegion', () => {
        describe('when given', () => {
            beforeEach(() => spec.schema = Joi.phoneNumber().defaultRegion('US'));

            it('should pass validation for international number', () => {
                expect(spec.schema).toPassValidation('+1 541-754-3010', '+1 541-754-3010');
                expect(spec.schema).toPassValidation('+15417543010', '+15417543010');
            });

            it('should pass validation for national phone numbers from default region', () => {
                expect(spec.schema).toPassValidation('(541) 754-3010', '(541) 754-3010');
            });

            it('should fail validation for national numbers from other regions', () => {
                expect(spec.schema)
                    .toFailValidation('035555555', '"value" must be a valid phone number');
            });
        });

        describe('when not given', () => {
            beforeEach(() => spec.schema = Joi.phoneNumber());

            it('should pass validation for international number', () => {
                expect(spec.schema).toPassValidation('+1 541-754-3010', '+1 541-754-3010');
                expect(spec.schema).toPassValidation('+15417543010', '+15417543010');
            });

            it('should fail validation for non international number', () => {
                expect(spec.schema)
                    .toFailValidation('(541) 754-3010', '"value" must be a valid phone number');
            });
        });
    });

    describe('region', () => {
        it('should throw if format is not supported', () => {
            expect(() => {
                Joi.phoneNumber().region('XXX');
            }).toThrowError(/"region" must be one of \[.*UG, US, UY, UZ.*]/);
        });

        it('should throw if region is empty', () => {
            expect(() => {
                Joi.phoneNumber().region();
            }).toThrowError(/"region" is required/);
        });

        it('should accept in lower case as well', () => {
            const schema = Joi.phoneNumber().region('us');
            expect(schema).toPassValidation('+1 541-754-3010', '+1 541-754-3010');
            expect(schema).toPassValidation('+15417543010', '+15417543010');
        });

        describe('when given', () => {
            beforeEach(() => spec.schema = Joi.phoneNumber().region('US'));

            it('should pass validation for international number', () => {
                expect(spec.schema).toPassValidation('+1 541-754-3010', '+1 541-754-3010');
                expect(spec.schema).toPassValidation('+15417543010', '+15417543010');
            });

            it('should pass validation for national phone numbers from default region', () => {
                expect(spec.schema).toPassValidation('(541) 754-3010', '(541) 754-3010');
            });

            it('should fail validation for national numbers from other regions', () => {
                expect(spec.schema)
                    .toFailValidation('035555555', '"value" must be number of region US');
            });
        });

        it('should accept value via Joi.ref and use it for validation', () => {
            const schema = Joi.object().keys({
                phone: Joi.phoneNumber().region(Joi.ref('region')),
                region: Joi.string()
            });
            expect(schema).toPassValidation({
                phone: '+1 541-754-3010',
                region: 'US'
            });
            expect(schema).toFailValidation({
                phone: '+1 5555555',
                region: 'US'
            }, 'child "phone" fails because ["phone" must be number of region US]');
        });

        it('should fail validation for Joi.ref with illegal value', () => {
            const schema = Joi.object().keys({
                phone: Joi.phoneNumber().region(Joi.ref('region')),
                region: Joi.string()
            });
            expect(schema).toFailValidation({
                phone: '+1 541-754-3010',
                region: 'USA'
            }, /^child "phone" fails because \["phone" region reference "region" must be one of \[.*UA, UG, US, UY, UZ.*]]$/);
        });

        it('should fail validation for Joi.ref pointing to an empty field', () => {
            const schema = Joi.object().keys({
                phone: Joi.phoneNumber().region(Joi.ref('NONFIELD')),
                region: Joi.string()
            });
            expect(schema).toFailValidation({
                phone: '+1 541-754-3010'
            }, 'child "phone" fails because ["phone" region reference "NONFIELD" must point to a non empty field]');
        });
    });

    describe('type', () => {
        it('should throw if format is not supported', () => {
            expect(() => {
                Joi.phoneNumber().type('XXX');
            }).toThrowError(/"type" must be one of \[FIXED_LINE, MOBILE, FIXED_LINE_OR_MOBILE, TOLL_FREE, PREMIUM_RATE, SHARED_COST, VOIP, PERSONAL_NUMBER, PAGER, UAN, VOICEMAIL, UNKNOWN]/);
        });

        it('should throw if region is empty', () => {
            expect(() => {
                Joi.phoneNumber().type();
            }).toThrowError(/"type" is required/);
        });

        it('should accept in lower case as well', () => {
            const schema = Joi.phoneNumber().type('fixed_line');
            expect(schema).toPassValidation('+1 541-754-3010', '+1 541-754-3010');
            expect(schema).toPassValidation('+15417543010', '+15417543010');
        });

        describe('when given', () => {
            beforeEach(() => spec.schema = Joi.phoneNumber().type('FIXED_LINE'));

            it('should pass for numbers of that type', () => {
                expect(spec.schema).toPassValidation('+1 541-754-3010', '+1 541-754-3010');
                expect(spec.schema).toPassValidation('+97235555555', '+97235555555');
            });

            it('should fail validation for national numbers from other types', () => {
                expect(spec.schema)
                    .toFailValidation('+33752961860', '"value" must be a FIXED_LINE phone number');
                expect(spec.schema)
                    .toFailValidation('+972525555555', '"value" must be a FIXED_LINE phone number');
            });
        });
    });

    describe('format', () => {
        it('should throw if format is not supported', () => {
            expect(() => {
                Joi.phoneNumber().format('XXX');
            }).toThrowError(/"format" must be one of \[E164, INTERNATIONAL, NATIONAL, RFC3966]/);
        });

        it('should throw if format is not given', () => {
            expect(() => {
                Joi.phoneNumber().format();
            }).toThrowError(/"format" is required/);
        });

        it('should allow format to be lowercase', () => {
            const schema = Joi.phoneNumber().format('international');
            expect(schema).toPassValidation('+1 541-754-3010', '+1 541-754-3010');
        });

        describe('when convert=true (default)', () => {
            it('should convert number to format', () => {
                expect(Joi.phoneNumber().format('NATIONAL'))
                    .toPassValidation('+1-541-754-3010', '(541) 754-3010');

                expect(Joi.phoneNumber().format('E164'))
                    .toPassValidation('+1-541-754-3010', '+15417543010');
            })
        });

        describe('when convert=false', () => {
            it('should fail when number is not already formatted', () => {
                const schema = Joi.phoneNumber().format('NATIONAL');
                expect(schema).toFailValidation('+1-541-754-3010', '"value" must be formatted in NATIONAL format', {convert: false})
            });
        });
    });

    it('should support .any methods', () => {
        const schema = Joi.phoneNumber().valid('+972-52-5555555');
        expect(schema).toPassValidation('+972-52-5555555', '+972-52-5555555');
    });

    it('should support .string methods', () => {
        const schema = Joi.phoneNumber().max(13);
        expect(schema).toPassValidation('+972525555555', '+972525555555');
        expect(schema).toFailValidation('+972-52-5555555', '"value" length must be less than or equal to 13 characters long')
    });

    describe('required', () => {
        describe('when not required', () => {
            beforeEach(() => {
                spec.schema = Joi.phoneNumber()
                    .format('INTERNATIONAL')
                    .region('US')
                    .type('FIXED_LINE');
            });

            it('should pass validation when given undefined', () => {
                expect(spec.schema).toPassValidation(undefined, undefined);
            });

            it('should fail validation when given null', () => {
                expect(spec.schema).toFailValidation(null, '"value" must be a string');
            });

            it('should pass validation when given null and null is allowed', () => {
                expect(spec.schema.allow(null)).toPassValidation(null, null);
            });
        });

        describe('when required', () => {
            beforeEach(() => {
                spec.schema = Joi.phoneNumber()
                    .format('INTERNATIONAL')
                    .region('US')
                    .type('FIXED_LINE')
                    .required();
            });

            it('should fail validation when given undefined', () => {
                expect(spec.schema).toFailValidation(undefined, '"value" is required');
            });

            it('should fail validation when given null', () => {
                expect(spec.schema).toFailValidation(null, '"value" must be a string');
            });

            it('should pass validation when given null and null is allowed', () => {
                expect(spec.schema.allow(null)).toPassValidation(null, null);
            });
        });
    });
});
import { validRegions } from '../utils';

export const phoneNumberExtensionsEnMessages = {
    'phoneNumber.base': '{{#label}} must be a valid phone number',
    'phoneNumber.region': '{{#label}} must be number of region {{#region}}',
    'phoneNumber.emptyFieldRef': 'region reference "{{#ref}}" must point to a non empty field',
    'phoneNumber.illegalRefRegion': `region reference "{{#ref}}" must be one of [${validRegions.join(', ')}]`,
    'phoneNumber.type': '{{#label}} must be a {{#type}} phone number',
    'phoneNumber.format': '{{#label}} must be formatted in {{#format}} format',
};
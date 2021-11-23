import { validRegions } from '../utils';
import { phoneNumberExtensionsEnMessages } from './en';

export const phoneNumberExtensionsHeMessages: typeof phoneNumberExtensionsEnMessages = {
    'phoneNumber.base': '{{#label}} צריך להיות מספר טלפון תקין',
    'phoneNumber.region': '{{#label}} צריך להיות מספר טלפון תקין מ-{{#region}}',
    'phoneNumber.emptyFieldRef': 'ההפניה לאיזור "{{#ref}}" צריכה להוביל לשדה שאינו ריק',
    'phoneNumber.illegalRefRegion': `ההפנייה לאיזור "{{#ref}}" צריכה להוביל לאחד מ-[${validRegions.join(', ')}]`,
    'phoneNumber.type': '{{#label}} צריך להיות מספר טלפון מסוג {{#type}}',
    'phoneNumber.format': '{{#label}} צריך להיות בפורמט של {{#format}}',
};

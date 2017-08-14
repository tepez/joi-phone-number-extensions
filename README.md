# joi-phone-number-extensions
> A joi extension for validating and formatting phone numbers using [google-libphonenumber](https://github.com/ruimarinho/google-libphonenumber)

[![npm version](https://badge.fury.io/js/joi-phone-number-extensions.svg)](http://badge.fury.io/js/joi-phone-number-extensions)
[![Build Status](https://secure.travis-ci.org/tepez/joi-phone-number-extensions.svg?branch=master)](http://travis-ci.org/tepez/joi-phone-number-extensions)

## Usage

```
const BaseJoi = require('joi');
const JoiPhoneNumberExtensions = require('./');
const Joi = BaseJoi.extend(JoiPhoneNumberExtensions);

const schema = Joi.phoneNumber().defaultRegion('US').type('MOBILE').format('E164');
schema.validate('+1 541-754-3010', (err, value) => {
    console.log(value) // +15417543010
});
```

## API

### `phoneNumber` - inherits from `string`

Generates a schema object that matches phone numbers.

#### `phoneNumber.defaultRegion(regionCode)`

Use this region code as default if given a non-international number.

`regionCode` is one of the code supported by [libphonenumber](https://github.com/ruimarinho/google-libphonenumber), e.g. UG, US, UY or UZ.

```js
const withDefaultRegion = Joi.phoneNumber().defaultRegion('US');
const withoutDefaultRegion = Joi.phoneNumber();

// valid
withDefaultRegion.validate('(541) 754-3010');

withDefaultRegion.validate('+1 541-754-3010');
withoutDefaultRegion.validate('+1 541-754-3010');

// invalid
withoutDefaultRegion.validate('(541) 754-3010');
```

#### `phoneNumber.region(regionCode)`

Require the number to be a valid number in given region.

`regionCode` is one of the code supported by [libphonenumber](https://github.com/ruimarinho/google-libphonenumber), e.g. UG, US, UY or UZ.

```js
const schema = Joi.phoneNumber().region('FR');

// valid
schema.validate('+33752961860');

// invalid
schema.validate('+1 541-754-3010');
```

#### `phoneNumber.type(type)`

Require the number to a valid number of given type.

`type` must be one of the types supported by  [libphonenumber](https://github.com/ruimarinho/google-libphonenumber), e.g. FIXED_LINE, MOBILE, FIXED_LINE_OR_MOBILE, TOLL_FREE, PREMIUM_RATE, SHARED_COST, VOIP, PERSONAL_NUMBER, PAGER, UAN, VOICEMAIL or UNKNOWN.

```js
const schema = Joi.phoneNumber().type('FIXED_LINE');

// valid
schema.validate('+1 541-754-3010');

// invalid
schema.validate('+972525555555');
```

#### `phoneNumber.format(format)`

Requires the number to be formatted in given format. If the validation `convert` option is on
(enabled by default), will return the number as formatted in given format.

`format` must be one of the types supported by  [libphonenumber](https://github.com/ruimarinho/google-libphonenumber), e.g. E164, INTERNATIONAL, NATIONAL or RFC3966.

```js
Joi.phoneNumber().format('NATIONAL').validate('+1-541-754-3010')
// (541) 754-3010'

Joi.phoneNumber().format('E164').validate('+1-541-754-3010')
// +15417543010
```

*See tests for more examples*
import { getPersonalInfoFromEnv } from '../../utils/index';

export interface FieldMapping {
    keywords: string[];
    value: string;
    label: string;
    instruction: string;
}
export const useApplierFiller = () => {
    const info = getPersonalInfoFromEnv();
    const fieldMappings = [
    {
      keywords: ['first name', 'firstname', 'given name'],
      value: info.firstName,
      label: 'First Name',
      instruction: `Fill in the first name field with "${info.firstName}"`
    },
    {
      keywords: ['last name', 'lastname', 'surname', 'family name'],
      value: info.lastName,
      label: 'Last Name',
      instruction: `Fill in the last name field with "${info.lastName}"`
    },
    {
      keywords: ['email', 'e-mail', 'email address'],
      value: info.email,
      label: 'Email',
      instruction: `Fill in the email field with "${info.email}"`
    },
    {
      keywords: ['phone', 'telephone', 'mobile', 'cell'],
      value: info.phone,
      label: 'Phone Number',
      instruction: `Fill in the phone number field with "${info.phone}". 
        If there's a country code dropdown and it is not set to ${info.countryCode}, 
        select the appropriate country code first.
        Then fill the phone number field with ${info.phoneWithoutCountryCode}.
        If the field doesn't accept the country code, try the full number ${info.phone}`
    },
    {
      keywords: ['linkedin', 'linkedin url', 'linkedin profile'],
      value: info.linkedinUrl,
      label: 'LinkedIn URL',
      instruction: `Fill in the LinkedIn URL field with "${info.linkedinUrl}"`
    },
    {
      keywords: ['country', 'nationality'],
      value: info.country,
      label: 'Country',
      instruction: `Fill in the country field with "${info.country}"`
    },
    {
      keywords: ['city', 'location', 'current city'],
      value: info.city || 'Your City',
      label: 'City',
      instruction: `Fill in the city field with "${info.city || 'Your City'}"`
    },
  ];

  return { fieldMappings };
}